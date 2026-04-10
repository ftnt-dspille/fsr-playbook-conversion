#!/usr/bin/env node
'use strict';

/**
 * generate-schema.js
 *
 * Reads an exported playbook/workflow collections JSON file and produces:
 *   1. step-schema.ts  — TypeScript interfaces for every observed step argument
 *                        shape, plus a classification registry.
 *   2. Console summary — top playbooks by step count and by unique step types.
 *
 * Usage:
 *   node scripts/generate-schema.js <input.json> [output-dir]
 *
 * output-dir defaults to the current working directory.
 */

const fs   = require('fs');
const path = require('path');

// ─── System-defined argument keys ─────────────────────────────────────────────
// These keys carry platform/engine meaning and must always be shown explicitly
// in generated interfaces, even when the dynamic-key heuristic would otherwise
// collapse them into [key: string]: unknown.

const SYSTEM_ARGUMENT_KEYS = new Set([
  'items',
  'result',
  'input',
  'request',
  'values',
  'keys',
  'files',
  'env',
  'message',
  'resources',
  'step_variables',
  'do_until',
  'ignore_errors',
  'when',
  'for_each',
  'cyops_playbook_iri',
  'cyops_playbook_name',
  'collaborationNote',
  'inputVariables',
  'displayConditions',
  'task_id',
  'wf_id',
]);

// ─── Built-in step-type classifications ───────────────────────────────────────
// Sourced from converter/constants.js. Extend this object to classify new UUIDs
// without modifying the generated output file.

const BUILT_IN_CLASSIFICATIONS = {
  // FSR trigger / start steps
  'f414d039-bb0d-4e59-9c39-a8f1e880b18a': { name: 'ManualStart',       label: 'Manual Start',                  category: 'trigger'  },
  'ea155646-3821-4542-9702-b246da430a8d': { name: 'OnCreate',          label: 'On Create',                     category: 'trigger'  },
  '9300bf69-5063-486d-b3a6-47eb9da24872': { name: 'OnUpdate',          label: 'On Update',                     category: 'trigger'  },
  'df26c7a2-4166-4ca5-91e5-548e24c01b5f': { name: 'APIEndpoint',       label: 'API Endpoint',                  category: 'trigger'  },
  // FAS start steps
  'b348f017-9a94-471f-87f8-ce88b6a7ad62': { name: 'FASTrigger',        label: 'Start/Trigger (FAS Referenced)', category: 'trigger'  },
  '202ecbe9-e4b9-4f71-9fd9-66a054b5443f': { name: 'ApplicationEvent',  label: 'Application Event (FAS only — no FSR equivalent)', category: 'trigger'  },
  // Control flow
  '12254cf5-5db7-4b1a-8cb1-3af081924b28': { name: 'Decision',          label: 'Decision',                      category: 'control'  },
  '6832e556-b9c7-497a-babe-feda3bd27dbf': { name: 'Wait',              label: 'Wait',                          category: 'control'  },
  // Actions
  '04d0cf46-b6a8-42c4-8683-60a7eaa69e8f': { name: 'SetVariables',      label: 'Set Variables',                 category: 'action'   },
  '74932bdc-b8b6-4d24-88c4-1a4dfbc524f3': { name: 'ReferencePlaybook', label: 'Reference Playbook',            category: 'action'   },
  'fc04082a-d7dc-4299-96fb-6837b1baa0fe': { name: 'ManualInput',       label: 'Manual Input',                  category: 'action'   },
  '0bfed618-0316-11e7-93ae-92361f002671': { name: 'Connector',         label: 'Connector',                     category: 'action'   },
  '4c0019b2-055c-44d0-968c-678a0c2d762e': { name: 'SendEmail',         label: 'Send Email (SMTP connector shortcut)', category: 'action'   },
  '0bfed618-0316-11e7-93ae-92361f002675': { name: 'Email',             label: 'Email',                         category: 'action'   },
  '0bfed618-0316-11e7-93ae-92361f002674': { name: 'Attachment',        label: 'Attachment',                    category: 'action'   },
  // Utility
  '0109f35d-090b-4a2b-bd8a-94cbc3508562': { name: 'UtilityNoOp',       label: 'Utility/No-Op',                 category: 'utility'  },
  // FSR-only (unsupported in FAS)
  '2597053c-e718-44b4-8394-4d40fe26d357': { name: 'CreateRecord',      label: 'Create Record',                 category: 'action'   },
  'b593663d-7d13-40ce-a3a3-96dece928722': { name: 'UpdateRecord',      label: 'Update Record',                 category: 'action'   },
  'b593663d-7d13-40ce-a3a3-96dece928770': { name: 'FindRecord',        label: 'Find Record',                   category: 'action'   },
  '1fdd14cc-d6b4-4335-a3af-ab49c8ed2fd8': { name: 'CodeSnippet',       label: 'Code Snippet',                  category: 'action'   },
  '7b221880-716b-4726-a2ca-5e568d330b3e': { name: 'IngestBulkFeed',    label: 'Ingest Bulk Feed',              category: 'action'   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractUUID(ref) {
  if (!ref) return null;
  if (typeof ref === 'string' && ref.includes('/')) {
    const parts = ref.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }
  return ref;
}

/** Infer a TypeScript type string for a single observed value. */
function inferTsType(value, depth = 0) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number')  return 'number';
  if (typeof value === 'string')  return 'string';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]';
    const inner = [...new Set(value.map(v => inferTsType(v, depth + 1)))];
    const joined = inner.join(' | ');
    return inner.length > 1 ? `(${joined})[]` : `${joined}[]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return 'Record<string, never>';
    if (depth >= 3) return 'Record<string, unknown>';
    const pad = '  '.repeat(depth + 2);
    const closePad = '  '.repeat(depth + 1);
    const props = entries.map(([k, v]) => {
      const safe = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
      return `${pad}${safe}: ${inferTsType(v, depth + 1)}`;
    });
    return `{\n${props.join(';\n')};\n${closePad}}`;
  }

  return 'unknown';
}

/**
 * Merge all observed argument objects for one step type into a field summary.
 * Returns an array of { key, optional, tsType, count, total } sorted by
 * required-first then alphabetical.
 */
function mergeArgumentSchemas(instances) {
  const keyMeta = new Map(); // key -> { count: number, types: Set<string> }
  const total = instances.length;

  for (const args of instances) {
    if (!args || typeof args !== 'object' || Array.isArray(args)) continue;
    for (const [k, v] of Object.entries(args)) {
      if (!keyMeta.has(k)) keyMeta.set(k, { count: 0, types: new Set() });
      const m = keyMeta.get(k);
      m.count++;
      m.types.add(inferTsType(v));
    }
  }

  const fields = [];
  for (const [key, meta] of keyMeta.entries()) {
    const types = [...meta.types];
    const tsType = types.length === 1 ? types[0] : `(${types.join(' | ')})`;
    fields.push({ key, optional: meta.count < total, tsType, count: meta.count, total });
  }

  fields.sort((a, b) => {
    if (a.optional !== b.optional) return a.optional ? 1 : -1;
    return a.key.localeCompare(b.key);
  });

  return fields;
}

/**
 * Decide whether an argument shape contains dynamic (user-defined) keys.
 * Heuristic: if more than 3 keys appear in fewer than 30% of instances
 * AND the total unique keys exceeds 2× the average keys-per-instance,
 * we assume user-defined variable names are mixed in.
 */
function detectDynamicKeys(fields, instances) {
  if (instances.length < 2) return false;

  const rareCount = fields.filter(f => f.count / f.total < 0.3).length;
  if (rareCount <= 3) return false;

  const totalKeySlots = instances.reduce((sum, a) => {
    return sum + (a && typeof a === 'object' && !Array.isArray(a) ? Object.keys(a).length : 0);
  }, 0);
  const avgKeysPerInstance = totalKeySlots / instances.length;

  return fields.length > 2 * avgKeysPerInstance;
}

/** Safe TypeScript identifier for an interface name. */
function toInterfaceName(uuid, cls) {
  if (cls?.name) return `${cls.name}Args`;
  // Sanitise UUID into a valid identifier
  return `StepArgs_${uuid.replace(/-/g, '_')}`;
}

/**
 * Generate the body lines of a TypeScript interface.
 *
 * showAllKeys=false (default): keys appearing in <30% of instances are collapsed
 *   into [key: string]: unknown — good for a clean, usable schema.
 *
 * showAllKeys=true (--show-all-keys flag): every observed key is listed with its
 *   frequency annotation so you can judge which are system fields vs user-defined
 *   variable/output names.
 */
function buildInterfaceBody(fields, isDynamic, showAllKeys = false) {
  if (fields.length === 0) {
    return ['  // No arguments observed in this collection'];
  }

  const lines = [];

  if (showAllKeys) {
    // Sort by frequency desc so consistent (likely system) keys float to the top
    const sorted = [...fields].sort((a, b) => {
      const diff = (b.count / b.total) - (a.count / a.total);
      return diff !== 0 ? diff : a.key.localeCompare(b.key);
    });

    for (const field of sorted) {
      const safe      = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field.key)
        ? field.key
        : `"${field.key}"`;
      const opt       = field.optional ? '?' : '';
      const pct       = Math.round((field.count / field.total) * 100);
      const isSystem  = SYSTEM_ARGUMENT_KEYS.has(field.key);
      const tag       = isSystem ? ' [system key]' : '';
      const note      = `  // ${field.count}/${field.total} instances (${pct}%)${tag}`;
      lines.push(`  ${safe}${opt}: ${field.tsType};${note}`);
    }
  } else {
    const dynamicThreshold = 0.3;
    // A field is kept explicit if:
    //   • it's a known system key (always pinned), OR
    //   • it appears frequently enough to be structural (>= threshold), OR
    //   • we're not in dynamic-collapse mode at all
    const structural = isDynamic
      ? fields.filter(f => SYSTEM_ARGUMENT_KEYS.has(f.key) || f.count / f.total >= dynamicThreshold)
      : fields;
    const skippedCount = fields.length - structural.length;

    for (const field of structural) {
      const safe      = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field.key)
        ? field.key
        : `"${field.key}"`;
      const opt       = field.optional ? '?' : '';
      const isSystem  = SYSTEM_ARGUMENT_KEYS.has(field.key);
      const note      = field.optional
        ? `  // present in ${field.count}/${field.total} instances${isSystem ? ' [system key]' : ''}`
        : isSystem ? '  // [system key]' : '';
      lines.push(`  ${safe}${opt}: ${field.tsType};${note}`);
    }

    if (isDynamic && skippedCount > 0) {
      lines.push(`  /** ~${skippedCount} additional dynamic keys (user-defined variable / output names) */`);
      lines.push('  [key: string]: unknown;');
    }
  }

  return lines;
}

// ─── Collection traversal ─────────────────────────────────────────────────────

/**
 * Walk both FSR (workflow_collections / workflows / steps) and
 * FAS (playbook_collections / playbooks / steps) export shapes.
 * Returns flat array of { collectionName, collectionUUID, playbookName, playbookUUID, step }.
 */
function collectAllSteps(exportData) {
  const collections = exportData.data ?? [];
  const result = [];

  for (const col of collections) {
    const colName = col.name ?? 'Unknown Collection';
    const colUUID = col.uuid ?? '';

    // FSR uses 'workflows', FAS uses 'playbooks'
    const playbooks = col.workflows ?? col.playbooks ?? [];

    for (const pb of playbooks) {
      const pbName = pb.name ?? 'Unknown Playbook';
      const pbUUID = pb.uuid ?? '';

      for (const step of (pb.steps ?? [])) {
        result.push({ collectionName: colName, collectionUUID: colUUID,
                      playbookName: pbName, playbookUUID: pbUUID, step });
      }
    }
  }

  return result;
}

// ─── TypeScript file generation ───────────────────────────────────────────────

function generateTypeScriptFile(exportData, stepTypeMap, playbookStats, inputFile, showAllKeys = false) {
  const now   = new Date().toISOString();
  const base  = path.basename(inputFile);
  const kind  = exportData.type ?? 'unknown';
  const colCount = (exportData.data ?? []).length;
  const totalSteps = [...stepTypeMap.values()].reduce((s, v) => s + v.instances.length, 0);

  const out = [];

  // ── File header ────────────────────────────────────────────────────────────
  out.push('/**');
  out.push(` * Auto-generated step-type schema`);
  out.push(` * Source    : ${base}`);
  out.push(` * Type      : ${kind}`);
  out.push(` * Generated : ${now}`);
  out.push(` * Collections: ${colCount}  |  Total steps: ${totalSteps}  |  Step types: ${stepTypeMap.size}`);
  out.push(` * Mode      : ${showAllKeys ? '--show-all-keys (all keys listed with frequency for system vs user-defined analysis)' : 'default (low-frequency keys collapsed into [key: string]: unknown)'}`);
  out.push(' *');
  out.push(' * To classify an unknown step type:');
  out.push(' *   1. Search for "TODO: classify"');
  out.push(' *   2. Fill in the name / label / category fields in STEP_TYPE_CLASSIFICATIONS');
  out.push(' *   3. Optionally add the UUID to BUILT_IN_CLASSIFICATIONS in generate-schema.js');
  out.push(' *      so it is auto-classified on future runs.');
  out.push(' */');
  out.push('');

  // ── StepCategory type ──────────────────────────────────────────────────────
  out.push("// ============================================================");
  out.push("// 1. Classification Registry");
  out.push("// ============================================================");
  out.push('');
  out.push("export type StepCategory = 'trigger' | 'action' | 'control' | 'utility' | 'unknown';");
  out.push('');
  out.push('export interface StepTypeClassification {');
  out.push('  uuid: string;');
  out.push('  /** TypeScript interface name prefix — edit to rename the generated interface */');
  out.push('  name: string;');
  out.push('  /** Human-readable label for reports and documentation */');
  out.push('  label: string;');
  out.push('  category: StepCategory;');
  out.push('  /** Total step instances found in this export */');
  out.push('  occurrences: number;');
  out.push('  /** Number of distinct playbooks containing this step type */');
  out.push('  playbookCount: number;');
  out.push('}');
  out.push('');
  out.push('export const STEP_TYPE_CLASSIFICATIONS: Record<string, StepTypeClassification> = {');

  for (const [uuid, typeData] of stepTypeMap.entries()) {
    const cls     = BUILT_IN_CLASSIFICATIONS[uuid];
    const name    = cls?.name     ?? 'Unknown';
    const label   = cls?.label    ?? uuid;
    const category= cls?.category ?? 'unknown';
    const isKnown = !!cls;

    out.push(`  // ${isKnown ? label : '⚠ UNCLASSIFIED — fill in below'}`);
    out.push(`  '${uuid}': {`);
    if (!isKnown) out.push(`    // TODO: classify — set name, label, and category`);
    out.push(`    uuid: '${uuid}',`);
    out.push(`    name: '${name}',`);
    out.push(`    label: '${label}',`);
    out.push(`    category: '${category}',`);
    out.push(`    occurrences: ${typeData.instances.length},`);
    out.push(`    playbookCount: ${typeData.playbooks.size},`);
    out.push(`  },`);
  }

  out.push('};');
  out.push('');

  // ── Argument interfaces ────────────────────────────────────────────────────
  out.push("// ============================================================");
  out.push("// 2. Step Argument Interfaces");
  out.push("//");
  out.push("//  • Required fields appear in every observed instance.");
  out.push("//  • Optional fields (?) were absent in some instances.");
  out.push("//  • [key: string]: unknown  signals dynamic/user-defined keys.");
  out.push("// ============================================================");
  out.push('');

  const interfaceNames = [];

  for (const [uuid, typeData] of stepTypeMap.entries()) {
    const cls           = BUILT_IN_CLASSIFICATIONS[uuid];
    const interfaceName = toInterfaceName(uuid, cls);
    const label         = cls?.label    ?? uuid;
    const category      = cls?.category ?? 'unknown';
    const isKnown       = !!cls;

    interfaceNames.push({ interfaceName, uuid });

    const fields    = mergeArgumentSchemas(typeData.instances);
    const isDynamic = detectDynamicKeys(fields, typeData.instances);
    const bodyLines = buildInterfaceBody(fields, isDynamic, showAllKeys);

    out.push('/**');
    out.push(` * ${label}`);
    out.push(` * UUID     : ${uuid}`);
    out.push(` * Category : ${category}`);
    out.push(` * Instances: ${typeData.instances.length} step(s) across ${typeData.playbooks.size} playbook(s)`);
    if (!isKnown) out.push(` * TODO: classify this step type`);
    out.push(' */');
    out.push(`export interface ${interfaceName} {`);
    for (const line of bodyLines) out.push(line);
    out.push('}');
    out.push('');
  }

  // ── Union type ─────────────────────────────────────────────────────────────
  out.push("// ============================================================");
  out.push("// 3. Union & Utility Types");
  out.push("// ============================================================");
  out.push('');

  if (interfaceNames.length > 0) {
    out.push('export type AnyStepArgs =');
    interfaceNames.forEach(({ interfaceName }, i) => {
      const trail = i < interfaceNames.length - 1 ? '' : ';';
      out.push(`  | ${interfaceName}${trail}`);
    });
  } else {
    out.push('export type AnyStepArgs = Record<string, unknown>;');
  }

  out.push('');
  out.push('/** A single step as it appears inside a playbook. */');
  out.push('export interface PlaybookStep {');
  out.push('  uuid: string;');
  out.push('  name: string;');
  out.push('  /** Raw step-type UUID — look up in STEP_TYPE_CLASSIFICATIONS */');
  out.push('  stepTypeUuid: string;');
  out.push('  arguments: AnyStepArgs;');
  out.push('  top?: string;');
  out.push('  left?: string;');
  out.push('}');
  out.push('');

  return out.join('\n');
}

// ─── Summary report ───────────────────────────────────────────────────────────

function buildSummaryReport(exportData, stepTypeMap, playbookStats, inputFile) {
  const lines = [];
  const sep   = '='.repeat(64);
  const dash  = '-'.repeat(64);
  const kind  = exportData.type ?? 'unknown';
  const colCount = (exportData.data ?? []).length;
  const totalSteps = [...stepTypeMap.values()].reduce((s, v) => s + v.instances.length, 0);

  lines.push(sep);
  lines.push('PLAYBOOK COLLECTION SCHEMA REPORT');
  lines.push(sep);
  lines.push(`Source      : ${path.basename(inputFile)}`);
  lines.push(`Export type : ${kind}`);
  lines.push(`Collections : ${colCount}`);
  lines.push(`Playbooks   : ${playbookStats.size}`);
  lines.push(`Total steps : ${totalSteps}`);
  lines.push(`Step types  : ${stepTypeMap.size} unique`);
  lines.push('');

  // ── Top by step count ──────────────────────────────────────────────────────
  const bySteps = [...playbookStats.values()]
    .sort((a, b) => b.stepCount - a.stepCount)
    .slice(0, 15);

  lines.push(dash);
  lines.push('TOP PLAYBOOKS BY STEP COUNT');
  lines.push(dash);
  lines.push('  Steps  Unique Types  Playbook Name (Collection)');
  for (const pb of bySteps) {
    const steps  = String(pb.stepCount).padStart(5);
    const types  = String(pb.stepTypeSet.size).padStart(12);
    lines.push(`  ${steps}  ${types}  ${pb.name} (${pb.collectionName})`);
  }
  lines.push('');

  // ── Top by unique step types ───────────────────────────────────────────────
  const byTypes = [...playbookStats.values()]
    .sort((a, b) => b.stepTypeSet.size - a.stepTypeSet.size)
    .slice(0, 15);

  lines.push(dash);
  lines.push('TOP PLAYBOOKS BY UNIQUE STEP TYPES');
  lines.push(dash);
  lines.push('  Types    Steps  Playbook Name (Collection)');
  for (const pb of byTypes) {
    const types = String(pb.stepTypeSet.size).padStart(5);
    const steps = String(pb.stepCount).padStart(7);
    lines.push(`  ${types}  ${steps}  ${pb.name} (${pb.collectionName})`);
  }
  lines.push('');

  // ── Step type breakdown ────────────────────────────────────────────────────
  lines.push(dash);
  lines.push('ALL STEP TYPES (sorted by occurrences desc)');
  lines.push(dash);
  lines.push('  Count  Playbooks  UUID                                  Label');

  const sortedTypes = [...stepTypeMap.entries()]
    .sort((a, b) => b[1].instances.length - a[1].instances.length);

  for (const [uuid, typeData] of sortedTypes) {
    const cls    = BUILT_IN_CLASSIFICATIONS[uuid];
    const label  = cls ? cls.label : '⚠ UNCLASSIFIED';
    const count  = String(typeData.instances.length).padStart(5);
    const pbCount= String(typeData.playbooks.size).padStart(9);
    lines.push(`  ${count}  ${pbCount}  ${uuid}  ${label}`);
  }
  lines.push('');

  // ── Unclassified UUIDs ─────────────────────────────────────────────────────
  const unknowns = [...stepTypeMap.entries()].filter(([uuid]) => !BUILT_IN_CLASSIFICATIONS[uuid]);
  if (unknowns.length > 0) {
    lines.push(dash);
    lines.push(`UNCLASSIFIED STEP TYPES (${unknowns.length}) — add to BUILT_IN_CLASSIFICATIONS`);
    lines.push(dash);
    for (const [uuid, typeData] of unknowns) {
      lines.push(`  ${uuid}  (${typeData.instances.length} instances, ${typeData.playbooks.size} playbooks)`);
      // Show a sample of step names to help the user identify the type
      const sample = typeData.stepNames.slice(0, 3);
      for (const s of sample) lines.push(`    sample: "${s}"`);
    }
    lines.push('');
  }

  lines.push(sep);

  return lines.join('\n');
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function main() {
  const argv = process.argv.slice(2);

  const showAllKeys = argv.includes('--show-all-keys');
  const positional  = argv.filter(a => !a.startsWith('--'));

  if (positional.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    console.log('Usage: node scripts/generate-schema.js <input.json> [output-dir] [--show-all-keys]');
    console.log('');
    console.log('  <input.json>      Exported playbook/workflow collections JSON file');
    console.log('  [output-dir]      Directory for generated files (default: current dir)');
    console.log('  --show-all-keys   List every observed argument key with its frequency');
    console.log('                    (X/Y instances, %) so you can identify which keys are');
    console.log('                    system-defined vs user-defined variable/output names.');
    console.log('                    Without this flag, low-frequency keys are collapsed into');
    console.log('                    [key: string]: unknown.');
    console.log('');
    console.log('Outputs:');
    console.log('  step-schema.ts    TypeScript interfaces and step-type registry');
    console.log('  schema-report.txt Human-readable summary report');
    process.exit(0);
  }

  const inputFile = positional[0];
  const outputDir = positional[1] ?? '.';

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: file not found: ${inputFile}`);
    process.exit(1);
  }

  // ── Parse input ──────────────────────────────────────────────────────────
  let exportData;
  try {
    exportData = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  } catch (e) {
    console.error(`Error: invalid JSON — ${e.message}`);
    process.exit(1);
  }

  if (!exportData.data || !Array.isArray(exportData.data)) {
    console.error('Error: expected top-level "data" array in JSON file.');
    process.exit(1);
  }

  // ── Collect all steps ────────────────────────────────────────────────────
  const allEntries = collectAllSteps(exportData);

  // ── Build per-step-type and per-playbook indexes ──────────────────────────
  // stepTypeMap: uuid -> { instances: args[], playbooks: Set<uuid>, stepNames: string[] }
  const stepTypeMap  = new Map();
  // playbookStats: uuid -> { name, collectionName, stepCount, stepTypeSet }
  const playbookStats = new Map();

  for (const { collectionName, playbookName, playbookUUID, step } of allEntries) {
    const stepTypeUUID = extractUUID(step.stepType);
    if (!stepTypeUUID) continue;

    // Step-type index
    if (!stepTypeMap.has(stepTypeUUID)) {
      stepTypeMap.set(stepTypeUUID, { instances: [], playbooks: new Set(), stepNames: [] });
    }
    const td = stepTypeMap.get(stepTypeUUID);
    td.instances.push(step.arguments ?? {});
    td.playbooks.add(playbookUUID);
    td.stepNames.push(`${step.name ?? 'unnamed'} (in "${playbookName}" / collection: "${collectionName}")`);

    // Playbook index
    if (!playbookStats.has(playbookUUID)) {
      playbookStats.set(playbookUUID, {
        name: playbookName,
        collectionName,
        stepCount: 0,
        stepTypeSet: new Set(),
      });
    }
    const pb = playbookStats.get(playbookUUID);
    pb.stepCount++;
    pb.stepTypeSet.add(stepTypeUUID);
  }

  // ── Generate outputs ─────────────────────────────────────────────────────
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tsContent     = generateTypeScriptFile(exportData, stepTypeMap, playbookStats, inputFile, showAllKeys);
  const reportContent = buildSummaryReport(exportData, stepTypeMap, playbookStats, inputFile);

  const tsOut     = path.join(outputDir, 'step-schema.ts');
  const reportOut = path.join(outputDir, 'schema-report.txt');

  fs.writeFileSync(tsOut,     tsContent,     'utf8');
  fs.writeFileSync(reportOut, reportContent, 'utf8');

  console.log(reportContent);
  console.log(`Schema written to : ${tsOut}`);
  console.log(`Report written to : ${reportOut}`);
}

main();
