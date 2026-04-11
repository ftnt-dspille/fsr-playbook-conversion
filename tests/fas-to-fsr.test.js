// Tests for convertFAStoFSR — loaded as a global via tests/setup.js.
import {
    makeFasCollection,
    makeSimplePlaybook,
    makeFasStep,
    makeFasRoute,
    COLLECTION_UUID,
    PLAYBOOK_UUID,
    STEP_START_UUID,
    STEP_DECISION_UUID,
    CONNECTOR_TYPE,
    DECISION_TYPE,
    MANUAL_INPUT_TYPE,
    FAS_START_TYPE,
} from './fixtures/fas-collection.js';

function convert(fasObj) {
    return convertFAStoFSR(JSON.stringify(fasObj));
}

const TARGET_UUID = 'target-step-uuid-0000000000001';

// ---------------------------------------------------------------------------
// Top-level structure
// ---------------------------------------------------------------------------
describe('convertFAStoFSR — top-level structure', () => {
    it('throws when the input type is not playbook_collections', () => {
        expect(() => convertFAStoFSR(JSON.stringify({ type: 'wrong', data: [] })))
            .toThrow('Input must be a FAS playbook_collections export');
    });

    it('outputs type workflow_collections', () => {
        const result = convert(makeFasCollection());
        expect(result.type).toBe('workflow_collections');
    });

    it('has a data array', () => {
        const result = convert(makeFasCollection());
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(1);
    });

    it('has an exported_tags array', () => {
        const result = convert(makeFasCollection());
        expect(Array.isArray(result.exported_tags)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Collection fields
// ---------------------------------------------------------------------------
describe('convertFAStoFSR — collection fields', () => {
    it('maps collection UUID, name, and type', () => {
        const result = convert(makeFasCollection());
        const col = result.data[0];
        expect(col.uuid).toBe(COLLECTION_UUID);
        expect(col.name).toBe('FAS Test Collection');
        expect(col['@type']).toBe('WorkflowCollection');
    });

    it('sets the correct @context for workflow collections', () => {
        const result = convert(makeFasCollection());
        expect(result.data[0]['@context']).toBe('/api/3/contexts/WorkflowCollection');
    });

    it('includes a workflows array', () => {
        const result = convert(makeFasCollection());
        expect(Array.isArray(result.data[0].workflows)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Date conversion
// ---------------------------------------------------------------------------
describe('convertFAStoFSR — date conversion', () => {
    it('converts ISO date strings to Unix timestamps on collections', () => {
        const result = convert(makeFasCollection());
        const col = result.data[0];
        expect(col.createDate).toBe(1700000000);
        expect(col.modifyDate).toBe(1700000001);
    });

    it('converts ISO date strings to Unix timestamps on workflows', () => {
        const result = convert(makeFasCollection());
        const wf = result.data[0].workflows[0];
        expect(wf.createDate).toBe(1700000000);
        expect(wf.modifyDate).toBe(1700000001);
    });
});

// ---------------------------------------------------------------------------
// Workflow fields
// ---------------------------------------------------------------------------
describe('convertFAStoFSR — workflow fields', () => {
    it('wraps the collection IRI using the collection UUID', () => {
        const result = convert(makeFasCollection());
        const wf = result.data[0].workflows[0];
        expect(wf.collection).toBe(`/api/3/workflow_collections/${COLLECTION_UUID}`);
    });

    it('wraps the triggerStep as an IRI', () => {
        const result = convert(makeFasCollection());
        const wf = result.data[0].workflows[0];
        expect(wf.triggerStep).toBe(`/api/3/workflow_steps/${STEP_START_UUID}`);
    });

    it('wraps createUser and modifyUser as IRIs', () => {
        const result = convert(makeFasCollection());
        const wf = result.data[0].workflows[0];
        expect(wf.createUser).toBe(`/api/3/people/user-fas-uuid-1`);
        expect(wf.modifyUser).toBe(`/api/3/people/user-fas-uuid-2`);
    });
});

// ---------------------------------------------------------------------------
// Step position offset
// ---------------------------------------------------------------------------
describe('convertFAStoFSR — step position offset', () => {
    it('applies no offset when all steps are already within bounds', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Start', FAS_START_TYPE, '100', '400'),
                        makeFasStep(STEP_DECISION_UUID, 'Decide', DECISION_TYPE, '200', '500'),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const steps = result.data[0].workflows[0].steps;
        // Minimum top >= 30 and minimum left >= 300, so offset should be 0
        expect(steps.find(s => s.uuid === STEP_START_UUID).top).toBe('100');
        expect(steps.find(s => s.uuid === STEP_START_UUID).left).toBe('400');
    });

    it('shifts steps up when top is below 30', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Start', FAS_START_TYPE, '0', '300'),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        // top 0 → offset 30, so result should be '30'
        expect(step.top).toBe('30');
    });

    it('shifts steps right when left is below 300', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Start', FAS_START_TYPE, '30', '0'),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        // left 0 → offset 300, so result should be '300'
        expect(step.left).toBe('300');
    });

    it('preserves relative positions between steps after offset', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Start', FAS_START_TYPE, '0', '0'),
                        makeFasStep(STEP_DECISION_UUID, 'Decide', DECISION_TYPE, '100', '200'),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const steps = result.data[0].workflows[0].steps;
        const s1 = steps.find(s => s.uuid === STEP_START_UUID);
        const s2 = steps.find(s => s.uuid === STEP_DECISION_UUID);
        // Relative gap should be preserved
        expect(parseInt(s2.top) - parseInt(s1.top)).toBe(100);
        expect(parseInt(s2.left) - parseInt(s1.left)).toBe(200);
    });
});

// ---------------------------------------------------------------------------
// Connector step restructuring
// ---------------------------------------------------------------------------
describe('convertFAStoFSR — connector step', () => {
    const CONNECTOR_STEP_TYPE_UUID = '4c0019b2-055c-44d0-968c-678a0c2d762e';

    it('ensures the connector field is preserved', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Send Email', CONNECTOR_STEP_TYPE_UUID, '30', '300', {
                            connector: 'exchange',
                            operation: 'send_email',
                            params: { to: 'test@example.com' },
                            version: '2.0.0',
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        expect(step.arguments.connector).toBe('exchange');
        expect(step.arguments.operation).toBe('send_email');
        expect(step.arguments.version).toBe('2.0.0');
    });

    it('sets config to empty string (cannot be passed cleanly)', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Do Thing', CONNECTOR_STEP_TYPE_UUID, '30', '300', {
                            connector: 'slack',
                            operation: 'post_message',
                            config: 'some-config-ref',
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        expect(step.arguments.config).toBe('');
    });

    it('wraps the stepType as a full IRI', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Do Thing', CONNECTOR_STEP_TYPE_UUID, '30', '300', {
                            connector: 'slack',
                            operation: 'post_message',
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        expect(step.stepType).toBe(`/api/3/workflow_step_types/${CONNECTOR_STEP_TYPE_UUID}`);
    });

    // Bug 1: connector rebuild must not drop `agent` or `pickFromTenant`.
    it('preserves agent and pickFromTenant fields', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Do Thing', CONNECTOR_STEP_TYPE_UUID, '30', '300', {
                            connector: 'slack',
                            operation: 'post_message',
                            agent: 'tenant-default',
                            pickFromTenant: true,
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        expect(step.arguments.agent).toBe('tenant-default');
        expect(step.arguments.pickFromTenant).toBe(true);
    });

    // Bug 2: connector rebuild must not drop control-flow modifiers.
    it('preserves ignore_errors, mock_result, apply_async, and step_variables', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Do Thing', CONNECTOR_STEP_TYPE_UUID, '30', '300', {
                            connector: 'slack',
                            operation: 'post_message',
                            ignore_errors: true,
                            mock_result: { status: 'ok' },
                            apply_async: true,
                            step_variables: { input: { params: { foo: 'bar' } } },
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        expect(step.arguments.ignore_errors).toBe(true);
        expect(step.arguments.mock_result).toEqual({ status: 'ok' });
        expect(step.arguments.apply_async).toBe(true);
        expect(step.arguments.step_variables).toEqual({ input: { params: { foo: 'bar' } } });
    });

    // Bug 3: step_variables should be omitted (not set to []) when absent from source.
    it('omits step_variables instead of defaulting it to an empty array', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Do Thing', CONNECTOR_STEP_TYPE_UUID, '30', '300', {
                            connector: 'slack',
                            operation: 'post_message',
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        expect('step_variables' in step.arguments).toBe(false);
    });

    // Bug 4: Utility/No-Op steps (UUID 0109f35d-...) also carry a `connector` field
    // but must not be rebuilt with the connector shape.
    it('does not rebuild Utility/No-Op steps as connectors', () => {
        const NOOP_TYPE = '0109f35d-090b-4a2b-bd8a-94cbc3508562';
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Display', NOOP_TYPE, '30', '300', {
                            connector: 'utilities',
                            operation: 'no_op',
                            agent: 'tenant-default',
                            pickFromTenant: true,
                            config: 'original-config',
                            params: {
                                data: 'hello',
                                display: 'markdown',
                                show_button: true,
                            },
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        // Connector-specific overrides (config blanked, from_str added) must NOT fire.
        expect(step.arguments.config).toBe('original-config');
        expect(step.arguments).not.toHaveProperty('from_str');
        // No-Op-specific args must be preserved.
        expect(step.arguments.agent).toBe('tenant-default');
        expect(step.arguments.pickFromTenant).toBe(true);
        expect(step.arguments.params).toEqual({
            data: 'hello',
            display: 'markdown',
            show_button: true,
        });
    });
});

// ---------------------------------------------------------------------------
// Decision step — add leading slash to step_iri
// ---------------------------------------------------------------------------
describe('convertFAStoFSR — decision step IRI fix', () => {
    const DECISION_UUID = '12254cf5-5db7-4b1a-8cb1-3af081924b28';

    it('adds leading slash to api/3/workflow_steps/ step_iri', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Decide', DECISION_UUID, '30', '300', {
                            conditions: [
                                { step_iri: `api/3/workflow_steps/${TARGET_UUID}`, label: 'yes' },
                            ],
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        expect(step.arguments.conditions[0].step_iri)
            .toBe(`/api/3/workflow_steps/${TARGET_UUID}`);
    });

    it('adds /api/3/workflow_steps/ prefix to a bare UUID step_iri', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Decide', DECISION_UUID, '30', '300', {
                            conditions: [{ step_iri: TARGET_UUID, label: 'yes' }],
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        expect(step.arguments.conditions[0].step_iri)
            .toBe(`/api/3/workflow_steps/${TARGET_UUID}`);
    });
});

// ---------------------------------------------------------------------------
// Manual Input step — add leading slash to step_uuid
// ---------------------------------------------------------------------------
describe('convertFAStoFSR — manual input step_uuid fix', () => {
    const MANUAL_UUID = 'fc04082a-d7dc-4299-96fb-6837b1baa0fe';

    it('adds leading slash to api/3/workflow_steps/ step_uuid', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'User Input', MANUAL_UUID, '30', '300', {
                            response_mapping: {
                                options: [
                                    { step_uuid: `api/3/workflow_steps/${TARGET_UUID}`, label: 'OK' },
                                ],
                            },
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        expect(step.arguments.response_mapping.options[0].step_uuid)
            .toBe(`/api/3/workflow_steps/${TARGET_UUID}`);
    });
});

// ---------------------------------------------------------------------------
// Start step — force FSR-style triggers to referenced start
// ---------------------------------------------------------------------------
describe('convertFAStoFSR — start step forced to referenced', () => {
    // FSR-style start type UUIDs (Manual Start, On Create, On Update, API Endpoint)
    const FSR_MANUAL_START  = 'f414d039-bb0d-4e59-9c39-a8f1e880b18a';
    const FSR_ON_CREATE     = 'ea155646-3821-4542-9702-b246da430a8d';
    const FSR_ON_UPDATE     = '9300bf69-5063-486d-b3a6-47eb9da24872';
    const FSR_API_ENDPOINT  = 'df26c7a2-4166-4ca5-91e5-548e24c01b5f';
    const EXPECTED_STEP_TYPE = `/api/3/workflow_step_types/${FAS_START_TYPE}`;

    [
        ['Manual Start', FSR_MANUAL_START],
        ['On Create',    FSR_ON_CREATE],
        ['On Update',    FSR_ON_UPDATE],
        ['API Endpoint', FSR_API_ENDPOINT],
    ].forEach(([label, fsrStartType]) => {
        it(`converts ${label} step to FAS referenced start type`, () => {
            const fas = makeFasCollection({
                playbooks: [
                    makeSimplePlaybook({
                        steps: [
                            makeFasStep(STEP_START_UUID, 'Start', fsrStartType, '30', '300'),
                        ],
                        routes: [],
                    }),
                ],
            });
            const result = convert(fas);
            const step = result.data[0].workflows[0].steps[0];
            expect(step.stepType).toBe(EXPECTED_STEP_TYPE);
        });
    });

    it('converts Application Event (FAS-only trigger) to FAS referenced start type', () => {
        const APPLICATION_EVENT_TYPE = '202ecbe9-e4b9-4f71-9fd9-66a054b5443f';
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'App Event', APPLICATION_EVENT_TYPE, '30', '300'),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        expect(step.stepType).toBe(EXPECTED_STEP_TYPE);
    });

    it('preserves FAS referenced start type unchanged', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Start', FAS_START_TYPE, '30', '300'),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fas);
        const step = result.data[0].workflows[0].steps[0];
        expect(step.stepType).toBe(EXPECTED_STEP_TYPE);
    });
});

// ---------------------------------------------------------------------------
// Route mapping
// ---------------------------------------------------------------------------
describe('convertFAStoFSR — route mapping', () => {
    it('wraps sourcestep and targetstep as full IRIs', () => {
        const result = convert(makeFasCollection());
        const route = result.data[0].workflows[0].routes[0];
        expect(route.sourceStep).toBe(`/api/3/workflow_steps/${STEP_START_UUID}`);
        expect(route.targetStep).toBe(`/api/3/workflow_steps/${STEP_DECISION_UUID}`);
    });

    it('carries the label from route data', () => {
        const fas = makeFasCollection({
            playbooks: [
                makeSimplePlaybook({
                    steps: [
                        makeFasStep(STEP_START_UUID, 'Start', FAS_START_TYPE, '30', '300'),
                        makeFasStep(STEP_DECISION_UUID, 'Decide', DECISION_TYPE, '150', '300'),
                    ],
                    routes: [
                        { ...makeFasRoute('r-001', STEP_START_UUID, STEP_DECISION_UUID), data: { label: 'Yes' } },
                    ],
                }),
            ],
        });
        const result = convert(fas);
        const route = result.data[0].workflows[0].routes[0];
        expect(route.label).toBe('Yes');
    });
});
