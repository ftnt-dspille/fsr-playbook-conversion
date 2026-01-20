// FSR to FAS conversion

// Helper function to safely convert FSR date (Unix timestamp) to FAS date (ISO string)
function convertUnixToISO(dateValue) {
    // If no date provided, use current time
    if (!dateValue && dateValue !== 0) {
        return new Date().toISOString();
    }

    // If it's a string (already ISO), return as-is
    if (typeof dateValue === 'string') {
        // Validate it's a proper ISO string
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            return dateValue;
        }
        console.warn(`Invalid date string: ${dateValue}, using current time`);
        return new Date().toISOString();
    }

    // Convert Unix timestamp to milliseconds if needed
    let timestamp = dateValue;
    if (timestamp < 10000000000) {
        // Looks like seconds, convert to milliseconds
        timestamp = timestamp * 1000;
    }

    const date = new Date(timestamp);

    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.warn(`Invalid date value: ${dateValue}, using current time`);
        return new Date().toISOString();
    }

    return date.toISOString();
}

function convertFSRtoFAS(fsrJson) {
    const fsr = JSON.parse(fsrJson);

    if (fsr.type !== 'workflow_collections') {
        throw new Error('Input must be a FortiSOAR workflow_collections export');
    }

    const fas = {
        type: 'playbook_collections',
        data: [],
        versions: [],
        _conversionSummary: {
            totalUnsupportedSteps: 0,
            totalUnknownSteps: 0,
            totalManualStartsConverted: 0,
            unsupportedByType: {},
            unknownStepTypes: {},
            playbooksWithUnsupported: [],
            playbooksWithUnknown: [],
            playbooksWithManualStarts: []
        }
    };

    fsr.data.forEach(collection => {
        const fasCollection = {
            '@id': `/api/workflow/playbook-collections/${collection.uuid}/`,
            uuid: collection.uuid,
            createDate: convertUnixToISO(collection.createDate),
            modifyDate: convertUnixToISO(collection.modifyDate),
            deletedAt: collection.deletedAt || null,
            name: collection.name || '',
            description: collection.description || null,
            visible: collection.visible !== undefined ? collection.visible : true,
            image: collection.image || null,
            importedBy: collection.importedBy || {},
            createUser: collection.createUser ? extractUUID(collection.createUser) : generateUUID(),
            modifyUser: collection.modifyUser ? extractUUID(collection.modifyUser) : generateUUID(),
            tags: collection.recordTags || [],
            '@type': 'WorkflowCollection',
            playbooks: []
        };

        if (collection.workflows) {
            collection.workflows.forEach(workflow => {
                const playbook = convertWorkflowToPlaybook(workflow, fasCollection);

                // Track conversion statistics
                if (playbook._conversionStats) {
                    const unsupportedSteps = playbook._conversionStats.unsupportedSteps.filter(s => s.category === 'unsupported');
                    const unknownSteps = playbook._conversionStats.unsupportedSteps.filter(s => s.category === 'unknown');
                    const manualStartSteps = playbook._conversionStats.supportedSteps.filter(s => s.note && s.note.includes('Manual start'));

                    // Track unsupported steps
                    if (unsupportedSteps.length > 0) {
                        fas._conversionSummary.totalUnsupportedSteps += unsupportedSteps.length;
                        fas._conversionSummary.playbooksWithUnsupported.push({
                            name: playbook.name,
                            uuid: playbook.uuid,
                            unsupportedSteps: unsupportedSteps
                        });

                        unsupportedSteps.forEach(step => {
                            if (!fas._conversionSummary.unsupportedByType[step.type]) {
                                fas._conversionSummary.unsupportedByType[step.type] = 0;
                            }
                            fas._conversionSummary.unsupportedByType[step.type]++;
                        });
                    }

                    // Track unknown steps
                    if (unknownSteps.length > 0) {
                        fas._conversionSummary.totalUnknownSteps += unknownSteps.length;
                        fas._conversionSummary.playbooksWithUnknown.push({
                            name: playbook.name,
                            uuid: playbook.uuid,
                            unknownSteps: unknownSteps
                        });

                        unknownSteps.forEach(step => {
                            const key = `UUID: ${step.stepTypeUuid}`;
                            if (!fas._conversionSummary.unknownStepTypes[key]) {
                                fas._conversionSummary.unknownStepTypes[key] = {
                                    count: 0,
                                    examples: []
                                };
                            }
                            fas._conversionSummary.unknownStepTypes[key].count++;
                            fas._conversionSummary.unknownStepTypes[key].examples.push(step.name);
                        });
                    }

                    // Track manual start conversions
                    if (manualStartSteps.length > 0) {
                        fas._conversionSummary.totalManualStartsConverted += manualStartSteps.length;
                        fas._conversionSummary.playbooksWithManualStarts.push({
                            name: playbook.name,
                            uuid: playbook.uuid,
                            manualStarts: manualStartSteps.map(s => ({name: s.name, uuid: s.uuid}))
                        });
                    }
                }

                // Remove internal stats before adding to output
                delete playbook._conversionStats;

                fasCollection.playbooks.push(playbook);

                const version = createVersionEntry(playbook);
                fas.versions.push(version);
            });
        }

        fas.data.push(fasCollection);
    });

    return fas;
}


function fixDecisionStepIRIs(arguments) {
    // Deep clone to avoid modifying original
    const fixedArgs = JSON.parse(JSON.stringify(arguments));

    // Check if this has conditions array (Decision step)
    if (fixedArgs.conditions && Array.isArray(fixedArgs.conditions)) {
        fixedArgs.conditions.forEach(condition => {
            // Convert /api/3/workflow_steps/UUID to api/3/workflow_steps/UUID (remove leading slash)
            if (condition.step_iri && typeof condition.step_iri === 'string') {
                // If it has leading slash, remove it
                if (condition.step_iri.startsWith('/api/3/workflow_steps/')) {
                    condition.step_iri = condition.step_iri.substring(1);
                }
                // If it's just UUID, add the prefix without leading slash
                else if (!condition.step_iri.startsWith('api/3/workflow_steps/')) {
                    condition.step_iri = 'api/3/workflow_steps/' + condition.step_iri;
                }
            }
        });
    }

    return fixedArgs;
}

function fixConnectorStep(arguments) {
    // Deep clone to avoid modifying original
    const fixedArgs = JSON.parse(JSON.stringify(arguments));

    // If this is a connector step, ensure it has proper FAS structure
    if (fixedArgs.connector) {
        // Preserve existing fields but ensure required FAS fields exist
        return {
            name: fixedArgs.name || fixedArgs.connector.toUpperCase(),
            config: fixedArgs.config || '',
            params: fixedArgs.params || {},
            version: fixedArgs.version || '1.0.0',
            connector: fixedArgs.connector,
            operation: fixedArgs.operation || '',
            ...fixedArgs // Keep any additional fields
        };
    }

    return fixedArgs;
}

function fixManualInputStepUUIDs(arguments) {
    // Deep clone to avoid modifying original
    const fixedArgs = JSON.parse(JSON.stringify(arguments));

    // Check if this has response_mapping.options (Manual Input step)
    if (fixedArgs.response_mapping &&
        fixedArgs.response_mapping.options &&
        Array.isArray(fixedArgs.response_mapping.options)) {

        fixedArgs.response_mapping.options.forEach(option => {
            // Convert /api/3/workflow_steps/UUID to api/3/workflow_steps/UUID (remove leading slash)
            if (option.step_uuid && typeof option.step_uuid === 'string') {
                // If it has leading slash, remove it
                if (option.step_uuid.startsWith('/api/3/workflow_steps/')) {
                    option.step_uuid = option.step_uuid.substring(1);
                }
                // If it's just UUID, add the prefix without leading slash
                else if (!option.step_uuid.startsWith('api/3/workflow_steps/')) {
                    option.step_uuid = 'api/3/workflow_steps/' + option.step_uuid;
                }
            }
        });
    }

    return fixedArgs;
}

function convertFSRStartToReferenced(step, playbookUuid) {
    const args = step.arguments || {};
    const stepTypeUuid = step.stepType ? step.stepType.replace('/api/3/workflow_step_types/', '') : '';
    const startTypeName = FSR_START_STEP_TYPES[stepTypeUuid] || 'Unknown Start';

    // Extract input parameters if they exist
    const existingParams = args.step_variables?.input?.params || {};
    const paramNames = typeof existingParams === 'object' && !Array.isArray(existingParams)
        ? Object.keys(existingParams)
        : [];

    // Build description based on start type
    let description = `Converted from ${startTypeName} step. `;

    if (args.resource || args.resources) {
        const resources = args.resources || [args.resource];
        description += `Original trigger was for resource(s): ${JSON.stringify(resources)}. `;
    }

    if (args.route) {
        description += `Original route: ${args.route}. `;
    }

    if (args.fieldbasedtrigger) {
        description += `Had field-based trigger conditions. `;
    }

    description += `FAS requires referenced playbooks only - this playbook must be called by another playbook or via API. Original configuration preserved in _originalStartStep as JSON string.`;

    // Preserve COMPLETE original step configuration
    const originalStep = {
        '@type': step['@type'],
        name: step.name,
        description: step.description,
        stepType: step.stepType,
        arguments: JSON.parse(JSON.stringify(step.arguments)), // Deep copy
        status: step.status,
        top: step.top,
        left: step.left,
        group: step.group,
        uuid: step.uuid,
        _conversionNote: `Original ${startTypeName} step. All fields preserved for reference.`
    };

    // Convert to JSON string
    const originalStartStepString = JSON.stringify(originalStep, null, 2);

    // Create a referenced start step for FAS
    return {
        uuid: step.uuid || generateUUID(),
        workflow: playbookUuid,
        name: step.name || 'Start',
        description: description,
        arguments: {
            __triggerLimit: true,
            step_variables: {
                input: {
                    params: paramNames.length > 0 ? paramNames : []
                }
            },
            triggerOnSource: true,
            triggerOnReplicate: false,
            _originalStartStep: originalStartStepString
        },
        status: step.status || null,
        top: String(step.top || 0),
        left: String(step.left || 0),
        workflowgroup: step.group || null,
        stepType: FAS_START_STEP_TYPE,
        '@type': 'WorkflowStep'
    };
}

function convertUnsupportedStep(step, playbookUuid, isUnknown = false) {
    const stepTypeUuid = step.stepType ? step.stepType.replace('/api/3/workflow_step_types/', '') : '';
    const stepTypeName = UNSUPPORTED_STEP_TYPES[stepTypeUuid] || (isUnknown ? 'Unknown Step Type' : 'Unknown');

    const prefix = isUnknown ? 'UNKNOWN' : 'UNSUPPORTED';
    const description = isUnknown
        ? `Unknown step type (UUID: ${stepTypeUuid}). This step type is not recognized by the converter. Original configuration preserved in _tmp variable as JSON string. Please verify if this step type is supported in FAS before importing.`
        : `Original step type: ${stepTypeName}. This step is not supported in FAS and has been converted to a Set Variable step. Original configuration preserved in _tmp variable as JSON string.`;

    // Preserve COMPLETE original step configuration
    const originalStep = {
        '@type': step['@type'],
        name: step.name,
        description: step.description,
        stepType: step.stepType,
        arguments: JSON.parse(JSON.stringify(step.arguments || {})), // Deep copy
        status: step.status,
        top: step.top,
        left: step.left,
        group: step.group,
        uuid: step.uuid,
        _conversionNote: isUnknown
            ? `Original ${stepTypeName} step (UUID: ${stepTypeUuid}). This step type was unknown to the converter. It may be a new FSR step type or a custom step. Verify support in FAS.`
            : `Original ${stepTypeName} step. This step type is known to be unsupported in FAS. Manual recreation required. All original fields preserved for reference.`
    };

    // Convert to JSON string for Set Variable step
    const tmpValue = JSON.stringify(originalStep, null, 2);

    // Create a Set Variable step with UNSUPPORTED/UNKNOWN prefix
    return {
        uuid: step.uuid || generateUUID(),
        workflow: playbookUuid,
        name: `${prefix}: ${step.name || stepTypeName}`,
        description: description,
        arguments: {
            _tmp: tmpValue
        },
        status: step.status || null,
        top: String(step.top || 0),
        left: String(step.left || 0),
        workflowgroup: step.group || null,
        stepType: SET_VARIABLE_STEP_TYPE,
        '@type': 'WorkflowStep'
    };
}

function convertWorkflowToPlaybook(workflow, fasCollection) {
    const playbookUuid = workflow.uuid || generateUUID();
    const conversionStats = {
        unsupportedSteps: [],
        supportedSteps: []
    };

    const playbook = {
        '@id': `/api/workflow/playbooks/${playbookUuid}/`,
        uuid: playbookUuid,
        name: workflow.name ? workflow.name.replace(/^> /, '') : '',
        createDate: convertUnixToISO(workflow.createDate),
        modifyDate: convertUnixToISO(workflow.modifyDate),
        priority: getPriority(workflow.priority),
        triggerLimit: workflow.triggerLimit || null,
        steps: [],
        routes: [],
        groups: workflow.groups || [],
        aliasName: workflow.aliasName || null,
        tags: workflow.recordTags || [],
        description: workflow.description || null,
        isActive: workflow.isActive !== undefined ? workflow.isActive : false,
        debug: workflow.debug !== undefined ? workflow.debug : false,
        singleRecordExecution: workflow.singleRecordExecution !== undefined ? workflow.singleRecordExecution : false,
        remoteExecutableFlag: workflow.remoteExecutableFlag !== undefined ? workflow.remoteExecutableFlag : false,
        parameters: workflow.parameters || null,
        synchronous: workflow.synchronous !== undefined ? workflow.synchronous : false,
        isPrivate: workflow.isPrivate !== undefined ? workflow.isPrivate : false,
        pinned: workflow.pinned !== undefined ? workflow.pinned : false,
        lastModifyDate: workflow.lastModifyDate || Math.floor(Date.now() / 1000),
        deletedAt: workflow.deletedAt || null,
        importedBy: workflow.importedBy || null,
        collection: {
            '@id': fasCollection['@id'],
            uuid: fasCollection.uuid,
            createDate: fasCollection.createDate,
            modifyDate: fasCollection.modifyDate,
            deletedAt: fasCollection.deletedAt,
            name: fasCollection.name,
            description: fasCollection.description,
            visible: fasCollection.visible,
            image: fasCollection.image,
            importedBy: fasCollection.importedBy,
            createUser: fasCollection.createUser,
            modifyUser: fasCollection.modifyUser,
            tags: fasCollection.tags,
            '@type': 'WorkflowCollection'
        },
        _conversionStats: conversionStats
    };

    if (workflow.steps) {
        workflow.steps.forEach(step => {
            const stepTypeUuid = step.stepType ? step.stepType.replace('/api/3/workflow_step_types/', '') : '';

            // Check if this is any FSR start step (all must be converted to referenced)
            if (isFSRStartStep(stepTypeUuid)) {
                const fasStep = convertFSRStartToReferenced(step, playbookUuid);
                playbook.steps.push(fasStep);
                conversionStats.supportedSteps.push({
                    name: step.name,
                    uuid: step.uuid,
                    note: `${FSR_START_STEP_TYPES[stepTypeUuid]} converted to referenced start`
                });
            }
            // Check if step type is unsupported (known to not work in FAS)
            else if (isUnsupportedStepType(stepTypeUuid)) {
                const fasStep = convertUnsupportedStep(step, playbookUuid, false);
                playbook.steps.push(fasStep);
                conversionStats.unsupportedSteps.push({
                    name: step.name,
                    type: UNSUPPORTED_STEP_TYPES[stepTypeUuid],
                    uuid: step.uuid,
                    category: 'unsupported'
                });
            }
            // Check if step type is unknown (not in our known lists)
            else if (isUnknownStepType(stepTypeUuid)) {
                const fasStep = convertUnsupportedStep(step, playbookUuid, true);
                playbook.steps.push(fasStep);
                conversionStats.unsupportedSteps.push({
                    name: step.name,
                    type: 'Unknown Step Type',
                    uuid: step.uuid,
                    stepTypeUuid: stepTypeUuid,
                    category: 'unknown'
                });
            }
            // Step type is known and supported
            else {
                let stepArguments = step.arguments || {};

                // Fix Decision step conditions
                if (stepTypeUuid === '12254cf5-5db7-4b1a-8cb1-3af081924b28') {
                    stepArguments = fixDecisionStepIRIs(stepArguments);
                }
                // Fix Manual Input step response_mapping
                else if (stepTypeUuid === 'fc04082a-d7dc-4299-96fb-6837b1baa0fe') {
                    stepArguments = fixManualInputStepUUIDs(stepArguments);
                }
                // Fix Connector steps (type: 4c0019b2-055c-44d0-968c-678a0c2d762e)
                else if (stepTypeUuid === '4c0019b2-055c-44d0-968c-678a0c2d762e') {
                    stepArguments = fixConnectorStep(stepArguments);
                }

                const fasStep = {
                    uuid: step.uuid || generateUUID(),
                    workflow: playbookUuid,
                    name: step.name || '',
                    description: step.description || null,
                    arguments: stepArguments,
                    status: step.status || null,
                    top: String(step.top || 0),
                    left: String(step.left || 0),
                    workflowgroup: step.group || null,
                    stepType: stepTypeUuid,
                    '@type': 'WorkflowStep'
                };
                playbook.steps.push(fasStep);
                conversionStats.supportedSteps.push({
                    name: step.name,
                    uuid: step.uuid
                });
            }
        });
    }

    if (workflow.routes) {
        workflow.routes.forEach(route => {
            const routeUuid = route.uuid || generateUUID();
            const fasRoute = {
                '@id': `/api/workflow/playbook-routes/${routeUuid}/`,
                uuid: routeUuid,
                name: route.name || `${getStepName(route.sourceStep, workflow.steps)}->${getStepName(route.targetStep, workflow.steps)}`,
                data: {
                    label: route.label !== undefined ? route.label : (route.data && route.data.label !== undefined ? route.data.label : '')
                },
                isExecuted: route.isExecuted !== undefined ? route.isExecuted : false,
                sourcestep: extractUUID(route.sourceStep),
                targetstep: extractUUID(route.targetStep),
                workflowgroup: route.group || null,
                workflow: playbookUuid,
                '@type': 'WorkflowRoute'
            };
            playbook.routes.push(fasRoute);
        });
    }

    const triggerStepRef = workflow.triggerStep;
    if (triggerStepRef) {
        playbook.triggerstep = extractUUID(triggerStepRef);
    } else if (playbook.steps.length > 0) {
        const startStep = playbook.steps.find(s =>
            s.name.toLowerCase().includes('start') ||
            s.name.toLowerCase().includes('trigger')
        );
        playbook.triggerstep = startStep ? startStep.uuid : playbook.steps[0].uuid;
    } else {
        playbook.triggerstep = null;
    }

    playbook.createUser = workflow.createUser ? extractUUID(workflow.createUser) : generateUUID();
    playbook.modifyUser = workflow.modifyUser ? extractUUID(workflow.modifyUser) : generateUUID();
    playbook['@type'] = 'Workflow';

    return playbook;
}

function createVersionEntry(playbook) {
    const now = new Date().toISOString();

    return {
        uuid: generateUUID(),
        createDate: now,
        modifyDate: now,
        deletedAt: null,
        name: "Version 1",
        workflow_name: playbook.name,
        note: "Converted from FSR",
        json: {
            uuid: playbook.uuid,
            debug: playbook.debug,
            steps: playbook.steps.map(step => ({
                id: step.uuid,
                top: parseInt(step.top) || 0,
                left: parseInt(step.left) || 0,
                name: step.name,
                uuid: step.uuid,
                group: step.workflowgroup,
                stepType: step.stepType,
                arguments: step.arguments
            })),
            groups: playbook.groups,
            routes: playbook.routes.map(route => ({
                data: route.data,
                name: route.name,
                uuid: route.uuid,
                sourcestep: route.sourcestep,
                targetstep: route.targetstep
            })),
            parameters: playbook.parameters,
            triggerstep: playbook.triggerstep
        },
        draft: false,
        published: true,
        workflow: playbook.uuid,
        createUser: playbook.createUser,
        modifyUser: null
    };
}