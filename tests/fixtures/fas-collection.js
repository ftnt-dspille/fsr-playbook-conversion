// Minimal but realistic FAS (playbook_collections) export used across tests.

export const COLLECTION_UUID = 'col-fas-2222-3333-444444444444';
export const PLAYBOOK_UUID   = 'pb-fas-aaaa-bbbb-cccccccccccc';
export const STEP_START_UUID = 'fas-step-0000-0000-000000000001';
export const STEP_DECISION_UUID = 'fas-step-0000-0000-000000000002';

export const CONNECTOR_TYPE   = '4c0019b2-055c-44d0-968c-678a0c2d762e';
export const DECISION_TYPE    = '12254cf5-5db7-4b1a-8cb1-3af081924b28';
export const MANUAL_INPUT_TYPE = 'fc04082a-d7dc-4299-96fb-6837b1baa0fe';
export const FAS_START_TYPE   = 'b348f017-9a94-471f-87f8-ce88b6a7ad62';

export function makeFasCollection(overrides = {}) {
    return {
        type: 'playbook_collections',
        versions: [],
        data: [
            {
                '@id': `/api/workflow/playbook-collections/${COLLECTION_UUID}/`,
                '@type': 'WorkflowCollection',
                uuid: COLLECTION_UUID,
                name: 'FAS Test Collection',
                description: null,
                visible: true,
                image: null,
                createDate: '2023-11-14T22:13:20.000Z',
                modifyDate: '2023-11-14T22:13:21.000Z',
                deletedAt: null,
                importedBy: {},
                createUser: 'user-fas-uuid-1',
                modifyUser: 'user-fas-uuid-2',
                tags: [],
                playbooks: overrides.playbooks ?? [makeSimplePlaybook()],
            },
        ],
        ...overrides,
    };
}

export function makeSimplePlaybook(overrides = {}) {
    return {
        '@id': `/api/workflow/playbooks/${PLAYBOOK_UUID}/`,
        '@type': 'Workflow',
        uuid: PLAYBOOK_UUID,
        name: 'FAS Test Playbook',
        description: null,
        isActive: true,
        debug: false,
        singleRecordExecution: false,
        remoteExecutableFlag: false,
        synchronous: false,
        isPrivate: false,
        parameters: null,
        triggerLimit: null,
        lastModifyDate: 1700000002,
        createDate: '2023-11-14T22:13:20.000Z',
        modifyDate: '2023-11-14T22:13:21.000Z',
        createUser: 'user-fas-uuid-1',
        modifyUser: 'user-fas-uuid-2',
        collection: {
            '@id': `/api/workflow/playbook-collections/${COLLECTION_UUID}/`,
            uuid: COLLECTION_UUID,
            name: 'FAS Test Collection',
        },
        triggerstep: STEP_START_UUID,
        groups: [],
        tags: [],
        deletedAt: null,
        importedBy: null,
        pinned: false,
        priority: 'medium',
        steps: overrides.steps ?? [
            makeFasStep(STEP_START_UUID, 'Start', FAS_START_TYPE, '30', '300'),
            makeFasStep(STEP_DECISION_UUID, 'Check Condition', DECISION_TYPE, '150', '300'),
        ],
        routes: overrides.routes ?? [
            makeFasRoute('route-fas-uuid-1', STEP_START_UUID, STEP_DECISION_UUID),
        ],
        ...overrides,
    };
}

export function makeFasStep(uuid, name, stepType, top = '100', left = '400', args = {}) {
    return {
        uuid,
        workflow: PLAYBOOK_UUID,
        name,
        description: null,
        status: null,
        top,
        left,
        stepType,
        workflowgroup: null,
        '@type': 'WorkflowStep',
        arguments: args,
    };
}

export function makeFasRoute(uuid, sourcestep, targetstep) {
    return {
        '@id': `/api/workflow/playbook-routes/${uuid}/`,
        uuid,
        name: '',
        data: { label: null },
        isExecuted: false,
        sourcestep,
        targetstep,
        workflowgroup: null,
        workflow: PLAYBOOK_UUID,
        '@type': 'WorkflowRoute',
    };
}
