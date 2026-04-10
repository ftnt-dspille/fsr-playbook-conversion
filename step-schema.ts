/**
 * Auto-generated step-type schema
 * Source    : all_fsm_fndn_collections_2.json
 * Type      : playbook_collections
 * Generated : 2026-04-10T01:50:30.780Z
 * Collections: 23  |  Total steps: 484  |  Step types: 10
 * Mode      : --show-all-keys (all keys listed with frequency for system vs user-defined analysis)
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
  "@id": string;  // 23/23 instances (100%)
  "@type": string;  // 23/23 instances (100%)
  agentId: string;  // 23/23 instances (100%)
  batch_preference: number;  // 23/23 instances (100%)
  connector_action: string;  // 23/23 instances (100%)
  connector_action_inputs: Record<string, never>;  // 23/23 instances (100%)
  connector_icon: string;  // 23/23 instances (100%)
  connector_label: string;  // 23/23 instances (100%)
  connector_mapping: {
    datetime: {
      to: string;
      from: string;
    };
    response: string;
  };  // 23/23 instances (100%)
  connector_name: string;  // 23/23 instances (100%)
  connector_version: string;  // 23/23 instances (100%)
  createUser_id: null;  // 23/23 instances (100%)
  description: string;  // 23/23 instances (100%)
  event_id: string;  // 23/23 instances (100%)
  exit_if_running: boolean;  // 23/23 instances (100%)
  installed_by: string;  // 23/23 instances (100%)
  modifyUser_id: null;  // 23/23 instances (100%)
  name: string;  // 23/23 instances (100%)
  poll: null;  // 23/23 instances (100%)
  sample_data: ({
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
    }[] | string[] | {
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
    }[]);  // 23/23 instances (100%)
  schedule: null;  // 23/23 instances (100%)
  start_time: null;  // 23/23 instances (100%)
  tag: null;  // 23/23 instances (100%)
  trigger_condition: ({
    sort: unknown[];
    limit: number;
    logic: string;
    filters: unknown[];
  } | {
    sort: unknown[];
    limit: number;
    logic: string;
    filters: {
        type: string;
        field: string;
        value: string;
        operator: string;
        evaluation: boolean;
        originalValue: string;
      }[];
  });  // 23/23 instances (100%)
  type: string[];  // 23/23 instances (100%)
  uuid: string;  // 23/23 instances (100%)
  default?: boolean;  // 15/23 instances (65%)
  agent?: string;  // 10/23 instances (43%)
  step_variables?: {
    input: {
      params: Record<string, never>;
    };
  };  // 8/23 instances (35%)
  system?: boolean;  // 1/23 instances (4%)
}

/**
 * Set Variables
 * UUID     : 04d0cf46-b6a8-42c4-8683-60a7eaa69e8f
 * Category : action
 * Instances: 171 step(s) across 57 playbook(s)
 */
export interface SetVariablesArgs {
  output?: string;  // 23/171 instances (13%)
  targetUser?: string;  // 17/171 instances (10%)
  targetDomain?: string;  // 16/171 instances (9%)
  org?: string;  // 14/171 instances (8%)
  targetGroup?: string;  // 14/171 instances (8%)
  asset?: string;  // 12/171 instances (7%)
  report_data?: string;  // 12/171 instances (7%)
  incident_id?: string;  // 9/171 instances (5%)
  recordMetaData?: string;  // 9/171 instances (5%)
  summaryJSON?: string;  // 9/171 instances (5%)
  tableSummary?: string;  // 9/171 instances (5%)
  comment?: string;  // 8/171 instances (5%)
  incident_data?: string;  // 8/171 instances (5%)
  rptDevName?: string;  // 7/171 instances (4%)
  ioc?: string;  // 6/171 instances (4%)
  adv_sql_siem_query?: string;  // 5/171 instances (3%)
  basic_fields?: string;  // 5/171 instances (3%)
  basic_group_by?: string;  // 5/171 instances (3%)
  basic_query?: string;  // 5/171 instances (3%)
  last_analysis_time?: string;  // 5/171 instances (3%)
  report_id?: string;  // 5/171 instances (3%)
  data?: string;  // 4/171 instances (2%)
  incidentId?: string;  // 4/171 instances (2%)
  new_password?: string;  // 4/171 instances (2%)
  user?: string;  // 4/171 instances (2%)
  user_change?: string;  // 4/171 instances (2%)
  allTables?: string;  // 3/171 instances (2%)
  harmlessCount?: string;  // 3/171 instances (2%)
  maliciousCount?: string;  // 3/171 instances (2%)
  my_comment?: string;  // 3/171 instances (2%)
  queryResult?: string;  // 3/171 instances (2%)
  response?: string;  // 3/171 instances (2%)
  suspiciousCount?: string;  // 3/171 instances (2%)
  template?: string;  // 3/171 instances (2%)
  undetectedCount?: string;  // 3/171 instances (2%)
  vt_link?: string;  // 3/171 instances (2%)
  "0_readme"?: string;  // 2/171 instances (1%)
  addrGroupName?: string;  // 2/171 instances (1%)
  apply_async?: boolean;  // 2/171 instances (1%)
  digit_count?: string;  // 2/171 instances (1%)
  dn?: string;  // 2/171 instances (1%)
  domain?: string;  // 2/171 instances (1%)
  for_each?: ({
    item: string;
  } | {
    item: string;
    parallel: boolean;
  });  // 2/171 instances (1%)
  incidentTitle?: string;  // 2/171 instances (1%)
  lookup_ip?: string;  // 2/171 instances (1%)
  lower_count?: string;  // 2/171 instances (1%)
  memberName?: string;  // 2/171 instances (1%)
  myXML?: string;  // 2/171 instances (1%)
  rawMsg?: string;  // 2/171 instances (1%)
  restricted_users?: string;  // 2/171 instances (1%)
  ruleName?: string;  // 2/171 instances (1%)
  sam?: string;  // 2/171 instances (1%)
  special_count?: string;  // 2/171 instances (1%)
  status?: string;  // 2/171 instances (1%)
  time?: string;  // 2/171 instances (1%)
  upper_count?: string;  // 2/171 instances (1%)
  url?: string;  // 2/171 instances (1%)
  user_list?: string;  // 2/171 instances (1%)
  vt_domain_result_table?: string;  // 2/171 instances (1%)
  vt_url_result_table?: string;  // 2/171 instances (1%)
  _temp?: string;  // 1/171 instances (1%)
  adv_sql_table_domain?: string;  // 1/171 instances (1%)
  adv_sql_table_domain_html?: string;  // 1/171 instances (1%)
  adv_sql_table_ip?: string;  // 1/171 instances (1%)
  adv_sql_table_ip_html?: string;  // 1/171 instances (1%)
  adv_sql_table_url?: string;  // 1/171 instances (1%)
  adv_sql_table_url_html?: string;  // 1/171 instances (1%)
  artifact_exclusion?: string;  // 1/171 instances (1%)
  basic_table_domain?: string;  // 1/171 instances (1%)
  basic_table_domain_html?: string;  // 1/171 instances (1%)
  basic_table_ip?: string;  // 1/171 instances (1%)
  basic_table_ip_html?: string;  // 1/171 instances (1%)
  basic_table_url?: string;  // 1/171 instances (1%)
  basic_table_url_html?: string;  // 1/171 instances (1%)
  capture?: string;  // 1/171 instances (1%)
  code?: string;  // 1/171 instances (1%)
  commentHTML?: string;  // 1/171 instances (1%)
  content?: string;  // 1/171 instances (1%)
  countUsers?: string;  // 1/171 instances (1%)
  custId?: string;  // 1/171 instances (1%)
  destDomain?: string;  // 1/171 instances (1%)
  destIp?: string;  // 1/171 instances (1%)
  domains_hostnames?: string;  // 1/171 instances (1%)
  dst?: string;  // 1/171 instances (1%)
  eventIdList?: string;  // 1/171 instances (1%)
  eventName?: string;  // 1/171 instances (1%)
  eventType?: string;  // 1/171 instances (1%)
  evt_fulldetail?: string;  // 1/171 instances (1%)
  evt_summary?: string;  // 1/171 instances (1%)
  FoInt?: string;  // 1/171 instances (1%)
  fsm_advquery?: string;  // 1/171 instances (1%)
  fsm_attributes?: string;  // 1/171 instances (1%)
  hashes?: string;  // 1/171 instances (1%)
  incFirstSeen?: string;  // 1/171 instances (1%)
  incidentEnd?: string;  // 1/171 instances (1%)
  incidentID?: string;  // 1/171 instances (1%)
  incidentStart?: string;  // 1/171 instances (1%)
  incLastSeen?: string;  // 1/171 instances (1%)
  ioc_cve?: string;  // 1/171 instances (1%)
  ioc_dns?: string;  // 1/171 instances (1%)
  ioc_hash?: string;  // 1/171 instances (1%)
  ioc_ips?: string;  // 1/171 instances (1%)
  ioc_type?: string;  // 1/171 instances (1%)
  ioc_url?: string;  // 1/171 instances (1%)
  ioc_usr?: string;  // 1/171 instances (1%)
  iocs?: string;  // 1/171 instances (1%)
  ip?: string;  // 1/171 instances (1%)
  ip_addresses?: string;  // 1/171 instances (1%)
  ip_list?: string;  // 1/171 instances (1%)
  ip_qual_domain_table?: string;  // 1/171 instances (1%)
  ip_qual_domain_table_html?: string;  // 1/171 instances (1%)
  ip_qual_ip_table?: string;  // 1/171 instances (1%)
  ip_qual_ip_table_html?: string;  // 1/171 instances (1%)
  ip_qual_url_table?: string;  // 1/171 instances (1%)
  ip_qual_url_table_html?: string;  // 1/171 instances (1%)
  is_asset_email?: string;  // 1/171 instances (1%)
  other_artifacts?: string;  // 1/171 instances (1%)
  output0?: string;  // 1/171 instances (1%)
  qual_score_url_summary?: string;  // 1/171 instances (1%)
  ransomware_exploited_data?: string;  // 1/171 instances (1%)
  recon_data?: string;  // 1/171 instances (1%)
  record?: string;  // 1/171 instances (1%)
  relevant_artifacts?: string;  // 1/171 instances (1%)
  reportData?: string;  // 1/171 instances (1%)
  src?: string;  // 1/171 instances (1%)
  srcIp?: string;  // 1/171 instances (1%)
  tableId?: string;  // 1/171 instances (1%)
  tableUsers?: string;  // 1/171 instances (1%)
  taretUser?: string;  // 1/171 instances (1%)
  TargetUser?: string;  // 1/171 instances (1%)
  timeZone?: string;  // 1/171 instances (1%)
  unique_FoI?: string;  // 1/171 instances (1%)
  unique_vals?: string;  // 1/171 instances (1%)
  urls?: string;  // 1/171 instances (1%)
  users?: string;  // 1/171 instances (1%)
  vt_domain_result_table_html?: string;  // 1/171 instances (1%)
  vt_ip_result_table?: string;  // 1/171 instances (1%)
  vt_ip_result_table_html?: string;  // 1/171 instances (1%)
  vt_url_result_table_html?: string;  // 1/171 instances (1%)
  vulnerabilities?: string;  // 1/171 instances (1%)
}

/**
 * Connector
 * UUID     : 0bfed618-0316-11e7-93ae-92361f002671
 * Category : action
 * Instances: 177 step(s) across 49 playbook(s)
 */
export interface ConnectorArgs {
  agent: string;  // 177/177 instances (100%)
  config: string;  // 177/177 instances (100%)
  connector: string;  // 177/177 instances (100%)
  name: string;  // 177/177 instances (100%)
  operation: string;  // 177/177 instances (100%)
  params: ({
    note: string;
    stage: string;
    status: string;
    dueDate: string;
    summary: string;
    assignee: string;
    severity: string;
    incidentIds: string;
    organization: string;
    caseMgmtPolicy: string;
  } | {
    search_attr_name: string;
    search_attr_value: string;
  } | {
    search_object: string;
    search_attr_value: string;
  } | {
    group_dn: string;
    object_dn: string;
    object_class: string;
  } | {
    note: string;
    stage: string;
    caseId: string;
    status: string;
    dueDate: string;
    summary: string;
    assignee: string;
    severity: string;
    incidentIds: string;
    caseMgmtPolicy: string;
  } | {
    body: string;
    subject: string;
    iri_list: string;
    cc_recipients: string;
    to_recipients: string;
    bcc_recipients: string;
  } | {
    timeTo: string;
    perPage: number;
    timeFrom: string;
    incident_id: string;
  } | {
    comments: string;
    severity: string;
    incidentId: string;
    resolution: string;
    actionStatus: string;
    incidentStatus: string;
    externalTicketId: string;
    externalTicketType: string;
    externalTicketState: string;
    externalAssignedUser: string;
  } | {
    id: string;
    comment_text: string;
  } | {
    start: number;
    perPage: number;
    sql_query: string;
    query_type: string;
  } | {
    parent: string;
    priority: string;
    issue_type: string;
    project_key: string;
    other_fields: string;
    ticket_summary: string;
    ticket_description: string;
  } | Record<string, never> | {
    cc: string;
    to: string;
    bcc: string;
    from: string;
    type: string;
    content: string;
    subject: string;
    iri_list: string;
    body_type: string;
    file_name: string;
    file_path: string;
  } | {
    tag: string;
    iocs: string;
    page: string;
    size: number;
    source: string;
    keyword: string;
    end_date: string;
    report_id: string;
    industries: string;
    start_date: string;
    adversaries: string;
    geographies: string;
    motivations: string;
    report_type: string;
    source_category: string;
    insight_relevance: string;
    source_reliability: string;
    information_reliability: string;
    report_generator_source: string;
  } | {
    name: string;
    page: string;
    size: number;
    sort: string;
    type: string;
    keyword: string;
    last_seen: string;
    first_seen: string;
    report_ids: string;
    get_all_records: boolean;
  } | {
    group_name: string;
  } | {
    page: string;
    size: number;
  } | {
    id: string;
  } | {
    id: string;
    page: string;
    size: number;
    based_on: string;
  } | {
    new_password: string;
    search_attr_name: string;
    search_attr_value: string;
  } | {
    ip_address_list: string;
  } | {
    src: string;
    dest: string;
    direction: string;
    interface: string;
    access_list: string;
  } | {
    ip: string;
    vdom: string;
    is_new: boolean;
    method: string;
    ip_type: string;
    ngfw_mode: string;
    ip_group_name: string;
    ip_block_policy: string;
  } | {
    ip: string;
  } | {
    size: number;
    stat: number;
  } | {
    name: string;
    columnList: {
        key: boolean;
        name: string;
        type: string;
      }[];
    description: string;
    organizationName: string;
  } | {
    cmd: string;
    allowed_exit: string;
    is_super_user: boolean;
  } | {
    vdom: string;
    method: string;
    ip_addresses: string;
    time_to_live: string;
  } | {
    cookie: string;
    page_size: string;
    size_limit: string;
    search_object: string;
    search_attr_name: string;
    search_attr_value: string;
  } | {
    size: number;
    start: number;
    sortBy: string;
    searchText: string;
    lookupTableId: string;
  } | {
    ip: string;
    relationships: string;
  } | {
    domain: string;
    relationships: string;
  } | {
    url: string;
    relationships: string;
  } | {
    cond: string;
    start: number;
    value: number;
    groupby: string;
    orderby: string;
    perPage: number;
    AttrList: string;
    rel_time: string;
    query_type: string;
    time_selection: string;
  } | {
    fast: boolean;
    mobile: boolean;
    ip_address: string;
    strictness: number;
    user_agent: string;
    user_language: string;
    lighter_penalties: boolean;
    transaction_strictness: number;
    allow_public_access_points: boolean;
  } | {
    url: string;
    fast: boolean;
    strictness: number;
  });  // 177/177 instances (100%)
  pickFromTenant: boolean;  // 177/177 instances (100%)
  version: string;  // 177/177 instances (100%)
  ignore_errors?: boolean;  // 11/177 instances (6%)
  mock_result?: string;  // 6/177 instances (3%)
  apply_async?: boolean;  // 5/177 instances (3%)
  step_variables?: (Record<string, never> | {
    _evt_fulldetail: string;
  } | {
    jiraProjectID: string;
  });  // 4/177 instances (2%)
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
  };  // 1/1 instances (100%)
  type: string;  // 1/1 instances (100%)
}

/**
 * Reference Playbook
 * UUID     : 74932bdc-b8b6-4d24-88c4-1a4dfbc524f3
 * Category : action
 * Instances: 26 step(s) across 26 playbook(s)
 */
export interface ReferencePlaybookArgs {
  arguments: (Record<string, never> | {
    report_data: string;
  } | {
    htmlTable: string;
    markdownTable: string;
  } | {
    report_data: string;
    report_details: string;
  });  // 26/26 instances (100%)
  pass_input_record: boolean;  // 26/26 instances (100%)
  pass_parent_env: boolean;  // 26/26 instances (100%)
  workflowReference: string;  // 26/26 instances (100%)
  apply_async?: boolean;  // 1/26 instances (4%)
  for_each?: {
    item: string;
    condition: string;
  };  // 1/26 instances (4%)
  ignore_errors?: boolean;  // 1/26 instances (4%)
  message?: {
    tags: string[];
    content: string;
  };  // 1/26 instances (4%)
  mock_result?: string;  // 1/26 instances (4%)
  step_variables?: {
    test_var: string;
  };  // 1/26 instances (4%)
  when?: string;  // 1/26 instances (4%)
}

/**
 * Send Email (SMTP connector shortcut)
 * UUID     : 4c0019b2-055c-44d0-968c-678a0c2d762e
 * Category : action
 * Instances: 2 step(s) across 2 playbook(s)
 */
export interface SendEmailArgs {
  agent: string;  // 2/2 instances (100%)
  config: string;  // 2/2 instances (100%)
  connector: string;  // 2/2 instances (100%)
  from_str: string;  // 2/2 instances (100%)
  name: string;  // 2/2 instances (100%)
  operation: string;  // 2/2 instances (100%)
  params: ({
    cc: string;
    to: string;
    bcc: string;
    from: string;
    type: string;
    content: string;
    subject: string;
    iri_list: string;
    body_type: string;
    file_name: string;
    file_path: string;
  } | {
    body: string;
    subject: string;
    iri_list: string;
    cc_recipients: string;
    to_recipients: string;
    bcc_recipients: string;
  });  // 2/2 instances (100%)
  pickFromTenant: boolean;  // 2/2 instances (100%)
  version: string;  // 2/2 instances (100%)
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
  };  // 21/21 instances (100%)
  external_channel_list: unknown[];  // 21/21 instances (100%)
  inline_channel_list: unknown[];  // 21/21 instances (100%)
  input: ({
    schema: {
      title: string;
      description: string;
      inputVariables: Record<string, unknown>[];
    };
  } | {
    schema: {
      title: string;
      description: string;
      inputVariables: unknown[];
    };
  });  // 21/21 instances (100%)
  is_approval: boolean;  // 21/21 instances (100%)
  owner_detail: ({
    isAssigned: boolean;
    assignedToField: null;
    assignedToPerson: unknown[];
  } | {
    isAssigned: boolean;
    assignedToTeam: unknown[];
    assignedToField: null;
    emailRecipients: string;
    assignedToPerson: unknown[];
    assignedToRecord: boolean;
  });  // 21/21 instances (100%)
  response_mapping: ({
    options: {
        option: string;
        primary: boolean;
        step_iri: string;
        step_uuid: string;
      }[];
    connecteStepsLength: number;
    customSuccessMessage: string;
  } | {
    options: {
        option: string;
        primary: boolean;
        step_uuid: string;
      }[];
    connecteStepsLength: number;
    customSuccessMessage: string;
  });  // 21/21 instances (100%)
  type: string;  // 21/21 instances (100%)
  unauthenticated_input: boolean;  // 21/21 instances (100%)
  agent_id?: null;  // 1/21 instances (5%)
  custom_email_body_external?: null;  // 1/21 instances (5%)
  custom_email_body_internal?: null;  // 1/21 instances (5%)
  customEmailExternal?: boolean;  // 1/21 instances (5%)
  customEmailInternal?: boolean;  // 1/21 instances (5%)
  external_email_attachments?: null;  // 1/21 instances (5%)
  external_email_subject?: null;  // 1/21 instances (5%)
  inputExternalUser?: boolean;  // 1/21 instances (5%)
  inputInternalUsers?: null;  // 1/21 instances (5%)
  internal_email_attachments?: null;  // 1/21 instances (5%)
  internal_email_subject?: null;  // 1/21 instances (5%)
}

/**
 * Start/Trigger (FAS Referenced)
 * UUID     : b348f017-9a94-471f-87f8-ce88b6a7ad62
 * Category : trigger
 * Instances: 36 step(s) across 36 playbook(s)
 */
export interface FASTriggerArgs {
  __triggerLimit: boolean;  // 36/36 instances (100%)
  step_variables: {
    input: {
      params: unknown[];
    };
  };  // 36/36 instances (100%)
  triggerOnReplicate: boolean;  // 36/36 instances (100%)
  triggerOnSource: boolean;  // 36/36 instances (100%)
}

/**
 * Utility/No-Op
 * UUID     : 0109f35d-090b-4a2b-bd8a-94cbc3508562
 * Category : utility
 * Instances: 10 step(s) across 10 playbook(s)
 */
export interface UtilityNoOpArgs {
  agent: string;  // 10/10 instances (100%)
  config: string;  // 10/10 instances (100%)
  connector: string;  // 10/10 instances (100%)
  name: string;  // 10/10 instances (100%)
  operation: string;  // 10/10 instances (100%)
  params: ({
    data: string;
    file_name: string;
    save_to_file: boolean;
  } | {
    data: string;
    display: string;
    styling: boolean;
    template: string;
    row_fields: string;
    show_button: boolean;
  });  // 10/10 instances (100%)
  pickFromTenant: boolean;  // 10/10 instances (100%)
  version: string;  // 10/10 instances (100%)
  step_variables?: {
    markdownTable: string;
  };  // 9/10 instances (90%)
}

/**
 * Decision
 * UUID     : 12254cf5-5db7-4b1a-8cb1-3af081924b28
 * Category : control
 * Instances: 17 step(s) across 7 playbook(s)
 */
export interface DecisionArgs {
  conditions: (({
      option: string;
      step_iri: string;
      condition: string;
      step_name: string;
    } | {
      option: string;
      default: boolean;
      step_iri: string;
      step_name: string;
    })[] | {
      option: string;
      step_iri: string;
      condition: string;
      step_name: string;
    }[]);  // 17/17 instances (100%)
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

/** A single step as it appears inside a playbook. */
export interface PlaybookStep {
  uuid: string;
  name: string;
  /** Raw step-type UUID — look up in STEP_TYPE_CLASSIFICATIONS */
  stepTypeUuid: string;
  arguments: AnyStepArgs;
  top?: string;
  left?: string;
}
