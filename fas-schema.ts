/**
 * Auto-generated step-type schema
 * Source    : all_fsm_fndn_collections_2.json
 * Type      : playbook_collections
 * Generated : 2026-04-11T19:47:03.691Z
 * Collections: 23  |  Total steps: 484  |  Step types: 10
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
  // Application Event (FAS only — no FSR equivalent)
  '202ecbe9-e4b9-4f71-9fd9-66a054b5443f': {
    uuid: '202ecbe9-e4b9-4f71-9fd9-66a054b5443f',
    name: 'ApplicationEvent',
    label: 'Application Event (FAS only — no FSR equivalent)',
    category: 'trigger',
    occurrences: 23,
    playbookCount: 23,
  },
  // Set Variables
  '04d0cf46-b6a8-42c4-8683-60a7eaa69e8f': {
    uuid: '04d0cf46-b6a8-42c4-8683-60a7eaa69e8f',
    name: 'SetVariables',
    label: 'Set Variables',
    category: 'action',
    occurrences: 171,
    playbookCount: 57,
  },
  // Connector
  '0bfed618-0316-11e7-93ae-92361f002671': {
    uuid: '0bfed618-0316-11e7-93ae-92361f002671',
    name: 'Connector',
    label: 'Connector',
    category: 'action',
    occurrences: 177,
    playbookCount: 49,
  },
  // Wait
  '6832e556-b9c7-497a-babe-feda3bd27dbf': {
    uuid: '6832e556-b9c7-497a-babe-feda3bd27dbf',
    name: 'Wait',
    label: 'Wait',
    category: 'control',
    occurrences: 1,
    playbookCount: 1,
  },
  // Reference Playbook
  '74932bdc-b8b6-4d24-88c4-1a4dfbc524f3': {
    uuid: '74932bdc-b8b6-4d24-88c4-1a4dfbc524f3',
    name: 'ReferencePlaybook',
    label: 'Reference Playbook',
    category: 'action',
    occurrences: 26,
    playbookCount: 26,
  },
  // Send Email (SMTP connector shortcut)
  '4c0019b2-055c-44d0-968c-678a0c2d762e': {
    uuid: '4c0019b2-055c-44d0-968c-678a0c2d762e',
    name: 'SendEmail',
    label: 'Send Email (SMTP connector shortcut)',
    category: 'action',
    occurrences: 2,
    playbookCount: 2,
  },
  // Manual Input
  'fc04082a-d7dc-4299-96fb-6837b1baa0fe': {
    uuid: 'fc04082a-d7dc-4299-96fb-6837b1baa0fe',
    name: 'ManualInput',
    label: 'Manual Input',
    category: 'action',
    occurrences: 21,
    playbookCount: 21,
  },
  // Start/Trigger (FAS Referenced)
  'b348f017-9a94-471f-87f8-ce88b6a7ad62': {
    uuid: 'b348f017-9a94-471f-87f8-ce88b6a7ad62',
    name: 'FASTrigger',
    label: 'Start/Trigger (FAS Referenced)',
    category: 'trigger',
    occurrences: 36,
    playbookCount: 36,
  },
  // Utility/No-Op
  '0109f35d-090b-4a2b-bd8a-94cbc3508562': {
    uuid: '0109f35d-090b-4a2b-bd8a-94cbc3508562',
    name: 'UtilityNoOp',
    label: 'Utility/No-Op',
    category: 'utility',
    occurrences: 10,
    playbookCount: 10,
  },
  // Decision
  '12254cf5-5db7-4b1a-8cb1-3af081924b28': {
    uuid: '12254cf5-5db7-4b1a-8cb1-3af081924b28',
    name: 'Decision',
    label: 'Decision',
    category: 'control',
    occurrences: 17,
    playbookCount: 7,
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
 * Application Event (FAS only — no FSR equivalent)
 * UUID     : 202ecbe9-e4b9-4f71-9fd9-66a054b5443f
 * Category : trigger
 * Instances: 23 step(s) across 23 playbook(s)
 */
export interface ApplicationEventArgs {
  "@id": string;
  "@type": string;
  agentId: string;
  batch_preference: number;
  connector_action: string;
  connector_action_inputs: Record<string, never>;
  connector_icon: string;
  connector_label: string;
  connector_mapping: {
    datetime: {
      from: string;
      to: string;
    };
    response: string;
  };
  connector_name: string;
  connector_version: string;
  createUser_id: null;
  description: string;  // [system key]
  event_id: string;
  exit_if_running: boolean;
  installed_by: string;
  modifyUser_id: null;
  name: string;  // [system key]
  poll: null;
  sample_data: (({
      count: number;
      customer: string;
      eventName: string;
      eventType: string;
      incidentId: number;
      incidentSrc: {
        computer: string;
      };
      incidentReso: number;
      eventSeverity: number;
      incidentRptIp: string;
      incidentTitle: string;
      incidentDetail: string;
      incidentStatus: number;
      incidentTarget: {
        user: string;
        destName: string;
      };
      eventSeverityCat: string;
      incidentLastSeen: number;
      incidentFirstSeen: number;
      incidentStatusStr: string;
      incidentRptDevName: string;
      phIncidentCategory: number;
      incidentClearedTime: number;
      phSubIncidentCategory: string;
    } | string | {
      count: number;
      customer: string;
      eventName: string;
      eventType: string;
      incidentId: number;
      incidentSrc: Record<string, never>;
      incidentReso: number;
      eventSeverity: number;
      incidentRptIp: string;
      incidentTitle: string;
      incidentDetail: string;
      incidentStatus: number;
      incidentTarget: {
        hostIpAddr: string;
      };
      eventSeverityCat: string;
      incidentLastSeen: number;
      incidentFirstSeen: number;
      incidentStatusStr: string;
      incidentRptDevName: string;
      phIncidentCategory: number;
      incidentClearedTime: number;
      incidentClearedReason: string;
      phSubIncidentCategory: string;
    }))[];
  schedule: null;
  start_time: null;
  tag: null;
  trigger_condition: {
    filters: ({
        evaluation: boolean;
        field: string;
        operator: string;
        originalValue: string;
        type: string;
        value: string;
      })[];
    limit: number;
    logic: string;
    sort: unknown[];
  };
  type: string[];
  uuid: string;
  agent?: string;  // present in 10/23 instances
  default?: boolean;  // present in 15/23 instances
  step_variables?: {
    input: {
      params: Record<string, never>;
    };
  };  // present in 8/23 instances [system key]
  system?: boolean;  // present in 1/23 instances
}

/**
 * Set Variables
 * UUID     : 04d0cf46-b6a8-42c4-8683-60a7eaa69e8f
 * Category : action
 * Instances: 171 step(s) across 57 playbook(s)
 */
export interface SetVariablesArgs {
  for_each?: {
    item: string;
    parallel?: boolean;
  };  // present in 2/171 instances [system key]
  /** ~139 additional dynamic keys (user-defined variable / output names) */
  [key: string]: unknown;
}

/**
 * Connector
 * UUID     : 0bfed618-0316-11e7-93ae-92361f002671
 * Category : action
 * Instances: 177 step(s) across 49 playbook(s)
 */
export interface ConnectorArgs {
  agent: string;
  config: string;  // [system key]
  connector: string;  // [system key]
  name: string;  // [system key]
  operation: string;  // [system key]
  params: Record<string, unknown>;  // [system key]
  pickFromTenant: boolean;
  version: string;  // [system key]
  apply_async?: boolean;  // present in 5/177 instances
  ignore_errors?: boolean;  // present in 11/177 instances [system key]
  mock_result?: string;  // present in 6/177 instances
  step_variables?: {
    _evt_fulldetail?: string;
    jiraProjectID?: string;
  };  // present in 4/177 instances [system key]
}

/**
 * Wait
 * UUID     : 6832e556-b9c7-497a-babe-feda3bd27dbf
 * Category : control
 * Instances: 1 step(s) across 1 playbook(s)
 */
export interface WaitArgs {
  delay: {
    seconds: number;
  };
  type: string;
}

/**
 * Reference Playbook
 * UUID     : 74932bdc-b8b6-4d24-88c4-1a4dfbc524f3
 * Category : action
 * Instances: 26 step(s) across 26 playbook(s)
 */
export interface ReferencePlaybookArgs {
  arguments: {
    htmlTable?: string;
    markdownTable?: string;
    report_data?: string;
    report_details?: string;
  };
  pass_input_record: boolean;
  pass_parent_env: boolean;
  workflowReference: string;
  for_each?: {
    condition: string;
    item: string;
  };  // present in 1/26 instances [system key]
  ignore_errors?: boolean;  // present in 1/26 instances [system key]
  message?: {
    content: string;
    tags: string[];
  };  // present in 1/26 instances [system key]
  step_variables?: {
    test_var: string;
  };  // present in 1/26 instances [system key]
  when?: string;  // present in 1/26 instances [system key]
  /** ~2 additional dynamic keys (user-defined variable / output names) */
  [key: string]: unknown;
}

/**
 * Send Email (SMTP connector shortcut)
 * UUID     : 4c0019b2-055c-44d0-968c-678a0c2d762e
 * Category : action
 * Instances: 2 step(s) across 2 playbook(s)
 */
export interface SendEmailArgs {
  agent: string;
  config: string;  // [system key]
  connector: string;  // [system key]
  from_str: string;  // [system key]
  name: string;  // [system key]
  operation: string;  // [system key]
  params: {
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
  };  // [system key]
  pickFromTenant: boolean;
  version: string;  // [system key]
}

/**
 * Manual Input
 * UUID     : fc04082a-d7dc-4299-96fb-6837b1baa0fe
 * Category : action
 * Instances: 21 step(s) across 21 playbook(s)
 */
export interface ManualInputArgs {
  email_notification: {
    enabled: boolean;
    smtpParameters: Record<string, never>;
  };
  external_channel_list: unknown[];
  inline_channel_list: unknown[];
  input: {
    schema: {
      description: string;
      inputVariables: Record<string, unknown>[];
      title: string;
    };
  };  // [system key]
  is_approval: boolean;
  owner_detail: {
    assignedToField: null;
    assignedToPerson: unknown[];
    isAssigned: boolean;
    assignedToRecord?: boolean;
    assignedToTeam?: unknown[];
    emailRecipients?: string;
  };
  response_mapping: {
    connecteStepsLength: number;
    customSuccessMessage: string;
    options: ({
        option: string;
        primary: boolean;
        step_uuid: string;
        step_iri?: string;
      })[];
  };  // [system key]
  type: string;
  unauthenticated_input: boolean;
  /** ~11 additional dynamic keys (user-defined variable / output names) */
  [key: string]: unknown;
}

/**
 * Start/Trigger (FAS Referenced)
 * UUID     : b348f017-9a94-471f-87f8-ce88b6a7ad62
 * Category : trigger
 * Instances: 36 step(s) across 36 playbook(s)
 */
export interface FASTriggerArgs {
  __triggerLimit: boolean;  // [system key]
  step_variables: {
    input: {
      params: unknown[];
    };
  };  // [system key]
  triggerOnReplicate: boolean;  // [system key]
  triggerOnSource: boolean;  // [system key]
}

/**
 * Utility/No-Op
 * UUID     : 0109f35d-090b-4a2b-bd8a-94cbc3508562
 * Category : utility
 * Instances: 10 step(s) across 10 playbook(s)
 */
export interface UtilityNoOpArgs {
  agent: string;
  config: string;  // [system key]
  connector: string;  // [system key]
  name: string;  // [system key]
  operation: string;  // [system key]
  params: {
    data: string;
    display?: string;
    file_name?: string;
    row_fields?: string;
    save_to_file?: boolean;
    show_button?: boolean;
    styling?: boolean;
    template?: string;
  };  // [system key]
  pickFromTenant: boolean;
  version: string;  // [system key]
  step_variables?: {
    markdownTable: string;
  };  // present in 9/10 instances [system key]
}

/**
 * Decision
 * UUID     : 12254cf5-5db7-4b1a-8cb1-3af081924b28
 * Category : control
 * Instances: 17 step(s) across 7 playbook(s)
 */
export interface DecisionArgs {
  conditions: ({
      option: string;
      step_iri: string;
      step_name: string;
      condition?: string;
      default?: boolean;
    })[];  // [system key]
}

// ============================================================
// 3. Union & Utility Types
// ============================================================

export type AnyStepArgs =
  | ApplicationEventArgs
  | SetVariablesArgs
  | ConnectorArgs
  | WaitArgs
  | ReferencePlaybookArgs
  | SendEmailArgs
  | ManualInputArgs
  | FASTriggerArgs
  | UtilityNoOpArgs
  | DecisionArgs;

// ============================================================
// 4. Playbook & Step Structural Interfaces
//
//  Derived from observed playbook/step objects (excluding step
//  arguments, which are in Section 2). Use these to validate
//  the shape of converter output.
// ============================================================

/** Top-level playbook/workflow object (steps array excluded). */
export interface PlaybookStructure {
  /** e.g. "/api/workflow/playbooks/8f7abd4d-f443-4a9d-b825-31e8dd96aa62/" */
  "@id": string;
  /** e.g. "Workflow" */
  "@type": string;
  aliasName: null;
  /** e.g. { @id, uuid, createDate, ... } */
  collection: {
    "@id": string;
    "@type": string;
    createDate: string;
    createUser: (string | null);
    deletedAt: null;
    description: (string | null);
    image: null;
    importedBy: Record<string, never>;
    isEditable: boolean;
    modifyDate: string;
    modifyUser: (string | null);
    name: string;
    tags: string[];
    uuid: string;
    visible: boolean;
  };
  /** e.g. "2026-03-09T13:05:10.324560Z" */
  createDate: string;
  /** e.g. "9180a96e-d11d-4a69-8ab7-8368ad13b639" */
  createUser: string;
  /** e.g. false */
  debug: boolean;
  deletedAt: null;
  /** e.g. "Pull data from triggering Events and add into Incident details" */
  description: (string | null);
  /** e.g. [] */
  groups: unknown[];
  importedBy: null;
  /** e.g. true */
  isActive: boolean;
  /** e.g. true */
  isEditable: boolean;
  /** e.g. false */
  isPrivate: boolean;
  /** e.g. 1775785280 */
  lastModifyDate: (number | null);
  /** e.g. "2026-03-09T13:05:10.324570Z" */
  modifyDate: string;
  /** e.g. "9180a96e-d11d-4a69-8ab7-8368ad13b639" */
  modifyUser: (string | null);
  /** e.g. "Student Playbook1" */
  name: string;
  /** e.g. [] */
  parameters: (({
      defaultValue: string;
      name: string;
      type: string;
    })[] | null);
  /** e.g. false */
  pinned: boolean;
  /** e.g. "medium" */
  priority: string;
  /** e.g. false */
  remoteExecutableFlag: boolean;
  /** e.g. [] */
  routes: ({
      "@id": string;
      "@type": string;
      data: {
        label: string;
      };
      isExecuted: boolean;
      name: string;
      sourcestep: string;
      targetstep: string;
      uuid: string;
      workflow: string;
      workflowgroup: null;
    })[];
  /** e.g. false */
  singleRecordExecution: boolean;
  /** e.g. false */
  synchronous: boolean;
  /** e.g. [] */
  tags: string[];
  triggerLimit: null;
  /** e.g. "940f6020-a535-4cb3-a501-84fb6672d7fe" */
  triggerstep: (string | null);
  /** e.g. "8f7abd4d-f443-4a9d-b825-31e8dd96aa62" */
  uuid: string;
}

/** Step object structure (arguments field excluded — see Section 2). */
export interface StepStructure {
  /** e.g. "WorkflowStep" */
  "@type": string;
  /** e.g. "Please Update the pre-configure step:\ntimeZone to match your"..." */
  description: (string | null);
  /** e.g. "-205" */
  left: string;
  /** e.g. "Start" */
  name: string;
  status: null;
  /** e.g. "202ecbe9-e4b9-4f71-9fd9-66a054b5443f" */
  stepType: string;
  /** e.g. "0" */
  top: string;
  /** e.g. "940f6020-a535-4cb3-a501-84fb6672d7fe" */
  uuid: string;
  /** e.g. "3850b827-70da-4552-af7e-3a9a3c9792c6" */
  workflow: string;
  workflowgroup: null;
}

/** A fully-typed step including its arguments. */
export interface PlaybookStep extends StepStructure {
  arguments: AnyStepArgs;
}
