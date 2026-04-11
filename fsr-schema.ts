/**
 * Auto-generated step-type schema
 * Source    : all_fsr_evoke_playbooks.json
 * Type      : workflow_collections
 * Generated : 2026-04-11T13:09:24.839Z
 * Collections: 119  |  Total steps: 6618  |  Step types: 21
 * Mode      : default (low-frequency keys collapsed into [key: string]: unknown)
 *
 * To classify an unknown step type:
 *   1. Search for "TODO: classify"
 *   2. Fill in the name / label / category fields in STEP_TYPE_CLASSIFICATIONS
 *   3. Optionally add the UUID to BUILT_IN_CLASSIFICATIONS in generate-schema.js
 *      so it is auto-classified on future runs.
 */

// ============================================================
// 1. Classification Registry
// ============================================================

export type StepCategory = 'trigger' | 'action' | 'control' | 'utility' | 'unknown';

export interface StepTypeClassification {
  uuid: string;
  /** TypeScript interface name prefix — edit to rename the generated interface */
  name: string;
  /** Human-readable label for reports and documentation */
  label: string;
  category: StepCategory;
  /** Total step instances found in this export */
  occurrences: number;
  /** Number of distinct playbooks containing this step type */
  playbookCount: number;
}

export const STEP_TYPE_CLASSIFICATIONS: Record<string, StepTypeClassification> = {
  // Connector
  '0bfed618-0316-11e7-93ae-92361f002671': {
    uuid: '0bfed618-0316-11e7-93ae-92361f002671',
    name: 'Connector',
    label: 'Connector',
    category: 'action',
    occurrences: 1256,
    playbookCount: 1125,
  },
  // Start/Trigger (FAS Referenced)
  'b348f017-9a94-471f-87f8-ce88b6a7ad62': {
    uuid: 'b348f017-9a94-471f-87f8-ce88b6a7ad62',
    name: 'FASTrigger',
    label: 'Start/Trigger (FAS Referenced)',
    category: 'trigger',
    occurrences: 690,
    playbookCount: 690,
  },
  // Set Variables
  '04d0cf46-b6a8-42c4-8683-60a7eaa69e8f': {
    uuid: '04d0cf46-b6a8-42c4-8683-60a7eaa69e8f',
    name: 'SetVariables',
    label: 'Set Variables',
    category: 'action',
    occurrences: 1386,
    playbookCount: 600,
  },
  // Find Record
  'b593663d-7d13-40ce-a3a3-96dece928770': {
    uuid: 'b593663d-7d13-40ce-a3a3-96dece928770',
    name: 'FindRecord',
    label: 'Find Record',
    category: 'action',
    occurrences: 273,
    playbookCount: 197,
  },
  // Reference Playbook
  '74932bdc-b8b6-4d24-88c4-1a4dfbc524f3': {
    uuid: '74932bdc-b8b6-4d24-88c4-1a4dfbc524f3',
    name: 'ReferencePlaybook',
    label: 'Reference Playbook',
    category: 'action',
    occurrences: 539,
    playbookCount: 293,
  },
  // Wait
  '6832e556-b9c7-497a-babe-feda3bd27dbf': {
    uuid: '6832e556-b9c7-497a-babe-feda3bd27dbf',
    name: 'Wait',
    label: 'Wait',
    category: 'control',
    occurrences: 30,
    playbookCount: 27,
  },
  // On Update
  '9300bf69-5063-486d-b3a6-47eb9da24872': {
    uuid: '9300bf69-5063-486d-b3a6-47eb9da24872',
    name: 'OnUpdate',
    label: 'On Update',
    category: 'trigger',
    occurrences: 54,
    playbookCount: 54,
  },
  // Decision
  '12254cf5-5db7-4b1a-8cb1-3af081924b28': {
    uuid: '12254cf5-5db7-4b1a-8cb1-3af081924b28',
    name: 'Decision',
    label: 'Decision',
    category: 'control',
    occurrences: 311,
    playbookCount: 215,
  },
  // Utility/No-Op
  '0109f35d-090b-4a2b-bd8a-94cbc3508562': {
    uuid: '0109f35d-090b-4a2b-bd8a-94cbc3508562',
    name: 'UtilityNoOp',
    label: 'Utility/No-Op',
    category: 'utility',
    occurrences: 442,
    playbookCount: 241,
  },
  // Update Record
  'b593663d-7d13-40ce-a3a3-96dece928722': {
    uuid: 'b593663d-7d13-40ce-a3a3-96dece928722',
    name: 'UpdateRecord',
    label: 'Update Record',
    category: 'action',
    occurrences: 334,
    playbookCount: 214,
  },
  // Create Record
  '2597053c-e718-44b4-8394-4d40fe26d357': {
    uuid: '2597053c-e718-44b4-8394-4d40fe26d357',
    name: 'CreateRecord',
    label: 'Create Record',
    category: 'action',
    occurrences: 236,
    playbookCount: 150,
  },
  // Manual Start
  'f414d039-bb0d-4e59-9c39-a8f1e880b18a': {
    uuid: 'f414d039-bb0d-4e59-9c39-a8f1e880b18a',
    name: 'ManualStart',
    label: 'Manual Start',
    category: 'trigger',
    occurrences: 806,
    playbookCount: 806,
  },
  // On Create
  'ea155646-3821-4542-9702-b246da430a8d': {
    uuid: 'ea155646-3821-4542-9702-b246da430a8d',
    name: 'OnCreate',
    label: 'On Create',
    category: 'trigger',
    occurrences: 36,
    playbookCount: 36,
  },
  // Ingest Bulk Feed
  '7b221880-716b-4726-a2ca-5e568d330b3e': {
    uuid: '7b221880-716b-4726-a2ca-5e568d330b3e',
    name: 'IngestBulkFeed',
    label: 'Ingest Bulk Feed',
    category: 'action',
    occurrences: 10,
    playbookCount: 9,
  },
  // Send Email (SMTP connector shortcut)
  '4c0019b2-055c-44d0-968c-678a0c2d762e': {
    uuid: '4c0019b2-055c-44d0-968c-678a0c2d762e',
    name: 'SendEmail',
    label: 'Send Email (SMTP connector shortcut)',
    category: 'action',
    occurrences: 20,
    playbookCount: 16,
  },
  // Manual Input
  'fc04082a-d7dc-4299-96fb-6837b1baa0fe': {
    uuid: 'fc04082a-d7dc-4299-96fb-6837b1baa0fe',
    name: 'ManualInput',
    label: 'Manual Input',
    category: 'action',
    occurrences: 150,
    playbookCount: 102,
  },
  // ⚠ UNCLASSIFIED — fill in below
  'a19333c2-c822-11ed-afa1-0242ac120002': {
    // TODO: classify — set name, label, and category
    uuid: 'a19333c2-c822-11ed-afa1-0242ac120002',
    name: 'Unknown',
    label: 'a19333c2-c822-11ed-afa1-0242ac120002',
    category: 'unknown',
    occurrences: 3,
    playbookCount: 3,
  },
  // ⚠ UNCLASSIFIED — fill in below
  'dc6ac63d-c5a5-472f-9eb4-6b18473a98b8': {
    // TODO: classify — set name, label, and category
    uuid: 'dc6ac63d-c5a5-472f-9eb4-6b18473a98b8',
    name: 'Unknown',
    label: 'dc6ac63d-c5a5-472f-9eb4-6b18473a98b8',
    category: 'unknown',
    occurrences: 6,
    playbookCount: 3,
  },
  // API Endpoint
  'df26c7a2-4166-4ca5-91e5-548e24c01b5f': {
    uuid: 'df26c7a2-4166-4ca5-91e5-548e24c01b5f',
    name: 'APIEndpoint',
    label: 'API Endpoint',
    category: 'trigger',
    occurrences: 10,
    playbookCount: 10,
  },
  // Code Snippet
  '1fdd14cc-d6b4-4335-a3af-ab49c8ed2fd8': {
    uuid: '1fdd14cc-d6b4-4335-a3af-ab49c8ed2fd8',
    name: 'CodeSnippet',
    label: 'Code Snippet',
    category: 'action',
    occurrences: 24,
    playbookCount: 20,
  },
  // ⚠ UNCLASSIFIED — fill in below
  'b104e839-fc31-48b3-8c50-7e9433f33d79': {
    // TODO: classify — set name, label, and category
    uuid: 'b104e839-fc31-48b3-8c50-7e9433f33d79',
    name: 'Unknown',
    label: 'b104e839-fc31-48b3-8c50-7e9433f33d79',
    category: 'unknown',
    occurrences: 2,
    playbookCount: 2,
  },
};

// ============================================================
// 2. Step Argument Interfaces
//
//  • Required fields appear in every observed instance.
//  • Optional fields (?) were absent in some instances.
//  • [key: string]: unknown  signals dynamic/user-defined keys.
// ============================================================

/**
 * Connector
 * UUID     : 0bfed618-0316-11e7-93ae-92361f002671
 * Category : action
 * Instances: 1256 step(s) across 1125 playbook(s)
 */
export interface ConnectorArgs {
  connector: string;  // [system key]
  operation: string;  // [system key]
  params: unknown;  // [system key]
  version: string;  // [system key]
  config?: string;  // present in 1212/1256 instances [system key]
  displayConditions?: {
    alerts: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    attachments: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
  };  // present in 1/1256 instances [system key]
  do_until?: {
    condition: string;
    delay: (number | string);
    retries: (number | string);
  };  // present in 11/1256 instances [system key]
  for_each?: {
    condition: string;
    item: string;
    __bulk?: boolean;
    parallel?: boolean;
  };  // present in 29/1256 instances [system key]
  ignore_errors?: boolean;  // present in 40/1256 instances [system key]
  inputVariables?: unknown[];  // present in 1/1256 instances [system key]
  message?: {
    content: string;
    records: string;
    parentstepid?: string;
    tags?: string[];
    tenant?: string;
    thread?: boolean;
    type?: string;
  };  // present in 18/1256 instances [system key]
  name?: string;  // present in 1255/1256 instances [system key]
  operationTitle?: string;  // present in 1254/1256 instances
  pickFromTenant?: boolean;  // present in 457/1256 instances
  resources?: string[];  // present in 1/1256 instances [system key]
  route?: string;  // present in 1/1256 instances [system key]
  step_variables?: unknown;  // present in 999/1256 instances [system key]
  title?: string;  // present in 1/1256 instances [system key]
  when?: string;  // present in 29/1256 instances [system key]
  /** ~7 additional dynamic keys (user-defined variable / output names) */
  [key: string]: unknown;
}

/**
 * Start/Trigger (FAS Referenced)
 * UUID     : b348f017-9a94-471f-87f8-ce88b6a7ad62
 * Category : trigger
 * Instances: 690 step(s) across 690 playbook(s)
 */
export interface FASTriggerArgs {
  __triggerLimit?: boolean;  // present in 178/690 instances [system key]
  step_variables?: unknown;  // present in 688/690 instances [system key]
  triggerOnReplicate?: boolean;  // present in 178/690 instances [system key]
  triggerOnSource?: boolean;  // present in 178/690 instances [system key]
}

/**
 * Set Variables
 * UUID     : 04d0cf46-b6a8-42c4-8683-60a7eaa69e8f
 * Category : action
 * Instances: 1386 step(s) across 600 playbook(s)
 */
export interface SetVariablesArgs {
  _tmp?: string;  // present in 1/1386 instances [system key]
  for_each?: {
    condition: string;
    item: string;
    __bulk?: boolean;
    parallel?: boolean;
  };  // present in 4/1386 instances [system key]
  message?: {
    content: string;
    records: string;
    tags: unknown[];
    thread: boolean;
    type: string;
    parentstepid?: string;
    tenant?: string;
  };  // present in 7/1386 instances [system key]
  name?: string;  // present in 3/1386 instances [system key]
  params?: string;  // present in 20/1386 instances [system key]
  result?: string;  // present in 2/1386 instances [system key]
  task_id?: string;  // present in 3/1386 instances [system key]
  /** ~1203 additional dynamic keys (user-defined variable / output names) */
  [key: string]: unknown;
}

/**
 * Find Record
 * UUID     : b593663d-7d13-40ce-a3a3-96dece928770
 * Category : action
 * Instances: 273 step(s) across 197 playbook(s)
 */
export interface FindRecordArgs {
  module: string;
  query: {
    filters: ({
        _field?: string;
        _operator?: string;
        _value?: (string | Record<string, unknown>);
        display?: string;
        enableJinja?: boolean;
        field?: string;
        filters?: Record<string, unknown>[];
        logic?: string;
        module?: string;
        operator?: string;
        OPERATOR_KEY?: string;
        previousOperator?: string;
        previousTemplate?: string;
        template?: string;
        type?: string;
        useInOperator?: boolean;
        value?: (string | string[] | boolean | number);
      })[];
    limit: number;
    logic: string;
    sort: ({
        _fieldName: string;
        _fieldTitle: string;
        direction: string;
        field: string;
      })[];
    __selectFields?: string[];
  };
  step_variables: unknown;  // [system key]
  checkboxFields?: boolean;  // present in 233/273 instances
  do_until?: {
    condition: string;
    delay: number;
    retries: number;
  };  // present in 3/273 instances [system key]
  for_each?: {
    condition: string;
    item: string;
    parallel: boolean;
  };  // present in 3/273 instances [system key]
  message?: {
    content: string;
    records: string;
    tenant: string;
  };  // present in 2/273 instances [system key]
  when?: string;  // present in 5/273 instances [system key]
}

/**
 * Reference Playbook
 * UUID     : 74932bdc-b8b6-4d24-88c4-1a4dfbc524f3
 * Category : action
 * Instances: 539 step(s) across 293 playbook(s)
 */
export interface ReferencePlaybookArgs {
  arguments: unknown;
  step_variables: unknown;  // [system key]
  workflowReference: string;
  apply_async?: boolean;  // present in 536/539 instances
  do_until?: {
    condition: string;
    delay: number;
    retries: number;
  };  // present in 7/539 instances [system key]
  for_each?: {
    condition: string;
    item: string;
    __bulk?: boolean;
    break_loop?: string;
    parallel?: boolean;
  };  // present in 153/539 instances [system key]
  ignore_errors?: boolean;  // present in 21/539 instances [system key]
  message?: {
    content: string;
    records: string;
    tags: unknown[];
    tenant: string;
    thread: boolean;
    type: string;
    parentstepid?: string;
  };  // present in 7/539 instances [system key]
  mock_result?: string;  // present in 2/539 instances
  pass_input_record?: boolean;  // present in 497/539 instances
  pass_parent_env?: boolean;  // present in 469/539 instances
  when?: string;  // present in 47/539 instances [system key]
}

/**
 * Wait
 * UUID     : 6832e556-b9c7-497a-babe-feda3bd27dbf
 * Category : control
 * Instances: 30 step(s) across 27 playbook(s)
 */
export interface WaitArgs {
  delay: {
    days: number;
    hours: (number | string);
    minutes: (number | string);
    seconds: (number | string);
    weeks?: number;
  };
  for_each?: {
    condition: string;
    item: string;
    break_loop?: string;
  };  // present in 5/30 instances [system key]
  rule?: {
    actions: ({
        channel_uuid: string;
        enabled: boolean;
        type: string;
      })[];
    event_source: string;
    is_active: boolean;
    entity_name?: string;
    entity_type?: string;
    event_type?: string;
    trigger_condition?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
  };  // present in 27/30 instances
  step_variables?: unknown[];  // present in 8/30 instances [system key]
  timeout?: {
    days: number;
    hours: number;
    step_iri: string;
    minutes?: number;
  };  // present in 7/30 instances
  type?: string;  // present in 27/30 instances
}

/**
 * On Update
 * UUID     : 9300bf69-5063-486d-b3a6-47eb9da24872
 * Category : trigger
 * Instances: 54 step(s) across 54 playbook(s)
 * NOTE: No FAS equivalent — argument schema is intentionally shallow.
 */
export interface OnUpdateArgs {
  fieldbasedtrigger: unknown;  // [system key]
  resource: string;  // [system key]
  step_variables: unknown;  // [system key]
  __triggerLimit?: boolean;  // present in 19/54 instances [system key]
  resources?: string[];  // present in 50/54 instances [system key]
  triggerOnReplicate?: boolean;  // present in 19/54 instances [system key]
  triggerOnSource?: boolean;  // present in 19/54 instances [system key]
}

/**
 * Decision
 * UUID     : 12254cf5-5db7-4b1a-8cb1-3af081924b28
 * Category : control
 * Instances: 311 step(s) across 215 playbook(s)
 */
export interface DecisionArgs {
  conditions: ({
      step_iri: string;
      condition?: string;
      default?: boolean;
      option?: string;
      step_name?: string;
    })[];  // [system key]
  step_variables?: unknown[];  // present in 154/311 instances [system key]
}

/**
 * Utility/No-Op
 * UUID     : 0109f35d-090b-4a2b-bd8a-94cbc3508562
 * Category : utility
 * Instances: 442 step(s) across 241 playbook(s)
 */
export interface UtilityNoOpArgs {
  connector: string;  // [system key]
  operation: string;  // [system key]
  operationTitle: string;
  params: unknown;  // [system key]
  step_variables: unknown;  // [system key]
  version: string;  // [system key]
  config?: string;  // present in 6/442 instances [system key]
  do_until?: {
    condition: string;
    delay: (number | string);
    retries: (number | string);
  };  // present in 2/442 instances [system key]
  for_each?: {
    condition: string;
    item: string;
    __bulk?: boolean;
    parallel?: boolean;
  };  // present in 27/442 instances [system key]
  ignore_errors?: boolean;  // present in 17/442 instances [system key]
  message?: {
    content: string;
    parentstepid: string;
    records: string;
    tenant: string;
    tags?: string[];
    thread?: boolean;
    type?: string;
  };  // present in 5/442 instances [system key]
  name?: string;  // present in 1/442 instances [system key]
  when?: string;  // present in 40/442 instances [system key]
  /** ~1 additional dynamic keys (user-defined variable / output names) */
  [key: string]: unknown;
}

/**
 * Update Record
 * UUID     : b593663d-7d13-40ce-a3a3-96dece928722
 * Category : action
 * Instances: 334 step(s) across 214 playbook(s)
 */
export interface UpdateRecordArgs {
  collection: string;
  collectionType: string;
  resource: unknown;  // [system key]
  step_variables: (unknown[] | {
    testCurrentValue: string;
    testPickListValues: string;
  } | {
    drive_by_download_check_message: string;
  } | {
    spoof_check_message: string;
  } | {
    closure_notes: string;
    closure_reason: string;
  } | {
    return_data: string;
  } | {
    warRoom: string;
  } | {
    placeholder: string;
  });  // [system key]
  __recommend?: unknown[];  // present in 234/334 instances
  _showJson?: boolean;  // present in 222/334 instances
  fieldOperation?: ({
    recordTags: string;
  } | unknown[] | {
    category: string;
    recordTags: string;
  } | {
    recordTags: string;
    assignmentSearchField: string;
  });  // present in 319/334 instances
  for_each?: {
    __bulk: boolean;
    condition: string;
    item: string;
    batch_size?: number;
    parallel?: boolean;
  };  // present in 47/334 instances [system key]
  ignore_errors?: boolean;  // present in 4/334 instances [system key]
  message?: {
    content: string;
    records: string;
    parentstepid?: string;
    tags?: string[];
    tenant?: string;
    thread?: boolean;
    type?: string;
  };  // present in 105/334 instances [system key]
  operation?: string;  // present in 328/334 instances [system key]
  tagsOperation?: string;  // present in 33/334 instances
  when?: string;  // present in 59/334 instances [system key]
}

/**
 * Create Record
 * UUID     : 2597053c-e718-44b4-8394-4d40fe26d357
 * Category : action
 * Instances: 236 step(s) across 150 playbook(s)
 */
export interface CreateRecordArgs {
  collection: string;
  resource: Record<string, unknown>;  // [system key]
  step_variables: unknown;  // [system key]
  __recommend?: unknown[];  // present in 151/236 instances
  _showJson?: boolean;  // present in 169/236 instances
  config?: string;  // present in 1/236 instances [system key]
  fieldOperation?: ({
    recordTags: string;
  } | {
    recordTags: string;
    threatTypes: string;
    killChainPhases: string;
  } | unknown[] | {
    recordTags: string;
    assignmentSearchField: string;
  } | {
    protocol: string;
  } | {
    protocol: string;
    recordTags: string;
  });  // present in 211/236 instances
  for_each?: {
    condition: string;
    item: string;
    __bulk?: boolean;
    batch_size?: number;
    parallel?: boolean;
  };  // present in 44/236 instances [system key]
  message?: {
    content: string;
    records: string;
    parentstepid?: string;
    tags?: unknown[];
    tenant?: string;
    type?: string;
  };  // present in 12/236 instances [system key]
  operation?: string;  // present in 211/236 instances [system key]
  version?: string;  // present in 1/236 instances [system key]
  when?: string;  // present in 21/236 instances [system key]
  /** ~1 additional dynamic keys (user-defined variable / output names) */
  [key: string]: unknown;
}

/**
 * Manual Start
 * UUID     : f414d039-bb0d-4e59-9c39-a8f1e880b18a
 * Category : trigger
 * Instances: 806 step(s) across 806 playbook(s)
 */
export interface ManualStartArgs {
  inputVariables: ({
      formType: string;
      name: string;
      type: string;
      _addRequiredConditions?: boolean;
      _addVisibilityConditions?: boolean;
      _expanded?: boolean;
      _ignore?: boolean;
      _nameTouched?: boolean;
      _previousName?: string;
      allowedEncryption?: boolean;
      allowedGridColumn?: boolean;
      bulkAction?: unknown[];
      collection?: boolean;
      dataSource?: (unknown[] | {
        model: string;
        displayConditions: unknown[];
      } | {
        model: string;
      } | {
        model: string;
        query: Record<string, unknown>;
        displayConditions: Record<string, unknown>;
      });
      dataType?: string;
      defaultValue?: (unknown | null);
      displayTemplate?: string;
      inversedField?: null;
      jinjaExpressionView?: boolean;
      label?: string;
      lengthConstraint?: boolean;
      mmdUpdate?: boolean;
      moduleField?: string;
      ownsRelationship?: boolean;
      playbookField?: boolean;
      required?: boolean;
      requiredCondition?: string;
      requiredQuery?: unknown[];
      responseSelected?: unknown[];
      searchable?: boolean;
      templateUrl?: string;
      title?: string;
      tooltip?: string;
      usable?: boolean;
      useModuleField?: boolean;
      useRecordFieldDefault?: boolean;
      visibilityQuery?: {
        filters: Record<string, unknown>[];
        limit: number;
        logic: string;
        sort: unknown[];
      };
    })[];  // [system key]
  resources: string[];  // [system key]
  __triggerLimit?: boolean;  // present in 116/806 instances [system key]
  config?: string;  // present in 1/806 instances [system key]
  connector?: string;  // present in 1/806 instances [system key]
  displayConditions?: {
    alerts?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    assets?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    attachments?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    c_v_es?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    comments?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    communication?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    devices?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    events?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    files?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    food?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    forti_cloud_assets?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    huntalerts?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    incidents?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    indicators?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    managers?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    metafield_templates?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    netshot_domains?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    netshot_output_reports?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    netshot_target_outputs?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    netshot_targets?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    policy_requests?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    scenario?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    scripts?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    tasks?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    threat_actors?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    threat_intel_feeds?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    threat_intel_reports?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    usecase?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    vulnerabilities?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    warrooms?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    workspaces?: {
      filters: unknown[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
    z_t_p_profiles?: {
      filters: Record<string, unknown>[];
      limit: number;
      logic: string;
      sort: unknown[];
    };
  };  // present in 322/806 instances [system key]
  executeButtonText?: string;  // present in 672/806 instances
  name?: string;  // present in 1/806 instances [system key]
  noRecordExecution?: boolean;  // present in 785/806 instances
  operation?: string;  // present in 1/806 instances [system key]
  params?: {
    channel: string;
    comment: string;
    file_name: string;
    file_type: string;
    path: string;
    title: string;
    value: string;
  };  // present in 1/806 instances [system key]
  route?: string;  // present in 805/806 instances [system key]
  singleRecordExecution?: boolean;  // present in 789/806 instances
  step_variables?: unknown;  // present in 804/806 instances [system key]
  title?: string;  // present in 759/806 instances [system key]
  triggerOnReplicate?: boolean;  // present in 116/806 instances [system key]
  triggerOnSource?: boolean;  // present in 116/806 instances [system key]
  version?: string;  // present in 1/806 instances [system key]
  /** ~3 additional dynamic keys (user-defined variable / output names) */
  [key: string]: unknown;
}

/**
 * On Create
 * UUID     : ea155646-3821-4542-9702-b246da430a8d
 * Category : trigger
 * Instances: 36 step(s) across 36 playbook(s)
 * NOTE: No FAS equivalent — argument schema is intentionally shallow.
 */
export interface OnCreateArgs {
  fieldbasedtrigger: unknown;  // [system key]
  resource: string;  // [system key]
  step_variables: unknown;  // [system key]
  __triggerLimit?: boolean;  // present in 16/36 instances [system key]
  resources?: string[];  // present in 34/36 instances [system key]
  triggerOnReplicate?: boolean;  // present in 16/36 instances [system key]
  triggerOnSource?: boolean;  // present in 16/36 instances [system key]
}

/**
 * Ingest Bulk Feed
 * UUID     : 7b221880-716b-4726-a2ca-5e568d330b3e
 * Category : action
 * Instances: 10 step(s) across 9 playbook(s)
 */
export interface IngestBulkFeedArgs {
  collection: string;
  resource: Record<string, unknown>;  // [system key]
  step_variables: unknown[];  // [system key]
  __recommend?: unknown[];  // present in 9/10 instances
  _showJson?: boolean;  // present in 4/10 instances
  for_each?: {
    __bulk: boolean;
    batch_size: number;
    condition: string;
    item: string;
    parallel: boolean;
  };  // present in 9/10 instances [system key]
  when?: string;  // present in 2/10 instances [system key]
}

/**
 * Send Email (SMTP connector shortcut)
 * UUID     : 4c0019b2-055c-44d0-968c-678a0c2d762e
 * Category : action
 * Instances: 20 step(s) across 16 playbook(s)
 */
export interface SendEmailArgs {
  config: string;  // [system key]
  connector: string;  // [system key]
  from_str: string;  // [system key]
  step_variables: (unknown[] | {
    my_var1: string;
  } | {
    connector_name: string;
  });  // [system key]
  version: string;  // [system key]
  for_each?: {
    break_loop: string;
    condition: string;
    item: string;
    parallel: boolean;
  };  // present in 1/20 instances [system key]
  ignore_errors?: boolean;  // present in 1/20 instances [system key]
  message?: {
    content: string;
    records: string;
    tags: string[];
    tenant: string;
    thread: boolean;
    type: string;
  };  // present in 1/20 instances [system key]
  mock_result?: string;  // present in 1/20 instances
  operation?: string;  // present in 19/20 instances [system key]
  operationTitle?: string;  // present in 19/20 instances
  params?: {
    iri_list: string;
    subject: string;
    bcc?: string;
    bcc_recipients?: string;
    body?: string;
    body_type?: string;
    cc?: string;
    cc_recipients?: string;
    content?: string;
    file_name?: string;
    file_path?: string;
    from?: string;
    to?: string;
    to_recipients?: string;
    type?: string;
  };  // present in 19/20 instances [system key]
  when?: string;  // present in 5/20 instances [system key]
}

/**
 * Manual Input
 * UUID     : fc04082a-d7dc-4299-96fb-6837b1baa0fe
 * Category : action
 * Instances: 150 step(s) across 102 playbook(s)
 */
export interface ManualInputArgs {
  input: {
    schema: {
      description: string;
      inputVariables: Record<string, unknown>[];
      title: string;
    };
  };  // [system key]
  owner_detail: {
    isAssigned: boolean;
    assignedToField?: null;
    assignedToPerson?: ({
        firstname: string;
        iri: string;
        lastname: string;
      })[];
    assignedToRecord?: boolean;
    assignedToTeam?: unknown[];
    emailRecipients?: string;
    externalRecipients?: string;
  };
  record: string;
  response_mapping: {
    duplicateOption: boolean;
    options: ({
        option: string;
        primary?: boolean;
        step_iri?: (string | null);
      })[];
    customSuccessMessage?: string;
  };  // [system key]
  step_variables: (unknown[] | {
    address_group_name: string;
  } | {
    adom: string;
  } | {
    package: string;
  });  // [system key]
  type: string;
  agent_id?: null;  // present in 102/150 instances
  custom_email_body_external?: null;  // present in 65/150 instances
  custom_email_body_internal?: null;  // present in 13/150 instances
  customEmailExternal?: boolean;  // present in 66/150 instances
  customEmailInternal?: boolean;  // present in 13/150 instances
  email_notification?: {
    enabled: boolean;
    smtpParameters: unknown[];
  };  // present in 124/150 instances
  external_channel_list?: string[];  // present in 120/150 instances
  external_email_attachments?: null;  // present in 65/150 instances
  external_email_subject?: (string | null);  // present in 67/150 instances
  inline_channel_list?: string[];  // present in 120/150 instances
  inputExternalUser?: boolean;  // present in 18/150 instances
  inputInternalUsers?: boolean;  // present in 8/150 instances
  internal_email_attachments?: null;  // present in 13/150 instances
  internal_email_subject?: (string | null);  // present in 67/150 instances
  is_approval?: boolean;  // present in 81/150 instances
  isRecordLinked?: boolean;  // present in 121/150 instances
  message?: {
    content: string;
    records: string;
    tags: unknown[];
    tenant: string;
    type: string;
    thread?: boolean;
  };  // present in 3/150 instances [system key]
  resources?: string;  // present in 117/150 instances [system key]
  timeout?: {
    days: number;
    hours: number;
    minutes: number;
    step_iri: string;
  };  // present in 20/150 instances
  unauthenticated_input?: boolean;  // present in 120/150 instances
}

/**
 * a19333c2-c822-11ed-afa1-0242ac120002
 * UUID     : a19333c2-c822-11ed-afa1-0242ac120002
 * Category : unknown
 * Instances: 3 step(s) across 3 playbook(s)
 * TODO: classify this step type
 */
export interface StepArgs_a19333c2_c822_11ed_afa1_0242ac120002 {
  agent_id: null;
  custom_email_body_external: null;
  customEmailExternal: boolean;
  email_notification: {
    enabled: boolean;
    smtpParameters: unknown[];
  };
  external_channel_list: unknown[];
  external_email_attachments: null;
  external_email_subject: null;
  inline_channel_list: unknown[];
  input: {
    schema: {
      description: string;
      inputVariables: unknown[];
      title: string;
    };
  };  // [system key]
  internal_email_subject: string;
  is_approval: boolean;
  isRecordLinked: boolean;
  owner_detail: {
    emailRecipients: string;
    isAssigned: boolean;
    assignedToField?: null;
    assignedToPerson?: ({
        firstname: string;
        iri: string;
        lastname: string;
      })[];
    assignedToRecord?: boolean;
    assignedToTeam?: unknown[];
  };
  record: string;
  resources: string;  // [system key]
  response_mapping: {
    connecteStepsLength: number;
    customSuccessMessage: string;
    options: ({
        option: string;
        primary: boolean;
        step_iri: (string | null);
      })[];
  };  // [system key]
  step_variables: unknown[];  // [system key]
  type: string;
  unauthenticated_input: boolean;
}

/**
 * dc6ac63d-c5a5-472f-9eb4-6b18473a98b8
 * UUID     : dc6ac63d-c5a5-472f-9eb4-6b18473a98b8
 * Category : unknown
 * Instances: 6 step(s) across 3 playbook(s)
 * TODO: classify this step type
 */
export interface StepArgs_dc6ac63d_c5a5_472f_9eb4_6b18473a98b8 {
  collection: string;
  resource: {
    assignedToPerson: (string | {
      id: number;
      "@id": string;
      type: null;
      "@type": string;
      email: string;
      title: string;
      avatar: null;
      userId: string;
      display: string;
      rawData: null;
      lastname: string;
      phoneFax: null;
      userType: null;
      "@settings": string;
      companyId: null;
      firstname: string;
      phoneHome: null;
      phoneWork: string;
      createDate: number;
      createUser: string;
      department: null;
      modifyDate: number;
      modifyUser: string;
      description: null;
      phoneMobile: null;
    });
    incidents: (string | null);
    name: string;
    priority: (string | {
      id: number;
      "@id": string;
      icon: null;
      "@type": string;
      color: string;
      display: string;
      listName: string;
      itemValue: string;
      orderIndex: number;
    });
    status: (string | {
      id: number;
      "@id": string;
      icon: null;
      uuid: string;
      "@type": string;
      color: string;
      display: string;
      listName: string;
      itemValue: string;
      orderIndex: number;
    });
    actualMinutes?: null;
    alerts?: string;
    approvalhost?: null;
    assets?: null;
    assignedOnDate?: null;
    attachments?: null;
    comments?: null;
    companies?: null;
    completedOnDate?: null;
    conflict?: null;
    createDate?: null;
    createUser?: null;
    description?: string;
    dueBy?: null;
    hunt?: null;
    id?: null;
    modifyDate?: null;
    modifyUser?: null;
    notes?: null;
    owners?: null;
    persons?: null;
    recordTags?: null;
    startDate?: null;
    stepid?: null;
    systemAssignedQueue?: null;
    taskdata?: null;
    taskTeams?: null;
    tasktype?: null;
    tenant?: null;
    tenantRecordId?: null;
    type?: {
      "@id": string;
      "@type": string;
      color: null;
      display: string;
      icon: null;
      id: number;
      itemValue: string;
      listName: string;
      orderIndex: number;
      uuid: string;
    };
    userOwners?: null;
    vulnerabilities?: null;
    warrooms?: null;
    workflowid?: null;
  };  // [system key]
  step_variables: unknown[];  // [system key]
  message?: {
    content: string;
    records: string;
    tenant: string;
    parentstepid?: string;
  };  // present in 3/6 instances [system key]
}

/**
 * API Endpoint
 * UUID     : df26c7a2-4166-4ca5-91e5-548e24c01b5f
 * Category : trigger
 * Instances: 10 step(s) across 10 playbook(s)
 * NOTE: No FAS equivalent — argument schema is intentionally shallow.
 */
export interface APIEndpointArgs {
  authentication_methods: string[];
  route: string;  // [system key]
  step_variables: unknown;  // [system key]
  __triggerLimit?: boolean;  // present in 6/10 instances [system key]
  triggerOnReplicate?: boolean;  // present in 7/10 instances [system key]
  triggerOnSource?: boolean;  // present in 7/10 instances [system key]
}

/**
 * Code Snippet
 * UUID     : 1fdd14cc-d6b4-4335-a3af-ab49c8ed2fd8
 * Category : action
 * Instances: 24 step(s) across 20 playbook(s)
 */
export interface CodeSnippetArgs {
  config: string;  // [system key]
  connector: string;  // [system key]
  operation: string;  // [system key]
  operationTitle: string;
  params: {
    python_function: string;
  };  // [system key]
  step_variables: (unknown[] | {
    regex2json_data: string;
  } | {
    fac_health: string;
  });  // [system key]
  version: string;  // [system key]
  when?: string;  // present in 1/24 instances [system key]
}

/**
 * b104e839-fc31-48b3-8c50-7e9433f33d79
 * UUID     : b104e839-fc31-48b3-8c50-7e9433f33d79
 * Category : unknown
 * Instances: 2 step(s) across 2 playbook(s)
 * TODO: classify this step type
 */
export interface StepArgs_b104e839_fc31_48b3_8c50_7e9433f33d79 {
  private_key: string;
  public_key: string;
}

// ============================================================
// 3. Union & Utility Types
// ============================================================

export type AnyStepArgs =
  | ConnectorArgs
  | FASTriggerArgs
  | SetVariablesArgs
  | FindRecordArgs
  | ReferencePlaybookArgs
  | WaitArgs
  | OnUpdateArgs
  | DecisionArgs
  | UtilityNoOpArgs
  | UpdateRecordArgs
  | CreateRecordArgs
  | ManualStartArgs
  | OnCreateArgs
  | IngestBulkFeedArgs
  | SendEmailArgs
  | ManualInputArgs
  | StepArgs_a19333c2_c822_11ed_afa1_0242ac120002
  | StepArgs_dc6ac63d_c5a5_472f_9eb4_6b18473a98b8
  | APIEndpointArgs
  | CodeSnippetArgs
  | StepArgs_b104e839_fc31_48b3_8c50_7e9433f33d79;

// ============================================================
// 4. Playbook & Step Structural Interfaces
//
//  Derived from observed playbook/step objects (excluding step
//  arguments, which are in Section 2). Use these to validate
//  the shape of converter output.
// ============================================================

/** Top-level playbook/workflow object (steps array excluded). */
export interface PlaybookStructure {
  /** e.g. "Workflow" */
  "@type": string;
  /** e.g. "#PostCreate" */
  aliasName: (string | null);
  /** e.g. "/api/3/workflow_collections/033c380b-3d36-4289-b05c-a4e27a9ba0e8" */
  collection: string;
  /** e.g. false */
  debug: boolean;
  deletedAt: null;
  /** e.g. "Creates a vector store based on the name, file ID, and other"..." */
  description: (string | null);
  /** e.g. [] */
  groups: ({
      "@type": string;
      description: string;
      hasTriggerStep: boolean;
      height: string;
      hideInLogs: boolean;
      isCollapsed: boolean;
      left: string;
      metadata: unknown[];
      name: string;
      recordTags: unknown[];
      reusable: boolean;
      top: string;
      type: string;
      uuid: string;
      width: string;
    })[];
  /** e.g. 361 */
  id: number;
  /** e.g. [] */
  importedBy: ({
      apiName: string;
      name: string;
      version: string;
    })[];
  /** e.g. false */
  isActive: boolean;
  /** e.g. true */
  isEditable: boolean;
  /** e.g. false */
  isPrivate: boolean;
  /** e.g. 1721367365 */
  lastModifyDate: (number | null);
  /** e.g. "Create Vector Store" */
  name: string;
  /** e.g. [] */
  owners: string[];
  /** e.g. [] */
  parameters: (string[] | null);
  /** e.g. "/api/3/picklists/15c1e8c9-22bf-4e66-8fbb-0a502d4a4a3f" */
  playbookOrigin: string;
  /** e.g. "/api/3/picklists/2b563c61-ae2c-41c0-a85a-c9709585e3f2" */
  priority: (string | null);
  /** e.g. ["openai", ...] */
  recordTags: string[];
  /** e.g. false */
  remoteExecutableFlag: boolean;
  /** e.g. [{ @type, name, targetStep, ... }] */
  routes: ({
      "@type": string;
      group: null;
      isExecuted: boolean;
      label: (string | null);
      name: string;
      sourceStep: string;
      targetStep: string;
      uuid: string;
    })[];
  /** e.g. false */
  singleRecordExecution: boolean;
  /** e.g. false */
  synchronous: boolean;
  /** e.g. "#OpenAI" */
  tag: (string | null);
  triggerLimit: null;
  /** e.g. "/api/3/workflow_steps/45ee16ab-627d-4b88-8611-cb094843b858" */
  triggerStep: (string | null);
  /** e.g. "088623bb-1a85-4d3f-851f-604c23e8a376" */
  uuid: string;
  /** e.g. [] */
  versions: unknown[];
}

/** Step object structure (arguments field excluded — see Section 2). */
export interface StepStructure {
  /** e.g. "WorkflowStep" */
  "@type": string;
  /** e.g. "Synch DB by Device" */
  description: (string | null);
  /** e.g. "/api/3/workflow_groups/1de03229-4adf-4d54-aec8-5c3c20778e3b" */
  group: (string | null);
  /** e.g. "188" */
  left: string;
  /** e.g. "Create Vector Store" */
  name: string;
  status: null;
  /** e.g. "0bfed618-0316-11e7-93ae-92361f002671" */
  stepType: string;
  /** e.g. "120" */
  top: string;
  /** e.g. "1ea31b89-2ff7-4297-b22a-c81d3ea2a551" */
  uuid: string;
}

/** A fully-typed step including its arguments. */
export interface PlaybookStep extends StepStructure {
  arguments: AnyStepArgs;
}
