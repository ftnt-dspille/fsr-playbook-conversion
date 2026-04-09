// Minimal but realistic FSR (workflow_collections) export used across tests.
// Includes one collection with playbooks covering all major step types.

export const DECISION_STEP_TYPE   = '12254cf5-5db7-4b1a-8cb1-3af081924b28';
export const MANUAL_INPUT_TYPE    = 'fc04082a-d7dc-4299-96fb-6837b1baa0fe';
export const CONNECTOR_TYPE       = '4c0019b2-055c-44d0-968c-678a0c2d762e';
export const MANUAL_START_TYPE    = 'f414d039-bb0d-4e59-9c39-a8f1e880b18a';
export const ON_CREATE_TYPE       = 'ea155646-3821-4542-9702-b246da430a8d';
export const ON_UPDATE_TYPE       = '9300bf69-5063-486d-b3a6-47eb9da24872';
export const SET_VAR_TYPE         = '04d0cf46-b6a8-42c4-8683-60a7eaa69e8f';
export const CREATE_RECORD_TYPE   = '2597053c-e718-44b4-8394-4d40fe26d357'; // unsupported
export const UNKNOWN_STEP_TYPE    = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; // not in any list

export const COLLECTION_UUID = 'col-1111-2222-3333-444444444444';
export const PLAYBOOK_UUID   = 'pb-aaaa-bbbb-cccc-dddddddddddd';
export const STEP_START_UUID = 'step-0000-0000-0000-000000000001';
export const STEP_DECISION_UUID = 'step-0000-0000-0000-000000000002';
export const STEP_TARGET_UUID   = 'step-0000-0000-0000-000000000003';

export function makeFsrCollection(overrides = {}) {
    return {
        type: 'workflow_collections',
        data: [
            {
                '@context': '/api/3/contexts/WorkflowCollection',
                '@type': 'WorkflowCollection',
                uuid: COLLECTION_UUID,
                name: 'Test Collection',
                description: 'A test collection',
                visible: true,
                image: null,
                createDate: 1700000000,
                modifyDate: 1700000001,
                deletedAt: null,
                importedBy: [],
                recordTags: [],
                workflows: overrides.workflows ?? [makeSimpleWorkflow()],
            },
        ],
        ...overrides,
    };
}

export function makeSimpleWorkflow(overrides = {}) {
    return {
        '@type': 'Workflow',
        uuid: PLAYBOOK_UUID,
        name: 'Test Playbook',
        description: 'A test playbook',
        isActive: true,
        debug: false,
        singleRecordExecution: false,
        remoteExecutableFlag: false,
        synchronous: false,
        isPrivate: false,
        parameters: null,
        triggerLimit: null,
        lastModifyDate: 1700000002,
        createDate: 1700000000,
        modifyDate: 1700000001,
        createUser: `/api/3/people/user-uuid-1`,
        modifyUser: `/api/3/people/user-uuid-2`,
        collection: `/api/3/workflow_collections/${COLLECTION_UUID}`,
        triggerStep: `/api/3/workflow_steps/${STEP_START_UUID}`,
        groups: [],
        recordTags: [],
        versions: [],
        owners: [],
        deletedAt: null,
        importedBy: [],
        priority: `/api/3/picklists/2b563c61-ae2c-41c0-a85a-c9709585e3f2`,
        playbookOrigin: `/api/3/picklists/15c1e8c9-22bf-4e66-8fbb-0a502d4a4a3f`,
        steps: overrides.steps ?? [
            makeStep(STEP_START_UUID, 'Start', MANUAL_START_TYPE, { top: '30', left: '300' }),
            makeStep(STEP_DECISION_UUID, 'Check Condition', DECISION_STEP_TYPE, { top: '150', left: '300' }),
        ],
        routes: overrides.routes ?? [
            makeRoute('route-uuid-1', STEP_START_UUID, STEP_DECISION_UUID),
        ],
        ...overrides,
    };
}

export function makeStep(uuid, name, stepType, positionOverrides = {}, argumentOverrides = {}) {
    return {
        '@type': 'WorkflowStep',
        uuid,
        name,
        description: null,
        status: null,
        top: positionOverrides.top ?? '100',
        left: positionOverrides.left ?? '400',
        stepType: `/api/3/workflow_step_types/${stepType}`,
        group: null,
        arguments: argumentOverrides,
    };
}

export function makeRoute(uuid, sourceStep, targetStep) {
    return {
        '@type': 'WorkflowRoute',
        uuid,
        name: '',
        sourceStep: `/api/3/workflow_steps/${sourceStep}`,
        targetStep: `/api/3/workflow_steps/${targetStep}`,
        label: null,
        isExecuted: false,
        group: null,
        data: { label: null },
    };
}
