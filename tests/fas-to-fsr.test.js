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
