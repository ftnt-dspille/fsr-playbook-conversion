#!/usr/bin/env node
'use strict';

/**
 * generate-schema.js
 *
 * Reads one or more exported playbook/workflow collections JSON files and produces:
 *   1. step-schema.ts      — TypeScript interfaces for every observed step argument
 *                            shape, plus a classification registry.
 *   2. schema-report.txt   — Top playbooks by step count / unique step types, full
 *                            step-type breakdown, unclassified UUIDs with samples.
 *   3. comparison-report.txt (when FAS + FSR files are both provided) — step types
 *                            unique to each format, argument shape diffs for shared
 *                            types, potential conversion gaps.
 *   4. outlier-report.txt  (--outliers) — per step type, playbooks whose argument
 *                            sets deviate from the modal pattern.
 *   5. converter-gaps.txt  (--check-converter) — cross-reference schema UUIDs and
 *                            system argument keys against fas-to-fsr.js / fsr-to-fas.js.
 *
 * Usage:
 *   node scripts/generate-schema.js <input.json> [input2.json ...] [options]
 *   node scripts/generate-schema.js <input.json> [output-dir]          (legacy single-file)
 *
 * Options:
 *   --output-dir <dir>   Directory for generated files (default: .)
 *   --show-all-keys      List every observed argument key with frequency annotation
 *   --outliers           Generate outlier-report.txt
 *   --check-converter    Generate converter-gaps.txt (looks for converter/ next to scripts/)
 *   --help, -h           Show this help
 */

const fs = require('fs');
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
    // Connector step keys
    'connector',
    'operation',
    'config',
    'version',
    'params',
    'name',
    'from_str',
    // Decision step keys
    'conditions',
    'condition',
    // Manual input keys
    'response_mapping',
    'title',
    'description',
    // Start/trigger keys
    '__triggerLimit',
    'triggerOnSource',
    'triggerOnReplicate',
    'resource',
    'route',
    'fieldbasedtrigger',
    '_originalStartStep',
    '_tmp',
]);

// ─── Built-in step-type classifications ───────────────────────────────────────
// Sourced from converter/constants.js. Extend this object to classify new UUIDs
// without modifying the generated output file.

const BUILT_IN_CLASSIFICATIONS = {
    // FSR trigger / start steps
    'f414d039-bb0d-4e59-9c39-a8f1e880b18a': {name: 'ManualStart', label: 'Manual Start', category: 'trigger'},
    'ea155646-3821-4542-9702-b246da430a8d': {name: 'OnCreate', label: 'On Create', category: 'trigger'},
    '9300bf69-5063-486d-b3a6-47eb9da24872': {name: 'OnUpdate', label: 'On Update', category: 'trigger'},
    'df26c7a2-4166-4ca5-91e5-548e24c01b5f': {name: 'APIEndpoint', label: 'API Endpoint', category: 'trigger'},
    // FAS start steps
    'b348f017-9a94-471f-87f8-ce88b6a7ad62': {
        name: 'FASTrigger',
        label: 'Start/Trigger (FAS Referenced)',
        category: 'trigger'
    },
    '202ecbe9-e4b9-4f71-9fd9-66a054b5443f': {
        name: 'ApplicationEvent',
        label: 'Application Event (FAS only — no FSR equivalent)',
        category: 'trigger'
    },
    // Control flow
    '12254cf5-5db7-4b1a-8cb1-3af081924b28': {name: 'Decision', label: 'Decision', category: 'control'},
    '6832e556-b9c7-497a-babe-feda3bd27dbf': {name: 'Wait', label: 'Wait', category: 'control'},
    // Actions
    '04d0cf46-b6a8-42c4-8683-60a7eaa69e8f': {name: 'SetVariables', label: 'Set Variables', category: 'action'},
    '74932bdc-b8b6-4d24-88c4-1a4dfbc524f3': {
        name: 'ReferencePlaybook',
        label: 'Reference Playbook',
        category: 'action'
    },
    'fc04082a-d7dc-4299-96fb-6837b1baa0fe': {name: 'ManualInput', label: 'Manual Input', category: 'action'},
    'a19333c2-c822-11ed-afa1-0242ac120002': {name: 'Approval', label: 'Approval', category: 'action'},
    '0bfed618-0316-11e7-93ae-92361f002671': {name: 'Connector', label: 'Connector', category: 'action'},
    '4c0019b2-055c-44d0-968c-678a0c2d762e': {
        name: 'SendEmail',
        label: 'Send Email (SMTP connector shortcut)',
        category: 'action'
    },
    'dc6ac63d-c5a5-472f-9eb4-6b18473a98b8': {name: 'Create Task', label: 'Create Task', category: 'action'},
    '0bfed618-0316-11e7-93ae-92361f002675': {name: 'Email', label: 'Email', category: 'action'},
    '0bfed618-0316-11e7-93ae-92361f002674': {name: 'Attachment', label: 'Attachment', category: 'action'},
    // Utility
    '0109f35d-090b-4a2b-bd8a-94cbc3508562': {name: 'UtilityNoOp', label: 'Utility/No-Op', category: 'utility'},
    'b104e839-fc31-48b3-8c50-7e9433f33d79': {name: 'Set API Keys', label: 'Set API Keys', category: 'utility'},
    // FSR-only (unsupported in FAS)
    '2597053c-e718-44b4-8394-4d40fe26d357': {name: 'CreateRecord', label: 'Create Record', category: 'action'},
    'b593663d-7d13-40ce-a3a3-96dece928722': {name: 'UpdateRecord', label: 'Update Record', category: 'action'},
    'b593663d-7d13-40ce-a3a3-96dece928770': {name: 'FindRecord', label: 'Find Record', category: 'action'},
    '1fdd14cc-d6b4-4335-a3af-ab49c8ed2fd8': {name: 'CodeSnippet', label: 'Code Snippet', category: 'action'},
    '7b221880-716b-4726-a2ca-5e568d330b3e': {name: 'IngestBulkFeed', label: 'Ingest Bulk Feed', category: 'action'},
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
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';

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

/** Maximum union arms before collapsing to unknown */
const MAX_UNION_ARMS = 8;
/** Maximum distinct keys in a merged object before collapsing to Record<string, unknown> */
const MAX_OBJECT_KEYS = 40;

/**
 * FSR trigger step types that have no FAS equivalent and therefore cannot be
 * converted. We still generate an interface for them, but we limit nesting depth
 * so the output stays readable without wasting space on deep argument schemas.
 */
const SHALLOW_SCHEMA_TYPES = new Set([
    'ea155646-3821-4542-9702-b246da430a8d', // OnCreate  — FSR only
    '9300bf69-5063-486d-b3a6-47eb9da24872', // OnUpdate  — FSR only
    'df26c7a2-4166-4ca5-91e5-548e24c01b5f', // APIEndpoint — FSR only
]);

/**
 * Merge an array of plain objects into a single TypeScript object-type string.
 * Fields present in all objects are required; others are optional.
 * Collapses to Record<string, unknown> when the shape is too wide and dynamic.
 */
function mergeObjectShapes(objects, depth = 0) {
    if (depth >= 3) return 'Record<string, unknown>';

    const valid = objects.filter(o => o && typeof o === 'object' && !Array.isArray(o));
    if (valid.length === 0) return 'Record<string, never>';

    const keyMeta = new Map(); // key -> { count, values[] }
    const total = valid.length;

    for (const obj of valid) {
        for (const [k, v] of Object.entries(obj)) {
            if (!keyMeta.has(k)) keyMeta.set(k, {count: 0, values: []});
            keyMeta.get(k).count++;
            keyMeta.get(k).values.push(v);
        }
    }

    if (keyMeta.size === 0) return 'Record<string, never>';

    // If too many distinct keys and most are rare, treat as truly dynamic
    if (keyMeta.size > MAX_OBJECT_KEYS) {
        const rareCount = [...keyMeta.values()].filter(m => m.count / total < 0.2).length;
        const totalKeySlots = valid.reduce((s, o) => s + Object.keys(o).length, 0);
        const avgKeys = totalKeySlots / valid.length;
        if (rareCount > MAX_OBJECT_KEYS / 2 && keyMeta.size > 2 * avgKeys) {
            return 'Record<string, unknown>';
        }
    }

    // Match inferTsType's indentation convention: content at depth+2, closing at depth+1
    const pad = '  '.repeat(depth + 2);
    const closePad = '  '.repeat(depth + 1);
    const lines = [];

    const sorted = [...keyMeta.entries()].sort(([ak, am], [bk, bm]) => {
        const aReq = am.count === total;
        const bReq = bm.count === total;
        if (aReq !== bReq) return aReq ? -1 : 1;
        return ak.localeCompare(bk);
    });

    for (const [k, meta] of sorted) {
        const safe = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
        const opt = meta.count < total ? '?' : '';
        const type = mergeRawValues(meta.values, depth + 1);
        lines.push(`${pad}${safe}${opt}: ${type}`);
    }

    return `{\n${lines.join(';\n')};\n${closePad}}`;
}

/**
 * Merge all observed raw values for one field into a single TypeScript type string.
 *
 * Key differences from the old approach (which unioned inferTsType strings):
 *   • Array fields: pools all elements across all instances → single `ElementType[]`
 *     instead of `TypeA[] | TypeB[] | TypeC[]`
 *   • Object fields: merges shapes with optional fields → compact single interface
 *     instead of a large inline union
 *   • Mixed/primitive: regular union, capped at MAX_UNION_ARMS
 */
function mergeRawValues(values, depth = 0) {
    if (!values || values.length === 0) return 'unknown';

    const nonNull = values.filter(v => v != null);
    const hasNull = nonNull.length < values.length;

    if (nonNull.length === 0) return hasNull ? 'null' : 'unknown';

    const allArrays = nonNull.every(v => Array.isArray(v));
    const allObjects = nonNull.every(v => typeof v === 'object' && !Array.isArray(v));
    const allPrimitives = nonNull.every(v => typeof v !== 'object');

    let baseType;

    if (allArrays) {
        const allElements = nonNull.flatMap(a => a);
        if (allElements.length === 0) {
            baseType = 'unknown[]';
        } else {
            const elemType = mergeRawValues(allElements, depth + 1);
            const needsParens = elemType.includes('{') || elemType.includes(' | ');
            baseType = needsParens ? `(${elemType})[]` : `${elemType}[]`;
        }
    } else if (allObjects && depth < 3) {
        baseType = mergeObjectShapes(nonNull, depth);
    } else if (allPrimitives) {
        const types = [...new Set(nonNull.map(v => inferTsType(v)))];
        baseType = types.length === 1 ? types[0] : `(${types.join(' | ')})`;
    } else {
        // Mixed types — fall back to union with cap
        const types = [...new Set(nonNull.map(v => inferTsType(v, depth)))];
        baseType = types.length > MAX_UNION_ARMS ? 'unknown' :
            types.length === 1 ? types[0] : `(${types.join(' | ')})`;
    }

    return hasNull ? `(${baseType} | null)` : baseType;
}

/**
 * Merge all observed argument objects for one step type into a field summary.
 * Returns an array of { key, optional, tsType, count, total } sorted by
 * required-first then alphabetical.
 */
/**
 * Minimal type inference for non-convertible step types.
 * Primitives and simple arrays of primitives are typed exactly;
 * all objects, mixed, and nested arrays collapse to `unknown` / `unknown[]`.
 * This keeps interfaces for FSR-only triggers readable without deep schemas.
 */
function shallowFieldType(values) {
    const nonNull = values.filter(v => v != null);
    const hasNull = nonNull.length < values.length;
    if (nonNull.length === 0) return hasNull ? 'null' : 'unknown';

    const allPrimitives = nonNull.every(v => typeof v !== 'object');
    if (allPrimitives) {
        const types = [...new Set(nonNull.map(v => inferTsType(v)))];
        const base = types.length === 1 ? types[0] : `(${types.join(' | ')})`;
        return hasNull ? `(${base} | null)` : base;
    }

    // Arrays whose elements are all primitives keep their element type.
    const allArrays = nonNull.every(v => Array.isArray(v));
    if (allArrays) {
        const elems = nonNull.flatMap(a => a);
        if (elems.length > 0 && elems.every(v => typeof v !== 'object')) {
            const types = [...new Set(elems.map(v => inferTsType(v)))];
            const elemType = types.length === 1 ? types[0] : `(${types.join(' | ')})`;
            return hasNull ? `(${elemType}[] | null)` : `${elemType}[]`;
        }
        return hasNull ? '(unknown[] | null)' : 'unknown[]';
    }

    return hasNull ? '(unknown | null)' : 'unknown';
}

/**
 * @param {any[]} instances  - observed argument objects for one step type
 * @param {boolean} shallow  - when true, use shallowFieldType instead of
 *   mergeRawValues so non-convertible step types stay compact.
 */
function mergeArgumentSchemas(instances, shallow = false) {
    const keyMeta = new Map(); // key -> { count: number, rawValues: any[] }
    const total = instances.length;

    for (const args of instances) {
        if (!args || typeof args !== 'object' || Array.isArray(args)) continue;
        for (const [k, v] of Object.entries(args)) {
            if (!keyMeta.has(k)) keyMeta.set(k, {count: 0, rawValues: []});
            const m = keyMeta.get(k);
            m.count++;
            m.rawValues.push(v);
        }
    }

    const fields = [];
    for (const [key, meta] of keyMeta.entries()) {
        const tsType = shallow
            ? shallowFieldType(meta.rawValues)
            : mergeRawValues(meta.rawValues);
        fields.push({key, optional: meta.count < total, tsType, count: meta.count, total});
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
            const safe = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field.key)
                ? field.key
                : `"${field.key}"`;
            const opt = field.optional ? '?' : '';
            const pct = Math.round((field.count / field.total) * 100);
            const isSystem = SYSTEM_ARGUMENT_KEYS.has(field.key);
            const tag = isSystem ? ' [system key]' : '';
            const note = `  // ${field.count}/${field.total} instances (${pct}%)${tag}`;
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
            const safe = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(field.key)
                ? field.key
                : `"${field.key}"`;
            const opt = field.optional ? '?' : '';
            const isSystem = SYSTEM_ARGUMENT_KEYS.has(field.key);
            const note = field.optional
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
 * Returns flat array of { collectionName, collectionUUID, playbookName, playbookUUID,
 *                         step, sourceFile }.
 */
function collectAllSteps(exportData, sourceFile = '') {
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
                result.push({
                    collectionName: colName,
                    collectionUUID: colUUID,
                    playbookName: pbName,
                    playbookUUID: pbUUID,
                    step,
                    sourceFile,
                });
            }
        }
    }

    return result;
}

/**
 * Build stepTypeMap and playbookStats indexes from a flat allEntries array.
 * Returns { stepTypeMap, playbookStats }.
 *
 * stepTypeMap : uuid -> { instances: args[], playbooks: Set<uuid>, stepNames: string[],
 *                         rawEntries: entry[] }
 * playbookStats: uuid -> { name, collectionName, stepCount, stepTypeSet }
 */
function buildIndex(allEntries) {
    const stepTypeMap = new Map();
    const playbookStats = new Map();

    for (const entry of allEntries) {
        const {collectionName, playbookName, playbookUUID, step} = entry;
        const stepTypeUUID = extractUUID(step.stepType);
        if (!stepTypeUUID) continue;

        // Step-type index
        if (!stepTypeMap.has(stepTypeUUID)) {
            stepTypeMap.set(stepTypeUUID, {instances: [], playbooks: new Set(), stepNames: [], rawEntries: []});
        }
        const td = stepTypeMap.get(stepTypeUUID);
        td.instances.push(step.arguments ?? {});
        td.playbooks.add(playbookUUID);
        td.stepNames.push(`${step.name ?? 'unnamed'} (in "${playbookName}" / collection: "${collectionName}")`);
        td.rawEntries.push(entry);

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

    return {stepTypeMap, playbookStats};
}

// ─── Structural shape collection ─────────────────────────────────────────────

/**
 * Walk an exportData object and collect the structural fields of playbooks/workflows
 * and steps (excluding step.arguments, which is handled by mergeArgumentSchemas).
 * Returns { playbookShapes: object[], stepShapes: object[] }
 */
function collectStructuralShapes(exportData) {
    const playbookShapes = [];
    const stepShapes = [];
    const collections = exportData.data ?? [];

    for (const col of collections) {
        const playbooks = col.workflows ?? col.playbooks ?? [];
        for (const pb of playbooks) {
            // Capture playbook fields, excluding the steps/workflows array itself
            const {steps: _steps, workflows: _workflows, ...pbFields} = pb;
            playbookShapes.push(pbFields);

            for (const step of (pb.steps ?? [])) {
                // Capture step fields, excluding arguments (covered by step-arg interfaces)
                const {arguments: _args, ...stepFields} = step;
                // Normalize stepType to its UUID string for consistent typing
                if (stepFields.stepType && typeof stepFields.stepType === 'string' && stepFields.stepType.includes('/')) {
                    stepFields.stepType = stepFields.stepType.split('/').filter(Boolean).pop();
                }
                stepShapes.push(stepFields);
            }
        }
    }

    return {playbookShapes, stepShapes};
}

// ─── Structural interface helpers ─────────────────────────────────────────────

/**
 * Format a single value into a compact, readable sample string for a JSDoc comment.
 * Caps at ~80 characters so comments stay on one line.
 */
function formatSample(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    if (typeof value === 'string') {
        const s = JSON.stringify(value);
        return s.length <= 80 ? s : JSON.stringify(value.slice(0, 60)) + '..."';
    }
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        const item = formatSample(value[0]);
        return value.length === 1 ? `[${item}]` : `[${item}, ...]`;
    }
    if (typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 0) return '{}';
        const preview = JSON.stringify(value);
        if (preview.length <= 80) return preview;
        const shown = keys.slice(0, 3).join(', ');
        return `{ ${shown}${keys.length > 3 ? ', ...' : ''} }`;
    }
    return String(value);
}

/**
 * Build TypeScript interface lines for a structural shape (playbook or step),
 * including a JSDoc sample-value comment for each field.
 *
 * Unlike mergeObjectShapes, this function returns an array of lines so callers
 * can push them into the output buffer with `export interface` wrapping.
 */
function buildStructuralInterface(shapes, interfaceName) {
    const valid = shapes.filter(o => o && typeof o === 'object' && !Array.isArray(o));
    if (valid.length === 0) return null;

    const total = valid.length;
    const keyMeta = new Map(); // key -> { count, values[], sample }

    for (const obj of valid) {
        for (const [k, v] of Object.entries(obj)) {
            if (!keyMeta.has(k)) keyMeta.set(k, {count: 0, values: [], sample: null});
            const m = keyMeta.get(k);
            m.count++;
            m.values.push(v);
            // Keep the first non-null, non-empty-array, non-empty-object sample
            if (m.sample === null && v != null) m.sample = v;
        }
    }

    // Sort: required fields first, then alphabetical
    const sorted = [...keyMeta.entries()].sort(([ak, am], [bk, bm]) => {
        const aReq = am.count === total;
        const bReq = bm.count === total;
        if (aReq !== bReq) return aReq ? -1 : 1;
        return ak.localeCompare(bk);
    });

    const lines = [];
    lines.push(`export interface ${interfaceName} {`);

    for (const [k, meta] of sorted) {
        const safe = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
        const opt = meta.count < total ? '?' : '';
        // Start mergeRawValues at depth 0 — structural fields need at most one
        // level of nesting to be useful (e.g., steps[], nextStep {}, etc.)
        const type = mergeRawValues(meta.values, 0);

        if (meta.sample !== null) {
            lines.push(`  /** e.g. ${formatSample(meta.sample)} */`);
        }
        const freq = meta.count < total
            ? `  // present in ${meta.count}/${total} playbooks`
            : '';
        lines.push(`  ${safe}${opt}: ${type};${freq}`);
    }

    lines.push('}');
    return lines;
}

// ─── TypeScript file generation ───────────────────────────────────────────────

function generateTypeScriptFile(index, meta, showAllKeys = false, structuralShapes = null) {
    const {stepTypeMap, playbookStats} = index;
    const {sourceLabel, kind, colCount} = meta;
    const now = new Date().toISOString();
    const totalSteps = [...stepTypeMap.values()].reduce((s, v) => s + v.instances.length, 0);

    const out = [];

    // ── File header ────────────────────────────────────────────────────────────
    out.push('/**');
    out.push(` * Auto-generated step-type schema`);
    out.push(` * Source    : ${sourceLabel}`);
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
        const cls = BUILT_IN_CLASSIFICATIONS[uuid];
        const name = cls?.name ?? 'Unknown';
        const label = cls?.label ?? uuid;
        const category = cls?.category ?? 'unknown';
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
        const cls = BUILT_IN_CLASSIFICATIONS[uuid];
        const interfaceName = toInterfaceName(uuid, cls);
        const label = cls?.label ?? uuid;
        const category = cls?.category ?? 'unknown';
        const isKnown = !!cls;

        interfaceNames.push({interfaceName, uuid});

        // Non-convertible FSR-only triggers: use shallowFieldType so all object/array
        // fields collapse to unknown, keeping the interface compact and readable.
        const isShallow = SHALLOW_SCHEMA_TYPES.has(uuid);
        const fields = mergeArgumentSchemas(typeData.instances, isShallow);
        const isDynamic = detectDynamicKeys(fields, typeData.instances);
        const bodyLines = buildInterfaceBody(fields, isDynamic, showAllKeys);

        out.push('/**');
        out.push(` * ${label}`);
        out.push(` * UUID     : ${uuid}`);
        out.push(` * Category : ${category}`);
        out.push(` * Instances: ${typeData.instances.length} step(s) across ${typeData.playbooks.size} playbook(s)`);
        if (isShallow) out.push(` * NOTE: No FAS equivalent — argument schema is intentionally shallow.`);
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
        interfaceNames.forEach(({interfaceName}, i) => {
            const trail = i < interfaceNames.length - 1 ? '' : ';';
            out.push(`  | ${interfaceName}${trail}`);
        });
    } else {
        out.push('export type AnyStepArgs = Record<string, unknown>;');
    }

    out.push('');

    // ── Structural interfaces (Section 4) ─────────────────────────────────────
    out.push("// ============================================================");
    out.push("// 4. Playbook & Step Structural Interfaces");
    out.push("//");
    out.push("//  Derived from observed playbook/step objects (excluding step");
    out.push("//  arguments, which are in Section 2). Use these to validate");
    out.push("//  the shape of converter output.");
    out.push("// ============================================================");
    out.push('');

    if (structuralShapes && structuralShapes.playbookShapes.length > 0) {
        const pbLines = buildStructuralInterface(structuralShapes.playbookShapes, 'PlaybookStructure');
        if (pbLines) {
            out.push('/** Top-level playbook/workflow object (steps array excluded). */');
            for (const l of pbLines) out.push(l);
            out.push('');
        }
    }

    if (structuralShapes && structuralShapes.stepShapes.length > 0) {
        const stepLines = buildStructuralInterface(structuralShapes.stepShapes, 'StepStructure');
        if (stepLines) {
            out.push('/** Step object structure (arguments field excluded — see Section 2). */');
            for (const l of stepLines) out.push(l);
            out.push('');
        }
        out.push('/** A fully-typed step including its arguments. */');
        out.push('export interface PlaybookStep extends StepStructure {');
        out.push('  arguments: AnyStepArgs;');
        out.push('}');
    } else {
        out.push('/** A single step as it appears inside a playbook. */');
        out.push('export interface PlaybookStep {');
        out.push('  uuid: string;');
        out.push('  name: string;');
        out.push('  /** Raw step-type UUID — look up in STEP_TYPE_CLASSIFICATIONS */');
        out.push('  stepType: string;');
        out.push('  arguments: AnyStepArgs;');
        out.push('  top?: string;');
        out.push('  left?: string;');
        out.push('}');
    }

    out.push('');

    return out.join('\n');
}

// ─── Summary report ───────────────────────────────────────────────────────────

function buildSummaryReport(index, meta) {
    const {stepTypeMap, playbookStats} = index;
    const {sourceLabel, kind, colCount} = meta;

    const lines = [];
    const sep = '='.repeat(64);
    const dash = '-'.repeat(64);
    const totalSteps = [...stepTypeMap.values()].reduce((s, v) => s + v.instances.length, 0);

    lines.push(sep);
    lines.push('PLAYBOOK COLLECTION SCHEMA REPORT');
    lines.push(sep);
    lines.push(`Source      : ${sourceLabel}`);
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
        const steps = String(pb.stepCount).padStart(5);
        const types = String(pb.stepTypeSet.size).padStart(12);
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
        const cls = BUILT_IN_CLASSIFICATIONS[uuid];
        const label = cls ? cls.label : '⚠ UNCLASSIFIED';
        const count = String(typeData.instances.length).padStart(5);
        const pbCount = String(typeData.playbooks.size).padStart(9);
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
            // Show one full step JSON so the user can inspect all fields
            if (typeData.rawEntries.length > 0) {
                const sampleStep = typeData.rawEntries[0].step;
                const json = JSON.stringify(sampleStep, null, 2);
                lines.push(`    step json:`);
                for (const jsonLine of json.split('\n')) {
                    lines.push(`      ${jsonLine}`);
                }
            }
        }
        lines.push('');
    }

    lines.push(sep);

    return lines.join('\n');
}

// ─── Comparison report ────────────────────────────────────────────────────────

/**
 * These keys can wrap any FSR step type (control-flow modifiers) so their
 * presence/absence across step types is expected — not a format difference.
 * Excluded from the comparison diff to avoid noise.
 */
const COMPARISON_SKIP_KEYS = new Set(['do_until', 'for_each', 'ignore_errors', 'when']);

/**
 * Collapse a full TypeScript type string to a short, single-line summary
 * suitable for comparison report display. Multi-line objects → "object",
 * union of objects → "object", arrays → "array" or "type[]".
 */
function shortType(tsType) {
    if (!tsType) return 'unknown';
    const t = tsType.trim();

    // Primitives and simple types
    if (['string', 'boolean', 'number', 'null', 'unknown'].includes(t)) return t;
    if (t === 'unknown[]') return 'unknown[]';

    // Multi-line (complex inline object) → "object"
    if (t.includes('\n')) return 'object';

    // Inline object { ... } → "object"
    if (t.startsWith('{') && t.endsWith('}')) return 'object';

    // Record<...> → "object"
    if (t.startsWith('Record<')) return 'object';

    // Array types: Type[] or (Union)[]
    if (t.endsWith('[]')) {
        const inner = t.slice(0, -2).replace(/^\(|\)$/g, '');
        return `${shortType(inner)}[]`;
    }

    // Union: split on ' | ', simplify each, deduplicate
    if (t.includes(' | ')) {
        const parts = t.replace(/^\(|\)$/g, '').split(' | ').map(p => shortType(p.trim()));
        const unique = [...new Set(parts)];
        return unique.length === 1 ? unique[0] : unique.join(' | ');
    }

    return t;
}

/**
 * Compare FAS and FSR step-type indexes. Produces a text report covering:
 *   • Step types present in FAS only (need converter path or explicit drop)
 *   • Step types present in FSR only (same)
 *   • Step types shared: argument key differences (FAS-only keys, FSR-only keys,
 *     keys with mismatched types)
 */
function buildComparisonReport(fasIndex, fsrIndex, fasFiles, fsrFiles) {
    const {stepTypeMap: fasMap} = fasIndex;
    const {stepTypeMap: fsrMap} = fsrIndex;

    const lines = [];
    const sep = '='.repeat(72);
    const dash = '-'.repeat(72);

    lines.push(sep);
    lines.push('FAS ↔ FSR SCHEMA COMPARISON REPORT');
    lines.push(sep);
    lines.push(`FAS sources : ${fasFiles.join(', ')}`);
    lines.push(`FSR sources : ${fsrFiles.join(', ')}`);
    lines.push(`FAS step types: ${fasMap.size}  |  FSR step types: ${fsrMap.size}`);
    lines.push(`Note: universal FSR modifiers excluded from key diffs: ${[...COMPARISON_SKIP_KEYS].join(', ')}`);
    lines.push('');

    const fasUUIDs = new Set(fasMap.keys());
    const fsrUUIDs = new Set(fsrMap.keys());
    const sharedUUIDs = [...fasUUIDs].filter(u => fsrUUIDs.has(u));
    const fasOnlyUUIDs = [...fasUUIDs].filter(u => !fsrUUIDs.has(u));
    const fsrOnlyUUIDs = [...fsrUUIDs].filter(u => !fasUUIDs.has(u));

    // ── FAS-only step types ────────────────────────────────────────────────────
    lines.push(dash);
    lines.push(`FAS-ONLY STEP TYPES (${fasOnlyUUIDs.length}) — no equivalent seen in FSR data`);
    lines.push(dash);
    if (fasOnlyUUIDs.length === 0) {
        lines.push('  (none)');
    } else {
        lines.push('  Count  Playbooks  UUID                                  Label');
        for (const uuid of fasOnlyUUIDs.sort((a, b) => {
            return (fasMap.get(b)?.instances.length ?? 0) - (fasMap.get(a)?.instances.length ?? 0);
        })) {
            const td = fasMap.get(uuid);
            const cls = BUILT_IN_CLASSIFICATIONS[uuid];
            const label = cls ? cls.label : '⚠ UNCLASSIFIED';
            const count = String(td.instances.length).padStart(5);
            const pbs = String(td.playbooks.size).padStart(9);
            lines.push(`  ${count}  ${pbs}  ${uuid}  ${label}`);
        }
    }
    lines.push('');

    // ── FSR-only step types ────────────────────────────────────────────────────
    lines.push(dash);
    lines.push(`FSR-ONLY STEP TYPES (${fsrOnlyUUIDs.length}) — no equivalent seen in FAS data`);
    lines.push(dash);
    if (fsrOnlyUUIDs.length === 0) {
        lines.push('  (none)');
    } else {
        lines.push('  Count  Playbooks  UUID                                  Label');
        for (const uuid of fsrOnlyUUIDs.sort((a, b) => {
            return (fsrMap.get(b)?.instances.length ?? 0) - (fsrMap.get(a)?.instances.length ?? 0);
        })) {
            const td = fsrMap.get(uuid);
            const cls = BUILT_IN_CLASSIFICATIONS[uuid];
            const label = cls ? cls.label : '⚠ UNCLASSIFIED';
            const count = String(td.instances.length).padStart(5);
            const pbs = String(td.playbooks.size).padStart(9);
            lines.push(`  ${count}  ${pbs}  ${uuid}  ${label}`);
        }
    }
    lines.push('');

    // ── Shared types: argument shape comparison ────────────────────────────────
    lines.push(dash);
    lines.push(`SHARED STEP TYPES (${sharedUUIDs.length}) — argument shape comparison`);
    lines.push(dash);
    lines.push('  Lists argument keys that differ between formats.');
    lines.push('  Threshold: ≥30% for user keys; ≥5% for system keys. Universal modifiers excluded.');
    lines.push('');

    /**
     * Compute the structural key map for a step type.
     *
     * A key is "structural" (included in comparison) when:
     *   • It is NOT a universal modifier (do_until / for_each / ignore_errors / when)
     *   • AND either:
     *       - It appears in ≥30% of instances (user keys), OR
     *       - It is a system key AND appears in ≥5% of instances
     *
     * The minimum-frequency requirement for system keys prevents keys seen in
     * 1–2 instances from being treated as format differences.
     */
    function structuralKeys(td) {
        const fields = mergeArgumentSchemas(td.instances);
        return new Map(
            fields
                .filter(f => {
                    if (COMPARISON_SKIP_KEYS.has(f.key)) return false;
                    const freq = f.count / f.total;
                    if (SYSTEM_ARGUMENT_KEYS.has(f.key)) return freq >= 0.05;
                    return freq >= 0.3;
                })
                .map(f => [f.key, f])
        );
    }

    let sharedDiffsFound = 0;

    for (const uuid of sharedUUIDs) {
        const fasTd = fasMap.get(uuid);
        const fsrTd = fsrMap.get(uuid);
        const cls = BUILT_IN_CLASSIFICATIONS[uuid];
        const label = cls ? cls.label : `UNCLASSIFIED (${uuid})`;

        const fasKeys = structuralKeys(fasTd);
        const fsrKeys = structuralKeys(fsrTd);

        const fasOnlyKeys = [...fasKeys.keys()].filter(k => !fsrKeys.has(k));
        const fsrOnlyKeys = [...fsrKeys.keys()].filter(k => !fasKeys.has(k));

        // Keys in both but with meaningfully different collapsed types
        const typeMismatches = [];
        for (const key of fasKeys.keys()) {
            if (fsrKeys.has(key)) {
                const fasType = shortType(fasKeys.get(key).tsType);
                const fsrType = shortType(fsrKeys.get(key).tsType);
                if (fasType !== fsrType) {
                    typeMismatches.push({key, fasType, fsrType});
                }
            }
        }

        if (fasOnlyKeys.length === 0 && fsrOnlyKeys.length === 0 && typeMismatches.length === 0) {
            continue; // No differences — skip
        }

        sharedDiffsFound++;
        lines.push(`  ${label}  (UUID: ${uuid})`);
        lines.push(`  FAS: ${fasTd.instances.length} instances / ${fasTd.playbooks.size} playbooks    FSR: ${fsrTd.instances.length} instances / ${fsrTd.playbooks.size} playbooks`);

        if (fasOnlyKeys.length > 0) {
            lines.push(`  FAS-only keys:`);
            for (const k of fasOnlyKeys) {
                const f = fasKeys.get(k);
                const pct = Math.round((f.count / f.total) * 100);
                const sys = SYSTEM_ARGUMENT_KEYS.has(k) ? ' [sys]' : '';
                lines.push(`    + ${k}${sys}  <${shortType(f.tsType)}>  ${pct}%`);
            }
        }

        if (fsrOnlyKeys.length > 0) {
            lines.push(`  FSR-only keys:`);
            for (const k of fsrOnlyKeys) {
                const f = fsrKeys.get(k);
                const pct = Math.round((f.count / f.total) * 100);
                const sys = SYSTEM_ARGUMENT_KEYS.has(k) ? ' [sys]' : '';
                lines.push(`    + ${k}${sys}  <${shortType(f.tsType)}>  ${pct}%`);
            }
        }

        if (typeMismatches.length > 0) {
            lines.push(`  Type mismatches:`);
            for (const {key, fasType, fsrType} of typeMismatches) {
                const sys = SYSTEM_ARGUMENT_KEYS.has(key) ? ' [sys]' : '';
                lines.push(`    ~ ${key}${sys}  FAS:<${fasType}>  FSR:<${fsrType}>`);
            }
        }

        lines.push('');
    }

    if (sharedDiffsFound === 0) {
        lines.push('  (no argument shape differences found in shared step types)');
        lines.push('');
    }

    // ── Top playbooks by unique step types per source ─────────────────────────
    const TOP_N = 10;
    lines.push(dash);
    lines.push(`TOP ${TOP_N} PLAYBOOKS BY UNIQUE STEP TYPES — per source`);
    lines.push(dash);

    for (const [label, idx] of [['FAS', fasIndex], ['FSR', fsrIndex]]) {
        lines.push(`  ${label}:`);
        lines.push(`  ${'Types'.padStart(5)}  ${'Steps'.padStart(6)}  Playbook Name (Collection)`);
        const top = [...idx.playbookStats.values()]
            .sort((a, b) => b.stepTypeSet.size - a.stepTypeSet.size || b.stepCount - a.stepCount)
            .slice(0, TOP_N);
        if (top.length === 0) {
            lines.push('    (none)');
        } else {
            for (const pb of top) {
                const types = String(pb.stepTypeSet.size).padStart(5);
                const steps = String(pb.stepCount).padStart(6);
                lines.push(`  ${types}  ${steps}  ${pb.name} (${pb.collectionName})`);
            }
        }
        lines.push('');
    }

    // ── Summary ────────────────────────────────────────────────────────────────
    lines.push(dash);
    lines.push('SUMMARY');
    lines.push(dash);
    lines.push(`  Shared step types       : ${sharedUUIDs.length}`);
    lines.push(`  FAS-only step types     : ${fasOnlyUUIDs.length}`);
    lines.push(`  FSR-only step types     : ${fsrOnlyUUIDs.length}`);
    lines.push(`  Shared types with diffs : ${sharedDiffsFound}`);
    lines.push('');

    if (fasOnlyUUIDs.length > 0) {
        lines.push('  FAS-only types need a converter path in fas-to-fsr.js, or explicit');
        lines.push('  documentation that they are dropped/unsupported during conversion.');
    }
    if (fsrOnlyUUIDs.length > 0) {
        lines.push('  FSR-only types need a converter path in fsr-to-fas.js, or explicit');
        lines.push('  documentation that they are flagged as unsupported.');
    }

    lines.push(sep);

    return lines.join('\n');
}

// ─── Outlier report ───────────────────────────────────────────────────────────

/**
 * For each step type with ≥ minInstances instances, compute the "modal" argument
 * key set (system keys present in ≥ 50% of instances), then flag individual
 * instances where:
 *   • A modal system key is missing
 *   • An unexpected system key appears (present in < 10% of instances for this type)
 *
 * Returns a text report listing outlier playbooks by name.
 */
function buildOutlierReport(index, minInstances = 3) {
    const {stepTypeMap, playbookStats} = index;

    const lines = [];
    const sep = '='.repeat(72);
    const dash = '-'.repeat(72);

    lines.push(sep);
    lines.push('STEP ARGUMENT OUTLIER REPORT');
    lines.push(sep);
    lines.push(`Minimum instances to analyze: ${minInstances}`);
    lines.push('Outlier = a step instance where a normally-present system key is');
    lines.push('missing, or a normally-absent system key is present.');
    lines.push('');

    let totalOutliers = 0;

    for (const [uuid, typeData] of stepTypeMap.entries()) {
        if (typeData.instances.length < minInstances) continue;

        const cls = BUILT_IN_CLASSIFICATIONS[uuid];
        const label = cls ? cls.label : `UNCLASSIFIED (${uuid})`;
        const total = typeData.instances.length;

        // Compute per-key frequency (system keys only)
        const keyFreq = new Map();
        for (const args of typeData.instances) {
            if (!args || typeof args !== 'object' || Array.isArray(args)) continue;
            for (const k of Object.keys(args)) {
                if (SYSTEM_ARGUMENT_KEYS.has(k)) {
                    keyFreq.set(k, (keyFreq.get(k) ?? 0) + 1);
                }
            }
        }

        // Modal keys: system keys present in ≥ 50% of instances
        const modalKeys = new Set([...keyFreq.entries()].filter(([, c]) => c / total >= 0.5).map(([k]) => k));
        // Rare keys: system keys present in < 10% of instances
        const rareKeys = new Set([...keyFreq.entries()].filter(([, c]) => c / total < 0.1).map(([k]) => k));

        const typeOutliers = [];

        typeData.rawEntries.forEach((entry, i) => {
            const args = typeData.instances[i];
            if (!args || typeof args !== 'object' || Array.isArray(args)) return;

            const presentKeys = new Set(Object.keys(args).filter(k => SYSTEM_ARGUMENT_KEYS.has(k)));

            const missingModal = [...modalKeys].filter(k => !presentKeys.has(k));
            const unexpectedRare = [...rareKeys].filter(k => presentKeys.has(k));

            if (missingModal.length === 0 && unexpectedRare.length === 0) return;

            typeOutliers.push({
                stepName: entry.step.name ?? 'unnamed',
                playbookName: entry.playbookName,
                collectionName: entry.collectionName,
                sourceFile: entry.sourceFile,
                missingModal,
                unexpectedRare,
            });
        });

        if (typeOutliers.length === 0) continue;

        totalOutliers += typeOutliers.length;
        lines.push(dash);
        lines.push(`${label}`);
        lines.push(`UUID: ${uuid}`);
        lines.push(`Total instances: ${total}  |  Modal system keys: [${[...modalKeys].sort().join(', ')}]`);
        lines.push(`Outlier instances: ${typeOutliers.length}`);
        lines.push('');

        for (const o of typeOutliers) {
            lines.push(`  Step    : "${o.stepName}"`);
            lines.push(`  Playbook: "${o.playbookName}" (collection: "${o.collectionName}")`);
            if (o.sourceFile) lines.push(`  File    : ${o.sourceFile}`);
            if (o.missingModal.length > 0) {
                lines.push(`  Missing : ${o.missingModal.join(', ')}`);
            }
            if (o.unexpectedRare.length > 0) {
                lines.push(`  Unusual : ${o.unexpectedRare.join(', ')} (present in <10% of this type)`);
            }
            lines.push('');
        }
    }

    if (totalOutliers === 0) {
        lines.push('No outliers detected across all step types with sufficient sample size.');
        lines.push('');
    } else {
        lines.push(dash);
        lines.push(`TOTAL OUTLIER INSTANCES: ${totalOutliers}`);
        lines.push('');
        lines.push('Review each outlier to determine whether:');
        lines.push('  • The playbook has a legitimately different configuration');
        lines.push('  • The converter makes incorrect assumptions about which keys are');
        lines.push('    always present for this step type');
        lines.push('');
    }

    lines.push(sep);

    return lines.join('\n');
}

// ─── Converter gap analysis ───────────────────────────────────────────────────

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Extract all UUID literals from a source string.
 */
function extractUUIDsFromSource(src) {
    return new Set((src.match(UUID_PATTERN) ?? []).map(u => u.toLowerCase()));
}

/**
 * Extract argument key accesses from converter source.
 * Looks for patterns like:
 *   stepArguments.key, fixedArgs.key, args.key, arguments.key,
 *   condition.key, option.key, .key (chained)
 * Also catches string literals used as property names in bracket notation.
 *
 * Returns a Set of key names (strings).
 */
function extractArgKeyRefsFromSource(src) {
    const keys = new Set();

    // Dot-access patterns: word.key (only the last segment)
    const dotAccess = src.matchAll(/(?:stepArguments|fixedArgs|args|arguments|condition|option|fasStep|fsrStep|playbook|workflow)\s*\.\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
    for (const m of dotAccess) keys.add(m[1]);

    // Bracket string access patterns: obj['key'] or obj["key"]
    const bracketAccess = src.matchAll(/\[\s*['"]([a-zA-Z_$][a-zA-Z0-9_$]*)['"]\s*\]/g);
    for (const m of bracketAccess) keys.add(m[1]);

    // Destructuring or shorthand object key patterns inside argument objects
    // e.g. { connector: ..., operation: ..., }
    // We pick up keys that appear in argument-construction objects — look for
    // lines that look like object literal key: value where key is a known system key
    for (const key of SYSTEM_ARGUMENT_KEYS) {
        const re = new RegExp(`\\b${key}\\b`);
        if (re.test(src)) keys.add(key);
    }

    return keys;
}

/**
 * Cross-reference observed schema against converter source code.
 * converterDir: directory containing fas-to-fsr.js and fsr-to-fas.js
 */
function buildConverterGapReport(fasIndex, fsrIndex, converterDir) {
    const lines = [];
    const sep = '='.repeat(72);
    const dash = '-'.repeat(72);

    const fasToFsrPath = path.join(converterDir, 'fas-to-fsr.js');
    const fsrToFasPath = path.join(converterDir, 'fsr-to-fas.js');

    const fasToFsrSrc = fs.existsSync(fasToFsrPath) ? fs.readFileSync(fasToFsrPath, 'utf8') : null;
    const fsrToFasSrc = fs.existsSync(fsrToFasPath) ? fs.readFileSync(fsrToFasPath, 'utf8') : null;

    lines.push(sep);
    lines.push('CONVERTER GAP ANALYSIS');
    lines.push(sep);
    lines.push(`fas-to-fsr.js : ${fasToFsrSrc ? 'found' : 'NOT FOUND at ' + fasToFsrPath}`);
    lines.push(`fsr-to-fas.js : ${fsrToFasSrc ? 'found' : 'NOT FOUND at ' + fsrToFasPath}`);
    lines.push('');

    // ── Helper to render one direction ──────────────────────────────────────────
    function analyzeDirection(label, schemaIndex, converterSrc, converterFile) {
        if (!converterSrc) {
            lines.push(dash);
            lines.push(`${label} — skipped (source file not found)`);
            lines.push('');
            return;
        }

        const {stepTypeMap} = schemaIndex;
        const codeUUIDs = extractUUIDsFromSource(converterSrc);
        const codeKeys = extractArgKeyRefsFromSource(converterSrc);

        lines.push(dash);
        lines.push(`${label}`);
        lines.push(`Converter   : ${converterFile}`);
        lines.push(`Schema types: ${stepTypeMap.size}  |  UUIDs referenced in converter: ${codeUUIDs.size}`);
        lines.push('');

        // Step types in schema but not mentioned in converter code
        const missingFromConverter = [];
        for (const [uuid, td] of stepTypeMap.entries()) {
            if (!codeUUIDs.has(uuid.toLowerCase())) {
                const cls = BUILT_IN_CLASSIFICATIONS[uuid];
                missingFromConverter.push({
                    uuid,
                    label: cls?.label ?? 'UNCLASSIFIED',
                    count: td.instances.length,
                    pbs: td.playbooks.size
                });
            }
        }

        if (missingFromConverter.length > 0) {
            lines.push(`  Step types in schema but NOT referenced in ${path.basename(converterFile)}:`);
            lines.push('  (these may be pass-through types, or gaps in converter coverage)');
            lines.push('  Count  Playbooks  UUID                                  Label');
            for (const e of missingFromConverter.sort((a, b) => b.count - a.count)) {
                lines.push(`  ${String(e.count).padStart(5)}  ${String(e.pbs).padStart(9)}  ${e.uuid}  ${e.label}`);
            }
            lines.push('');
        } else {
            lines.push('  All schema step types are referenced in converter code.');
            lines.push('');
        }

        // UUIDs in converter but not seen in schema (stale references / dead code)
        const staleInConverter = [...codeUUIDs].filter(u => !stepTypeMap.has(u) && !stepTypeMap.has(u.toLowerCase()));
        // Filter out UUIDs that belong to picklists / collections / people (non-step type refs)
        const knownNonStepUUIDs = new Set([
            '2b563c61-ae2c-41c0-a85a-c9709585e3f2',  // priority picklist
            '15c1e8c9-22bf-4e66-8fbb-0a502d4a4a3f',  // playbookOrigin picklist
        ]);
        const genuinelyStale = staleInConverter.filter(u => !knownNonStepUUIDs.has(u));

        if (genuinelyStale.length > 0) {
            lines.push(`  UUIDs in converter code but NOT seen in schema (${genuinelyStale.length}):`);
            lines.push('  (may be picklist/resource UUIDs, step types absent from this export,');
            lines.push('   or stale references to removed step types)');
            for (const u of genuinelyStale.sort()) {
                const cls = BUILT_IN_CLASSIFICATIONS[u];
                const name = cls ? cls.label : 'unknown';
                lines.push(`    ${u}  (${name})`);
            }
            lines.push('');
        }

        // System argument keys in schema but not referenced in converter
        const allSchemaSystemKeys = new Set();
        for (const [, td] of stepTypeMap.entries()) {
            for (const args of td.instances) {
                if (!args || typeof args !== 'object') continue;
                for (const k of Object.keys(args)) {
                    if (SYSTEM_ARGUMENT_KEYS.has(k)) allSchemaSystemKeys.add(k);
                }
            }
        }

        const unhandledKeys = [...allSchemaSystemKeys].filter(k => !codeKeys.has(k));
        if (unhandledKeys.length > 0) {
            lines.push(`  System argument keys observed in schema but NOT referenced in ${path.basename(converterFile)}:`);
            lines.push('  (converter may silently pass these through or drop them)');
            for (const k of unhandledKeys.sort()) {
                // Find which step types have this key
                const typesWithKey = [];
                for (const [uuid, td] of stepTypeMap.entries()) {
                    if (td.instances.some(a => a && typeof a === 'object' && k in a)) {
                        const cls = BUILT_IN_CLASSIFICATIONS[uuid];
                        typesWithKey.push(cls?.name ?? uuid.slice(0, 8) + '…');
                    }
                }
                lines.push(`    • ${k}  (seen in: ${typesWithKey.join(', ')})`);
            }
            lines.push('');
        } else {
            lines.push('  All observed system argument keys are referenced in converter code.');
            lines.push('');
        }
    }

    // FAS → FSR: FAS schema vs fas-to-fsr.js
    if (fasIndex) {
        analyzeDirection(
            'FAS → FSR  (schema: FAS playbooks  |  converter: fas-to-fsr.js)',
            fasIndex,
            fasToFsrSrc,
            fasToFsrPath,
        );
    }

    // FSR → FAS: FSR schema vs fsr-to-fas.js
    if (fsrIndex) {
        analyzeDirection(
            'FSR → FAS  (schema: FSR workflows  |  converter: fsr-to-fas.js)',
            fsrIndex,
            fsrToFasSrc,
            fsrToFasPath,
        );
    }

    lines.push(sep);

    return lines.join('\n');
}

// ─── CLI helpers ──────────────────────────────────────────────────────────────

function printUsage() {
    console.log('Usage: node scripts/generate-schema.js <input.json> [input2.json ...] [options]');
    console.log('       node scripts/generate-schema.js <input.json> [output-dir]   (legacy)');
    console.log('');
    console.log('Options:');
    console.log('  --output-dir <dir>   Directory for generated files (default: current dir)');
    console.log('  --show-all-keys      List every argument key with X/Y instances (N%) frequency');
    console.log('                       annotation; useful for distinguishing system vs user-defined');
    console.log('                       keys. Without this flag, low-frequency keys are collapsed');
    console.log('                       into [key: string]: unknown.');
    console.log('  --outliers           Generate outlier-report.txt: per step type, flag playbooks');
    console.log('                       whose argument sets deviate from the modal pattern.');
    console.log('  --check-converter    Generate converter-gaps.txt: cross-reference schema UUIDs');
    console.log('                       and system argument keys against converter source code.');
    console.log('                       Looks for converter/ directory next to scripts/.');
    console.log('  --help, -h           Show this help');
    console.log('');
    console.log('Inputs:');
    console.log('  Any number of FAS (playbook_collections) or FSR (workflow_collections) JSON');
    console.log('  exports. Files of the same format are aggregated. If both formats are provided,');
    console.log('  a comparison-report.txt is generated automatically.');
    console.log('');
    console.log('Outputs (all written to output-dir):');
    console.log('  step-schema.ts          TypeScript interfaces and step-type registry');
    console.log('  schema-report.txt       Human-readable summary report');
    console.log('  [fas-schema.ts]         FAS-specific schema (when mixed-format input)');
    console.log('  [fsr-schema.ts]         FSR-specific schema (when mixed-format input)');
    console.log('  [comparison-report.txt] FAS ↔ FSR diff (when mixed-format input)');
    console.log('  [outlier-report.txt]    Argument outliers (--outliers)');
    console.log('  [converter-gaps.txt]    Converter coverage gaps (--check-converter)');
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function main() {
    const argv = process.argv.slice(2);

    const showAllKeys = argv.includes('--show-all-keys');
    const showOutliers = argv.includes('--outliers');
    const checkConverter = argv.includes('--check-converter');

    if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
        printUsage();
        process.exit(0);
    }

    // Parse --output-dir <dir>
    let outputDir = null;
    const outputDirIdx = argv.indexOf('--output-dir');
    if (outputDirIdx !== -1) {
        if (!argv[outputDirIdx + 1] || argv[outputDirIdx + 1].startsWith('--')) {
            console.error('Error: --output-dir requires a directory argument');
            process.exit(1);
        }
        outputDir = argv[outputDirIdx + 1];
    }

    // Positional args: everything that isn't a flag or the arg after --output-dir
    const skipNext = new Set();
    if (outputDirIdx !== -1) skipNext.add(outputDirIdx + 1);
    const positional = argv.filter((a, i) => !a.startsWith('--') && !skipNext.has(i));

    if (positional.length === 0) {
        console.error('Error: at least one input JSON file is required.');
        process.exit(1);
    }

    // Legacy single-file mode: <input.json> <output-dir>
    // Detected when there are exactly 2 positionals and the second doesn't end in .json
    let inputFiles = positional;
    if (outputDir === null) {
        if (positional.length >= 2 && !positional[positional.length - 1].endsWith('.json')) {
            outputDir = positional[positional.length - 1];
            inputFiles = positional.slice(0, -1);
        } else {
            outputDir = '.';
        }
    }

    // ── Load all input files ───────────────────────────────────────────────────
    const loaded = [];
    for (const filePath of inputFiles) {
        if (!fs.existsSync(filePath)) {
            console.error(`Error: file not found: ${filePath}`);
            process.exit(1);
        }
        let exportData;
        try {
            exportData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`Error: invalid JSON in ${filePath} — ${e.message}`);
            process.exit(1);
        }
        if (!exportData.data || !Array.isArray(exportData.data)) {
            console.error(`Error: expected top-level "data" array in ${filePath}`);
            process.exit(1);
        }
        const kind = exportData.type === 'workflow_collections' ? 'fsr' : 'fas';
        const colCount = exportData.data.length;
        loaded.push({filePath, exportData, kind, colCount});
    }

    // ── Separate entries by format ─────────────────────────────────────────────
    const fasEntries = [];
    const fsrEntries = [];
    const fasFiles = [];
    const fsrFiles = [];
    const fasStructural = {playbookShapes: [], stepShapes: []};
    const fsrStructural = {playbookShapes: [], stepShapes: []};

    for (const {filePath, exportData, kind} of loaded) {
        const entries = collectAllSteps(exportData, path.basename(filePath));
        const shapes = collectStructuralShapes(exportData);
        if (kind === 'fas') {
            fasEntries.push(...entries);
            fasFiles.push(path.basename(filePath));
            fasStructural.playbookShapes.push(...shapes.playbookShapes);
            fasStructural.stepShapes.push(...shapes.stepShapes);
        } else {
            fsrEntries.push(...entries);
            fsrFiles.push(path.basename(filePath));
            fsrStructural.playbookShapes.push(...shapes.playbookShapes);
            fsrStructural.stepShapes.push(...shapes.stepShapes);
        }
    }

    const isMixed = fasEntries.length > 0 && fsrEntries.length > 0;

    const fasIndex = fasEntries.length > 0 ? buildIndex(fasEntries) : null;
    const fsrIndex = fsrEntries.length > 0 ? buildIndex(fsrEntries) : null;

    // ── Ensure output directory ────────────────────────────────────────────────
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
    }

    const written = [];

    // ── Generate schema outputs ────────────────────────────────────────────────
    if (!isMixed) {
        // Single format: original behaviour — one step-schema.ts + schema-report.txt
        const index = fasIndex ?? fsrIndex;
        const kind = fasFiles.length > 0 ? 'playbook_collections' : 'workflow_collections';
        const colCount = loaded.reduce((s, l) => s + l.colCount, 0);
        const fileCount = inputFiles.length;
        const sourceLabel = fileCount === 1
            ? path.basename(inputFiles[0])
            : `${fileCount} files (${(fasFiles.length > 0 ? fasFiles : fsrFiles).join(', ')})`;

        const meta = {sourceLabel, kind, colCount};
        const structural = fasEntries.length > 0 ? fasStructural : fsrStructural;

        const tsContent = generateTypeScriptFile(index, meta, showAllKeys, structural);
        const reportContent = buildSummaryReport(index, meta);

        const tsOut = path.join(outputDir, 'step-schema.ts');
        const reportOut = path.join(outputDir, 'schema-report.txt');

        fs.writeFileSync(tsOut, tsContent, 'utf8');
        fs.writeFileSync(reportOut, reportContent, 'utf8');

        written.push(tsOut, reportOut);

        console.log(reportContent);

    } else {
        // Mixed format: generate per-format schemas + unified summary + comparison

        const fasColCount = loaded.filter(l => l.kind === 'fas').reduce((s, l) => s + l.colCount, 0);
        const fsrColCount = loaded.filter(l => l.kind === 'fsr').reduce((s, l) => s + l.colCount, 0);

        const fasMeta = {
            sourceLabel: fasFiles.length === 1 ? fasFiles[0] : `${fasFiles.length} FAS files`,
            kind: 'playbook_collections',
            colCount: fasColCount,
        };
        const fsrMeta = {
            sourceLabel: fsrFiles.length === 1 ? fsrFiles[0] : `${fsrFiles.length} FSR files`,
            kind: 'workflow_collections',
            colCount: fsrColCount,
        };

        const fasTs = generateTypeScriptFile(fasIndex, fasMeta, showAllKeys, fasStructural);
        const fsrTs = generateTypeScriptFile(fsrIndex, fsrMeta, showAllKeys, fsrStructural);
        const fasReport = buildSummaryReport(fasIndex, fasMeta);
        const fsrReport = buildSummaryReport(fsrIndex, fsrMeta);

        const fasSchemaOut = path.join(outputDir, 'fas-schema.ts');
        const fsrSchemaOut = path.join(outputDir, 'fsr-schema.ts');
        const fasReportOut = path.join(outputDir, 'fas-schema-report.txt');
        const fsrReportOut = path.join(outputDir, 'fsr-schema-report.txt');

        fs.writeFileSync(fasSchemaOut, fasTs, 'utf8');
        fs.writeFileSync(fsrSchemaOut, fsrTs, 'utf8');
        fs.writeFileSync(fasReportOut, fasReport, 'utf8');
        fs.writeFileSync(fsrReportOut, fsrReport, 'utf8');

        written.push(fasSchemaOut, fsrSchemaOut, fasReportOut, fsrReportOut);

        console.log('─── FAS Schema Report ───');
        console.log(fasReport);
        console.log('─── FSR Schema Report ───');
        console.log(fsrReport);

        // Comparison report
        const compReport = buildComparisonReport(fasIndex, fsrIndex, fasFiles, fsrFiles);
        const compReportOut = path.join(outputDir, 'comparison-report.txt');
        fs.writeFileSync(compReportOut, compReport, 'utf8');
        written.push(compReportOut);
        console.log(compReport);
    }

    // ── Outlier report (--outliers) ────────────────────────────────────────────
    if (showOutliers) {
        const outlierParts = [];
        if (fasIndex) outlierParts.push(buildOutlierReport(fasIndex));
        if (fsrIndex && isMixed) {
            // Separate FSR outlier section when mixed
            const fsrOutlier = buildOutlierReport(fsrIndex);
            outlierParts.push('─── FSR Outliers ───\n' + fsrOutlier);
        }
        const outlierContent = outlierParts.join('\n\n');
        const outlierOut = path.join(outputDir, 'outlier-report.txt');
        fs.writeFileSync(outlierOut, outlierContent, 'utf8');
        written.push(outlierOut);
        console.log(outlierContent);
    }

    // ── Converter gap analysis (--check-converter) ────────────────────────────
    if (checkConverter) {
        // Locate converter dir: look next to scripts/
        const scriptsDir = path.dirname(path.resolve(process.argv[1]));
        const projectRoot = path.dirname(scriptsDir);
        const converterDir = path.join(projectRoot, 'converter');

        const gapContent = buildConverterGapReport(fasIndex, fsrIndex, converterDir);
        const gapOut = path.join(outputDir, 'converter-gaps.txt');
        fs.writeFileSync(gapOut, gapContent, 'utf8');
        written.push(gapOut);
        console.log(gapContent);
    }

    // ── Final summary ─────────────────────────────────────────────────────────
    console.log('\nFiles written:');
    for (const f of written) console.log(`  ${f}`);
}

main();
