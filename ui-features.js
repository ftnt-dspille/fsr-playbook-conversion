// ─── UI Features: Validation, Step Status, Diff View ─────────────────────────
// All user-controlled values rendered into the DOM use escapeHtml() or
// textContent assignment — no raw user data is ever written via innerHTML.

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Schema Validation ────────────────────────────────────────────────────────

function validateInput(data, format) {
    const errors = [];
    const warnings = [];

    if (!data.type) errors.push('Missing required top-level field: "type"');

    if (!Array.isArray(data.data)) {
        errors.push('Missing or invalid "data" field — expected an array of collections');
        return { errors, warnings };
    }

    if (data.data.length === 0) {
        warnings.push('The "data" array is empty — no collections to convert');
    }

    const collKey = format === 'fsr' ? 'workflows' : 'playbooks';
    const itemLabel = format === 'fsr' ? 'Workflow' : 'Playbook';

    data.data.forEach((collection, i) => {
        const colLabel = collection.name ? `"${collection.name}"` : `[${i}]`;
        if (!collection.uuid) warnings.push(`Collection ${colLabel} is missing a UUID`);

        if (!Array.isArray(collection[collKey])) {
            errors.push(`Collection ${colLabel} has no "${collKey}" array`);
            return;
        }

        collection[collKey].forEach((item, j) => {
            const lbl = item.name ? `"${item.name}"` : `[${j}]`;
            if (!item.uuid) warnings.push(`${itemLabel} ${lbl} in ${colLabel} is missing a UUID`);
            if (!Array.isArray(item.steps)) warnings.push(`${itemLabel} ${lbl} has no "steps" array`);
        });
    });

    if (format === 'fas' && !Array.isArray(data.versions)) {
        warnings.push('Missing "versions" array — required for manual FAS upload');
    }

    return { errors, warnings };
}

function showValidationResults(errors, warnings) {
    const panel = document.getElementById('validationInfo');

    if (errors.length === 0 && warnings.length === 0) {
        panel.style.display = 'none';
        return;
    }

    panel.textContent = '';

    const header = document.createElement('h3');
    header.style.marginBottom = '12px';

    if (errors.length > 0) {
        header.style.color = 'var(--error)';
        header.textContent = '❌ Validation Errors';
    } else {
        header.style.color = 'var(--warning)';
        header.textContent = '⚠️ Validation Warnings';
    }
    panel.appendChild(header);

    const ul = document.createElement('ul');
    ul.style.cssText = 'list-style:none; padding:0;';

    [...errors.map(e => ({ type: 'Error', text: e, color: 'var(--error)' })),
     ...warnings.map(w => ({ type: 'Warning', text: w, color: 'var(--warning)' }))
    ].forEach(({ type, text, color }) => {
        const li = document.createElement('li');
        li.style.cssText = `color:${color}; padding:5px 0;`;
        const b = document.createElement('strong');
        b.textContent = type + ': ';
        li.appendChild(b);
        li.appendChild(document.createTextNode(text));
        ul.appendChild(li);
    });

    panel.appendChild(ul);
    panel.style.display = 'block';
}

// ─── Step Status Panel ─────────────────────────────────────────────────────────

function makeStepBadge(label, variant) {
    const span = document.createElement('span');
    span.className = `step-badge step-badge-${variant}`;
    span.textContent = label;
    return span;
}

function makeStepTable(columns, rows) {
    const table = document.createElement('table');
    table.className = 'step-status-table';

    const thead = table.createTHead();
    const hr = thead.insertRow();
    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        hr.appendChild(th);
    });

    const tbody = table.createTBody();
    rows.forEach(({ cells, rowClass }) => {
        const tr = tbody.insertRow();
        if (rowClass) tr.className = rowClass;
        cells.forEach(cell => {
            const td = tr.insertCell();
            if (typeof cell === 'string') {
                td.textContent = cell;
            } else {
                td.appendChild(cell);
            }
        });
    });

    return table;
}

function makeDetails(summaryEl, contentEl) {
    const details = document.createElement('details');
    details.style.marginBottom = '8px';
    details.appendChild(summaryEl);
    details.appendChild(contentEl);
    return details;
}

function renderStepStatusPanel(data, direction) {
    const panel = document.getElementById('stepStatusPanel');
    const summary = data._conversionSummary;

    if (!summary) { panel.style.display = 'none'; return; }

    panel.textContent = '';

    if (direction === 'fsr-to-fas') {
        const totalIssues = (summary.totalUnsupportedSteps || 0) +
                            (summary.totalUnknownSteps || 0) +
                            (summary.totalManualStartsConverted || 0);

        if (totalIssues === 0) { panel.style.display = 'none'; return; }

        const header = document.createElement('h3');
        header.style.cssText = 'color:var(--warning); margin-bottom:12px;';
        header.textContent = `⚠️ Step Conversion Status — ${totalIssues} Step${totalIssues !== 1 ? 's' : ''} Require Attention`;
        panel.appendChild(header);

        const meta = document.createElement('p');
        meta.style.cssText = 'color:var(--text-secondary); margin-bottom:16px; font-size:0.9em;';
        meta.textContent = `${summary.totalManualStartsConverted || 0} trigger(s) converted · ${summary.totalUnsupportedSteps || 0} unsupported stub(s) · ${summary.totalUnknownSteps || 0} unknown stub(s)`;
        panel.appendChild(meta);

        // Index per playbook
        const pbIndex = {};
        (summary.playbooksWithUnsupported || []).forEach(pb => {
            pbIndex[pb.uuid] = pbIndex[pb.uuid] || { name: pb.name, rows: [] };
            pb.unsupportedSteps.forEach(s =>
                pbIndex[pb.uuid].rows.push({ name: s.name, badge: 'unsupported', label: s.type || 'Unsupported' }));
        });
        (summary.playbooksWithUnknown || []).forEach(pb => {
            pbIndex[pb.uuid] = pbIndex[pb.uuid] || { name: pb.name, rows: [] };
            pb.unknownSteps.forEach(s =>
                pbIndex[pb.uuid].rows.push({ name: s.name, badge: 'unknown', label: `Unknown (${(s.stepTypeUuid || '').substring(0, 8)}…)` }));
        });
        (summary.playbooksWithManualStarts || []).forEach(pb => {
            pbIndex[pb.uuid] = pbIndex[pb.uuid] || { name: pb.name, rows: [] };
            pb.manualStarts.forEach(s =>
                pbIndex[pb.uuid].rows.push({ name: s.name, badge: 'trigger', label: 'Trigger → Referenced Start' }));
        });

        Object.values(pbIndex).forEach(pb => {
            const sum = document.createElement('summary');
            sum.textContent = `${pb.name} `;
            const cnt = document.createElement('span');
            cnt.style.cssText = 'font-weight:400; color:var(--text-secondary);';
            cnt.textContent = `(${pb.rows.length} step${pb.rows.length !== 1 ? 's' : ''})`;
            sum.appendChild(cnt);

            const table = makeStepTable(['Step', 'Status'], pb.rows.map(r => ({
                cells: [r.name, makeStepBadge(r.label, r.badge)]
            })));

            panel.appendChild(makeDetails(sum, table));
        });

    } else {
        // FAS → FSR
        const total = summary.totalTriggerTypesNormalized || 0;

        if (total === 0) { panel.style.display = 'none'; return; }

        const header = document.createElement('h3');
        header.style.cssText = 'color:var(--warning); margin-bottom:12px;';
        header.textContent = `⚠️ Trigger Types Normalized — ${total} Step${total !== 1 ? 's' : ''} Changed`;
        panel.appendChild(header);

        const meta = document.createElement('p');
        meta.style.cssText = 'color:var(--text-secondary); margin-bottom:16px; font-size:0.9em;';
        meta.textContent = 'These steps had their trigger type replaced with Referenced Start — the only trigger type FSR can import. Original trigger behaviour is lost.';
        panel.appendChild(meta);

        (summary.playbooksWithTriggerChanges || []).forEach(pb => {
            const sum = document.createElement('summary');
            sum.textContent = `${pb.name} `;
            const cnt = document.createElement('span');
            cnt.style.cssText = 'font-weight:400; color:var(--text-secondary);';
            cnt.textContent = `(${pb.triggerChanges.length} step${pb.triggerChanges.length !== 1 ? 's' : ''})`;
            sum.appendChild(cnt);

            const table = makeStepTable(['Step', 'Original Type', 'Result'], pb.triggerChanges.map(c => ({
                cells: [c.name, makeStepBadge(c.fromTypeName, 'trigger'), makeStepBadge(c.toTypeName, 'info')]
            })));

            panel.appendChild(makeDetails(sum, table));
        });
    }

    panel.style.display = 'block';
}

// ─── Diff View ─────────────────────────────────────────────────────────────────

// Myers-style LCS diff: returns array of {type: 'equal'|'added'|'removed', line: string}
function computeLineDiff(aLines, bLines) {
    const m = aLines.length, n = bLines.length;
    // Build LCS table
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
            dp[i][j] = aLines[i] === bLines[j]
                ? dp[i + 1][j + 1] + 1
                : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }
    const result = [];
    let i = 0, j = 0;
    while (i < m || j < n) {
        if (i < m && j < n && aLines[i] === bLines[j]) {
            result.push({ type: 'equal',   line: aLines[i] }); i++; j++;
        } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
            result.push({ type: 'added',   line: bLines[j] }); j++;
        } else {
            result.push({ type: 'removed', line: aLines[i] }); i++;
        }
    }
    return result;
}

function computeConversionDiff(inputJson, outputJson) {
    const aLines = JSON.stringify(JSON.parse(inputJson),  null, 2).split('\n');
    const bLines = JSON.stringify(JSON.parse(outputJson), null, 2).split('\n');
    return computeLineDiff(aLines, bLines);
}

function renderDiffPanel(hunks) {
    const panel = document.getElementById('diffPanel');
    panel.textContent = '';

    const added   = hunks.filter(h => h.type === 'added').length;
    const removed = hunks.filter(h => h.type === 'removed').length;

    const header = document.createElement('h3');
    header.style.marginBottom = '12px';

    if (added === 0 && removed === 0) {
        header.style.color = 'var(--success)';
        header.textContent = '✅ Diff — No Changes';
        panel.appendChild(header);
        const msg = document.createElement('p');
        msg.style.color = 'var(--text-secondary)';
        msg.textContent = 'Output is identical to input.';
        panel.appendChild(msg);
        panel.style.display = 'block';
        return;
    }

    header.style.color = 'var(--accent-primary)';
    header.textContent = '🔀 Conversion Diff';
    panel.appendChild(header);

    const meta = document.createElement('p');
    meta.style.cssText = 'color:var(--text-secondary); margin-bottom:12px; font-size:0.9em;';
    meta.textContent = `+${added} / −${removed} lines`;
    panel.appendChild(meta);

    const pre = document.createElement('pre');
    pre.className = 'diff-unified';

    // Render with context: show 3 equal lines around each changed region
    const CONTEXT = 3;
    const changed = new Set(hunks.map((h, i) => h.type !== 'equal' ? i : -1).filter(i => i >= 0));
    const visible = new Set();
    changed.forEach(ci => {
        for (let k = Math.max(0, ci - CONTEXT); k <= Math.min(hunks.length - 1, ci + CONTEXT); k++) {
            visible.add(k);
        }
    });

    let lastVisible = -1;
    hunks.forEach((h, i) => {
        if (!visible.has(i)) { lastVisible = -1; return; }
        if (lastVisible !== -1 && i > lastVisible + 1) {
            const sep = document.createElement('div');
            sep.className = 'diff-hunk-sep';
            sep.textContent = '…';
            pre.appendChild(sep);
        }
        const row = document.createElement('div');
        row.className = 'diff-line diff-line-' + h.type;
        const gutter = h.type === 'added' ? '+' : h.type === 'removed' ? '−' : ' ';
        row.textContent = gutter + ' ' + h.line;
        pre.appendChild(row);
        lastVisible = i;
    });

    panel.appendChild(pre);
    panel.style.display = 'block';
}

// ─── FAS→FSR Warnings in Conversion Info ──────────────────────────────────────

function buildFasToFsrWarnings(data) {
    const summary = data._conversionSummary;
    const frag = document.createDocumentFragment();

    if (!summary || !summary.totalTriggerTypesNormalized) return frag;

    const box = document.createElement('div');
    box.className = 'warning-box';
    box.style.cssText = 'border-color:var(--warning); margin-bottom:20px;';

    const title = document.createElement('h3');
    title.style.cssText = 'color:var(--warning); margin-bottom:10px;';
    title.textContent = `⚠️ Trigger Types Cannot Be Preserved (${summary.totalTriggerTypesNormalized} step${summary.totalTriggerTypesNormalized !== 1 ? 's' : ''})`;
    box.appendChild(title);

    const intro = document.createElement('p');
    intro.style.marginBottom = '12px';
    intro.textContent = 'FSR can only import playbooks with Referenced Start triggers. The following trigger types were normalized and their original behaviour is lost:';
    box.appendChild(intro);

    const byType = summary.normalizedByType || {};
    if (Object.keys(byType).length > 0) {
        const ul = document.createElement('ul');
        ul.style.cssText = 'margin-left:20px; margin-top:8px;';
        Object.entries(byType).forEach(([typeName, count]) => {
            const li = document.createElement('li');
            li.style.padding = '3px 0';
            const b = document.createElement('strong');
            b.textContent = typeName;
            li.appendChild(b);
            li.appendChild(document.createTextNode(` — ${count} step${count !== 1 ? 's' : ''} → Referenced Start`));
            ul.appendChild(li);
        });
        box.appendChild(ul);
    }

    const note = document.createElement('div');
    note.style.cssText = 'margin-top:12px; padding:10px; background:rgba(239,68,68,0.08); border-left:3px solid var(--error); border-radius:6px;';
    const noteText = document.createElement('p');
    noteText.textContent = 'To restore trigger behaviour after import, open each affected playbook in FSR and manually set the appropriate start step type (Manual, On Create, On Update, or API Endpoint).';
    note.appendChild(noteText);
    box.appendChild(note);

    frag.appendChild(box);
    return frag;
}
