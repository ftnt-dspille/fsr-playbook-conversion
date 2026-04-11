// Tests for convertFSRtoFAS — loaded as a global via tests/setup.js.
import {
    makeFsrCollection,
    makeSimpleWorkflow,
    makeStep,
    makeRoute,
    COLLECTION_UUID,
    PLAYBOOK_UUID,
    STEP_START_UUID,
    STEP_DECISION_UUID,
    STEP_TARGET_UUID,
    MANUAL_START_TYPE,
    ON_CREATE_TYPE,
    ON_UPDATE_TYPE,
    DECISION_STEP_TYPE,
    MANUAL_INPUT_TYPE,
    CONNECTOR_TYPE,
    SET_VAR_TYPE,
    CREATE_RECORD_TYPE,
    UNKNOWN_STEP_TYPE,
} from './fixtures/fsr-collection.js';

function convert(fsrObj) {
    return convertFSRtoFAS(JSON.stringify(fsrObj));
}

// ---------------------------------------------------------------------------
// Top-level structure
// ---------------------------------------------------------------------------
describe('convertFSRtoFAS — top-level structure', () => {
    it('throws when the input type is not workflow_collections', () => {
        expect(() => convertFSRtoFAS(JSON.stringify({ type: 'something_else', data: [] })))
            .toThrow('Input must be a FortiSOAR workflow_collections export');
    });

    it('outputs type playbook_collections', () => {
        const result = convert(makeFsrCollection({ workflows: [] }));
        expect(result.type).toBe('playbook_collections');
    });

    it('creates a versions array', () => {
        const result = convert(makeFsrCollection());
        expect(Array.isArray(result.versions)).toBe(true);
        expect(result.versions.length).toBeGreaterThan(0);
    });

    it('includes a _conversionSummary', () => {
        const result = convert(makeFsrCollection());
        expect(result._conversionSummary).toBeDefined();
    });

    it('maps each FSR collection to a FAS collection', () => {
        const result = convert(makeFsrCollection());
        expect(result.data).toHaveLength(1);
        const col = result.data[0];
        expect(col.uuid).toBe(COLLECTION_UUID);
        expect(col.name).toBe('Test Collection');
        expect(col['@type']).toBe('WorkflowCollection');
    });
});

// ---------------------------------------------------------------------------
// Date conversion
// ---------------------------------------------------------------------------
describe('convertFSRtoFAS — date conversion', () => {
    it('converts Unix timestamps to ISO strings on collections', () => {
        const result = convert(makeFsrCollection());
        const col = result.data[0];
        expect(col.createDate).toBe(new Date(1700000000 * 1000).toISOString());
        expect(col.modifyDate).toBe(new Date(1700000001 * 1000).toISOString());
    });

    it('converts Unix timestamps to ISO strings on playbooks', () => {
        const result = convert(makeFsrCollection());
        const pb = result.data[0].playbooks[0];
        expect(pb.createDate).toBe(new Date(1700000000 * 1000).toISOString());
        expect(pb.modifyDate).toBe(new Date(1700000001 * 1000).toISOString());
    });
});

// ---------------------------------------------------------------------------
// Playbook fields
// ---------------------------------------------------------------------------
describe('convertFSRtoFAS — playbook fields', () => {
    it('strips the leading "> " from playbook names', () => {
        const fsr = makeFsrCollection({
            workflows: [makeSimpleWorkflow({ name: '> My Playbook' })],
        });
        const result = convert(fsr);
        expect(result.data[0].playbooks[0].name).toBe('My Playbook');
    });

    it('extracts triggerstep UUID from triggerStep IRI', () => {
        const result = convert(makeFsrCollection());
        const pb = result.data[0].playbooks[0];
        expect(pb.triggerstep).toBe(STEP_START_UUID);
    });

    it('extracts createUser and modifyUser UUIDs from IRIs', () => {
        const result = convert(makeFsrCollection());
        const pb = result.data[0].playbooks[0];
        expect(pb.createUser).toBe('user-uuid-1');
        expect(pb.modifyUser).toBe('user-uuid-2');
    });

    it('attaches a collection object reference to each playbook', () => {
        const result = convert(makeFsrCollection());
        const pb = result.data[0].playbooks[0];
        expect(pb.collection).toMatchObject({
            uuid: COLLECTION_UUID,
            name: 'Test Collection',
            '@type': 'WorkflowCollection',
        });
    });

    it('removes _conversionStats from the published playbook output', () => {
        const result = convert(makeFsrCollection());
        const pb = result.data[0].playbooks[0];
        expect(pb._conversionStats).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// FSR start step → FAS referenced start
// ---------------------------------------------------------------------------
describe('convertFSRtoFAS — FSR start steps converted to referenced start', () => {
    const FAS_REFERENCED_START = 'b348f017-9a94-471f-87f8-ce88b6a7ad62';

    for (const [label, stepType] of [
        ['Manual Start', MANUAL_START_TYPE],
        ['On Create', ON_CREATE_TYPE],
        ['On Update', ON_UPDATE_TYPE],
    ]) {
        it(`converts ${label} to referenced start step type`, () => {
            const fsr = makeFsrCollection({
                workflows: [
                    makeSimpleWorkflow({
                        steps: [makeStep(STEP_START_UUID, 'Start', stepType)],
                        routes: [],
                    }),
                ],
            });
            const result = convert(fsr);
            const step = result.data[0].playbooks[0].steps[0];
            expect(step.stepType).toBe(FAS_REFERENCED_START);
        });
    }

    it('preserves the original start config in arguments._originalStartStep as a JSON string', () => {
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    steps: [makeStep(STEP_START_UUID, 'My Trigger', MANUAL_START_TYPE, {}, { route: '/my/route' })],
                    routes: [],
                }),
            ],
        });
        const result = convert(fsr);
        const step = result.data[0].playbooks[0].steps[0];
        expect(typeof step.arguments._originalStartStep).toBe('string');
        const original = JSON.parse(step.arguments._originalStartStep);
        expect(original.name).toBe('My Trigger');
    });

    it('counts converted start steps in _conversionSummary', () => {
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    steps: [makeStep(STEP_START_UUID, 'Start', MANUAL_START_TYPE)],
                    routes: [],
                }),
            ],
        });
        const result = convert(fsr);
        expect(result._conversionSummary.totalManualStartsConverted).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// Unsupported steps → Set Variable with UNSUPPORTED: prefix
// ---------------------------------------------------------------------------
describe('convertFSRtoFAS — unsupported steps', () => {
    const SET_VAR_UUID = '04d0cf46-b6a8-42c4-8683-60a7eaa69e8f';

    it('converts a Create Record step to a Set Variable step', () => {
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    steps: [makeStep(STEP_START_UUID, 'Create Alert', CREATE_RECORD_TYPE)],
                    routes: [],
                }),
            ],
        });
        const result = convert(fsr);
        const step = result.data[0].playbooks[0].steps[0];
        expect(step.stepType).toBe(SET_VAR_UUID);
        expect(step.name).toMatch(/^UNSUPPORTED:/);
    });

    it('preserves original step data in arguments._tmp', () => {
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    steps: [makeStep(STEP_START_UUID, 'Create Alert', CREATE_RECORD_TYPE, {}, { resource: 'alerts' })],
                    routes: [],
                }),
            ],
        });
        const result = convert(fsr);
        const step = result.data[0].playbooks[0].steps[0];
        const tmp = JSON.parse(step.arguments._tmp);
        expect(tmp.name).toBe('Create Alert');
        expect(tmp.arguments.resource).toBe('alerts');
    });

    it('increments totalUnsupportedSteps in _conversionSummary', () => {
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    steps: [makeStep(STEP_START_UUID, 'Create Alert', CREATE_RECORD_TYPE)],
                    routes: [],
                }),
            ],
        });
        const result = convert(fsr);
        expect(result._conversionSummary.totalUnsupportedSteps).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// Unknown steps → Set Variable with UNKNOWN: prefix
// ---------------------------------------------------------------------------
describe('convertFSRtoFAS — unknown step types', () => {
    it('converts an unknown step to a Set Variable step with UNKNOWN: prefix', () => {
        const SET_VAR_UUID = '04d0cf46-b6a8-42c4-8683-60a7eaa69e8f';
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    steps: [makeStep(STEP_START_UUID, 'Mystery Step', UNKNOWN_STEP_TYPE)],
                    routes: [],
                }),
            ],
        });
        const result = convert(fsr);
        const step = result.data[0].playbooks[0].steps[0];
        expect(step.stepType).toBe(SET_VAR_UUID);
        expect(step.name).toMatch(/^UNKNOWN:/);
    });

    it('increments totalUnknownSteps in _conversionSummary', () => {
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    steps: [makeStep(STEP_START_UUID, 'Mystery Step', UNKNOWN_STEP_TYPE)],
                    routes: [],
                }),
            ],
        });
        const result = convert(fsr);
        expect(result._conversionSummary.totalUnknownSteps).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// Decision step — strip leading slash from step_iri
// ---------------------------------------------------------------------------
describe('convertFSRtoFAS — decision step IRI fix', () => {
    it('removes leading slash from /api/3/workflow_steps/ step_iri', () => {
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    steps: [
                        makeStep(STEP_DECISION_UUID, 'Decide', DECISION_STEP_TYPE, {}, {
                            conditions: [
                                { step_iri: `/api/3/workflow_steps/${STEP_TARGET_UUID}`, label: 'yes' },
                            ],
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fsr);
        const step = result.data[0].playbooks[0].steps[0];
        expect(step.arguments.conditions[0].step_iri).toBe(`api/3/workflow_steps/${STEP_TARGET_UUID}`);
    });

    it('adds api/3/workflow_steps/ prefix to a bare UUID step_iri', () => {
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    steps: [
                        makeStep(STEP_DECISION_UUID, 'Decide', DECISION_STEP_TYPE, {}, {
                            conditions: [{ step_iri: STEP_TARGET_UUID, label: 'yes' }],
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fsr);
        const step = result.data[0].playbooks[0].steps[0];
        expect(step.arguments.conditions[0].step_iri).toBe(`api/3/workflow_steps/${STEP_TARGET_UUID}`);
    });
});

// ---------------------------------------------------------------------------
// Manual Input step — strip leading slash from step_uuid
// ---------------------------------------------------------------------------
describe('convertFSRtoFAS — manual input step_uuid fix', () => {
    it('removes leading slash from /api/3/workflow_steps/ step_uuid', () => {
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    steps: [
                        makeStep(STEP_DECISION_UUID, 'User Input', MANUAL_INPUT_TYPE, {}, {
                            response_mapping: {
                                options: [
                                    { step_uuid: `/api/3/workflow_steps/${STEP_TARGET_UUID}`, label: 'OK' },
                                ],
                            },
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fsr);
        const step = result.data[0].playbooks[0].steps[0];
        expect(step.arguments.response_mapping.options[0].step_uuid)
            .toBe(`api/3/workflow_steps/${STEP_TARGET_UUID}`);
    });

    // Bug 5: step_iri in manual input response_mapping options must also be de-prefixed.
    it('removes leading slash from /api/3/workflow_steps/ step_iri', () => {
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    steps: [
                        makeStep(STEP_DECISION_UUID, 'User Input', MANUAL_INPUT_TYPE, {}, {
                            response_mapping: {
                                options: [
                                    { step_iri: `/api/3/workflow_steps/${STEP_TARGET_UUID}`, option: 'OK' },
                                ],
                            },
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fsr);
        const step = result.data[0].playbooks[0].steps[0];
        expect(step.arguments.response_mapping.options[0].step_iri)
            .toBe(`api/3/workflow_steps/${STEP_TARGET_UUID}`);
    });

    it('adds api/3/workflow_steps/ prefix to a bare UUID step_iri', () => {
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    steps: [
                        makeStep(STEP_DECISION_UUID, 'User Input', MANUAL_INPUT_TYPE, {}, {
                            response_mapping: {
                                options: [
                                    { step_iri: STEP_TARGET_UUID, option: 'OK' },
                                ],
                            },
                        }),
                    ],
                    routes: [],
                }),
            ],
        });
        const result = convert(fsr);
        const step = result.data[0].playbooks[0].steps[0];
        expect(step.arguments.response_mapping.options[0].step_iri)
            .toBe(`api/3/workflow_steps/${STEP_TARGET_UUID}`);
    });
});

// ---------------------------------------------------------------------------
// Route mapping
// ---------------------------------------------------------------------------
describe('convertFSRtoFAS — route mapping', () => {
    it('maps sourceStep and targetStep IRIs to bare UUIDs', () => {
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    steps: [
                        makeStep(STEP_START_UUID, 'Start', MANUAL_START_TYPE),
                        makeStep(STEP_DECISION_UUID, 'Decide', DECISION_STEP_TYPE),
                    ],
                    routes: [makeRoute('route-001', STEP_START_UUID, STEP_DECISION_UUID)],
                }),
            ],
        });
        const result = convert(fsr);
        const route = result.data[0].playbooks[0].routes[0];
        expect(route.sourcestep).toBe(STEP_START_UUID);
        expect(route.targetstep).toBe(STEP_DECISION_UUID);
    });

    it('sets the workflow field on each route to the playbook UUID', () => {
        const result = convert(makeFsrCollection());
        const route = result.data[0].playbooks[0].routes[0];
        expect(route.workflow).toBe(PLAYBOOK_UUID);
    });
});

// ---------------------------------------------------------------------------
// triggerstep fallback
// ---------------------------------------------------------------------------
describe('convertFSRtoFAS — triggerstep fallback', () => {
    it('falls back to first step when triggerStep is missing', () => {
        const fsr = makeFsrCollection({
            workflows: [
                makeSimpleWorkflow({
                    triggerStep: null,
                    steps: [makeStep(STEP_START_UUID, 'First Step', SET_VAR_TYPE)],
                    routes: [],
                }),
            ],
        });
        const result = convert(fsr);
        expect(result.data[0].playbooks[0].triggerstep).toBe(STEP_START_UUID);
    });

    it('sets triggerstep to null when there are no steps', () => {
        const fsr = makeFsrCollection({
            workflows: [makeSimpleWorkflow({ triggerStep: null, steps: [], routes: [] })],
        });
        const result = convert(fsr);
        expect(result.data[0].playbooks[0].triggerstep).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// versions array
// ---------------------------------------------------------------------------
describe('convertFSRtoFAS — versions array', () => {
    it('creates one version entry per playbook', () => {
        const result = convert(makeFsrCollection());
        expect(result.versions).toHaveLength(1);
    });

    it('version entry references the correct playbook UUID', () => {
        const result = convert(makeFsrCollection());
        expect(result.versions[0].workflow).toBe(PLAYBOOK_UUID);
    });

    it('version entry includes a simplified step list', () => {
        const result = convert(makeFsrCollection());
        const vSteps = result.versions[0].json.steps;
        expect(Array.isArray(vSteps)).toBe(true);
        expect(vSteps.length).toBeGreaterThan(0);
        // Coordinates in version json must be integers
        vSteps.forEach(s => {
            expect(Number.isInteger(s.top)).toBe(true);
            expect(Number.isInteger(s.left)).toBe(true);
        });
    });
});
