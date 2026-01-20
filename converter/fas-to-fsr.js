// FAS to FSR conversion

    // Helper function to safely convert FAS date (ISO string) to FSR date (Unix timestamp)
    function convertDateToUnix(dateValue) {
        // If no date provided, use current time
        if (!dateValue) {
            return Math.floor(Date.now() / 1000);
        }

        // If it's already a Unix timestamp (number), use it directly
        if (typeof dateValue === 'number') {
            // If it looks like milliseconds (very large number), convert to seconds
            return dateValue > 10000000000 ? Math.floor(dateValue / 1000) : dateValue;
        }

        // Try to parse as ISO string
        const date = new Date(dateValue);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date value: ${dateValue}, using current time`);
            return Math.floor(Date.now() / 1000);
        }

        // Convert to Unix timestamp (seconds)
        return Math.floor(date.getTime() / 1000);
    }

    function convertFAStoFSR(fasJson) {
        const fas = JSON.parse(fasJson);

        if (fas.type !== 'playbook_collections') {
            throw new Error('Input must be a FAS playbook_collections export');
        }

        const fsr = {
            type: 'workflow_collections',
            data: [],
            exported_tags: []
        };

        fas.data.forEach(collection => {
            const fsrCollection = {
                '@context': '/api/3/contexts/WorkflowCollection',
                '@type': 'WorkflowCollection',
                name: collection.name || '',
                description: collection.description || null,
                visible: collection.visible !== undefined ? collection.visible : true,
                image: collection.image || null,
                uuid: collection.uuid,
                id: Math.floor(Math.random() * 10000),
                createDate: convertDateToUnix(collection.createDate),
                modifyDate: convertDateToUnix(collection.modifyDate),
                deletedAt: collection.deletedAt || null,
                importedBy: Array.isArray(collection.importedBy) ? collection.importedBy : [],
                recordTags: collection.tags || [],
                workflows: []
            };

            if (collection.playbooks) {
                collection.playbooks.forEach(playbook => {
                    const workflow = convertPlaybookToWorkflow(playbook, fsrCollection);
                    fsrCollection.workflows.push(workflow);
                });
            }

            fsr.data.push(fsrCollection);
        });

        return fsr;
    }

    function convertPlaybookToWorkflow(playbook, fsrCollection) {
        const workflowUuid = playbook.uuid || generateUUID();

        // Calculate position offset - FAS coordinates need adjustment for FSR
        // Find the minimum top and left to determine offset needed
        let minTop = Infinity, minLeft = Infinity;
        if (playbook.steps && playbook.steps.length > 0) {
            playbook.steps.forEach(step => {
                const top = parseInt(step.top) || 0;
                const left = parseInt(step.left) || 0;
                if (top < minTop) minTop = top;
                if (left < minLeft) minLeft = left;
            });
        }

        // Apply offset to ensure steps are visible (minimum 30px from top/left)
        const topOffset = minTop < 30 ? (30 - minTop) : 0;
        const leftOffset = minLeft < 300 ? (300 - minLeft) : 0;

        const workflow = {
            '@type': 'Workflow',
            triggerLimit: playbook.triggerLimit || null,
            name: playbook.name || '',
            aliasName: playbook.aliasName || null,
            tag: null,
            description: playbook.description || null,
            isActive: playbook.isActive !== undefined ? playbook.isActive : true,
            debug: playbook.debug !== undefined ? playbook.debug : false,
            singleRecordExecution: playbook.singleRecordExecution !== undefined ? playbook.singleRecordExecution : false,
            remoteExecutableFlag: playbook.remoteExecutableFlag !== undefined ? playbook.remoteExecutableFlag : false,
            parameters: playbook.parameters || null,
            synchronous: playbook.synchronous !== undefined ? playbook.synchronous : false,
            lastModifyDate: playbook.lastModifyDate || Math.floor(Date.now() / 1000),
            collection: `/api/3/workflow_collections/${fsrCollection.uuid}`,
            versions: [],
            triggerStep: playbook.triggerstep ? `/api/3/workflow_steps/${playbook.triggerstep}` : null,
            steps: [],
            routes: [],
            groups: playbook.groups || [],
            priority: `/api/3/picklists/2b563c61-ae2c-41c0-a85a-c9709585e3f2`,
            playbookOrigin: `/api/3/picklists/15c1e8c9-22bf-4e66-8fbb-0a502d4a4a3f`,
            isEditable: true,
            uuid: workflowUuid,
            id: Math.floor(Math.random() * 10000),
            createUser: `/api/3/people/${playbook.createUser || generateUUID()}`,
            createDate: convertDateToUnix(playbook.createDate),
            modifyUser: `/api/3/people/${playbook.modifyUser || generateUUID()}`,
            modifyDate: convertDateToUnix(playbook.modifyDate),
            owners: [],
            isPrivate: playbook.isPrivate !== undefined ? playbook.isPrivate : false,
            deletedAt: playbook.deletedAt || null,
            importedBy: [],
            recordTags: playbook.tags || []
        };

        if (playbook.steps) {
            playbook.steps.forEach(step => {
                const originalTop = parseInt(step.top) || 0;
                const originalLeft = parseInt(step.left) || 0;

                let stepArguments = step.arguments || {};

                // Fix decision step conditions - add /api/3/workflow_steps/ prefix to step_iri
                if (stepArguments.conditions && Array.isArray(stepArguments.conditions)) {
                    stepArguments = JSON.parse(JSON.stringify(stepArguments)); // Deep clone
                    stepArguments.conditions.forEach(condition => {
                        if (condition.step_iri && typeof condition.step_iri === 'string') {
                            // If it starts with api/3/workflow_steps/, add leading slash
                            if (condition.step_iri.startsWith('api/3/workflow_steps/')) {
                                condition.step_iri = '/' + condition.step_iri;
                            }
                            // If it's just UUID, add full prefix with leading slash
                            else if (!condition.step_iri.startsWith('/api/3/workflow_steps/')) {
                                condition.step_iri = `/api/3/workflow_steps/${condition.step_iri}`;
                            }
                        }
                    });
                }

                // Fix manual input step response_mapping - add /api/3/workflow_steps/ prefix to step_uuid
                if (stepArguments.response_mapping &&
                    stepArguments.response_mapping.options &&
                    Array.isArray(stepArguments.response_mapping.options)) {
                    stepArguments = JSON.parse(JSON.stringify(stepArguments)); // Deep clone
                    stepArguments.response_mapping.options.forEach(option => {
                        if (option.step_uuid && typeof option.step_uuid === 'string') {
                            // If it starts with api/3/workflow_steps/, add leading slash
                            if (option.step_uuid.startsWith('api/3/workflow_steps/')) {
                                option.step_uuid = '/' + option.step_uuid;
                            }
                            // If it's just UUID, add full prefix with leading slash
                            else if (!option.step_uuid.startsWith('/api/3/workflow_steps/')) {
                                option.step_uuid = `/api/3/workflow_steps/${option.step_uuid}`;
                            }
                        }
                    });
                }

                // Fix connector steps - ensure simplified structure for FSR
                if (stepArguments.connector) {
                    stepArguments = {
                        config: stepArguments.config || '',
                        version: stepArguments.version || '1.0.0',
                        from_str: stepArguments.from_str || stepArguments.params?.from || '',
                        connector: stepArguments.connector,
                        step_variables: stepArguments.step_variables || []
                    };
                }

                const fsrStep = {
                    '@type': 'WorkflowStep',
                    name: step.name || '',
                    description: step.description || null,
                    arguments: stepArguments,
                    status: step.status || null,
                    top: String(originalTop + topOffset),
                    left: String(originalLeft + leftOffset),
                    stepType: `/api/3/workflow_step_types/${step.stepType}`,
                    group: step.workflowgroup || null,
                    uuid: step.uuid || generateUUID()
                };
                workflow.steps.push(fsrStep);
            });
        }

        if (playbook.routes) {
            playbook.routes.forEach(route => {
                const fsrRoute = {
                    '@type': 'WorkflowRoute',
                    name: route.name || '',
                    targetStep: `/api/3/workflow_steps/${route.targetstep}`,
                    sourceStep: `/api/3/workflow_steps/${route.sourcestep}`,
                    label: route.data?.label || null,
                    isExecuted: route.isExecuted !== undefined ? route.isExecuted : false,
                    group: route.workflowgroup || null,
                    uuid: route.uuid || generateUUID()
                };
                workflow.routes.push(fsrRoute);
            });
        }

        return workflow;
    }