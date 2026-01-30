let currentDirection = 'fsr-to-fas';

// UI Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const statusMsg = document.getElementById('statusMsg');
const statsGrid = document.getElementById('statsGrid');
const inputBadge = document.getElementById('inputBadge');
const outputBadge = document.getElementById('outputBadge');
const convertBtnText = document.getElementById('convertBtnText');
const appVersion = document.getElementById('appVersion');

async function loadAppVersion() {
    if (!appVersion) return;

    try {
        const response = await fetch('VERSION', {cache: 'no-store'});
        if (!response.ok) throw new Error('VERSION not found');
        const versionText = (await response.text()).trim();
        appVersion.textContent = `Version ${versionText || getConverterVersion()}`;
    } catch (error) {
        appVersion.textContent = `Version ${getConverterVersion()}`;
    }
}

loadAppVersion();

// Direction selection
function setDirection(direction) {
    currentDirection = direction;

    document.getElementById('fsrToFasBtn').classList.toggle('active', direction === 'fsr-to-fas');
    document.getElementById('fasToFsrBtn').classList.toggle('active', direction === 'fas-to-fsr');

    if (direction === 'fsr-to-fas') {
        inputBadge.textContent = 'FSR';
        inputBadge.className = 'badge badge-fsr';
        outputBadge.textContent = 'FAS';
        outputBadge.className = 'badge badge-fas';
        convertBtnText.textContent = 'Convert FSR → FAS';
    } else {
        inputBadge.textContent = 'FAS';
        inputBadge.className = 'badge badge-fas';
        outputBadge.textContent = 'FSR';
        outputBadge.className = 'badge badge-fsr';
        convertBtnText.textContent = 'Convert FAS → FSR';
    }

    // Don't clear if we're auto-detecting, only on manual change
    const hasContent = inputText.value.trim().length > 0;
    if (!hasContent) {
        clearAll();
    } else {
        // Just hide the detection banner on manual switch
        document.getElementById('detectionBanner').style.display = 'none';
    }
}

// File handling
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
        loadFile(file);
    } else {
        showStatus('Please drop a valid JSON file', 'error');
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) loadFile(file);
});

function loadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            const data = JSON.parse(content);
            inputText.value = content;

            // Auto-detect format
            const detectedInfo = detectFormat(data);
            if (detectedInfo) {
                showStatus(`✅ File loaded! Detected format: ${detectedInfo.format.toUpperCase()}`, 'success');
                autoSetDirection(detectedInfo);
            } else {
                showStatus('⚠️ File loaded but format could not be detected', 'info');
            }
        } catch (error) {
            showStatus('Invalid JSON file: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// Auto-detect format on paste/typing
inputText.addEventListener('input', debounce(() => {
    try {
        const content = inputText.value.trim();
        if (!content) return;

        const data = JSON.parse(content);
        const detectedInfo = detectFormat(data);
        if (detectedInfo) {
            autoSetDirection(detectedInfo);
        }
    } catch (error) {
        // Not valid JSON yet, ignore
    }
}, 500));

function detectFormat(data) {
    if (!data || !data.type) return null;

    const details = {
        format: null,
        collections: 0,
        items: 0,
        hasVersions: false
    };

    if (data.type === 'workflow_collections') {
        details.format = 'fsr';
        details.collections = data.data?.length || 0;
        data.data?.forEach(collection => {
            details.items += collection.workflows?.length || 0;
        });
    } else if (data.type === 'playbook_collections') {
        details.format = 'fas';
        details.collections = data.data?.length || 0;
        details.hasVersions = Array.isArray(data.versions) && data.versions.length > 0;
        data.data?.forEach(collection => {
            details.items += collection.playbooks?.length || 0;
        });
    }

    return details.format ? details : null;
}

function autoSetDirection(detectedInfo) {
    const detectionBanner = document.getElementById('detectionBanner');
    const detectionText = document.getElementById('detectionText');

    if (detectedInfo.format === 'fsr') {
        setDirection('fsr-to-fas');
        showFormatDetection('FSR', 'FAS');
        detectionText.innerHTML = `
                <div style="display: grid; gap: 8px;">
                    <div>Detected <strong style="color: var(--error);">FSR (FortiSOAR)</strong> format</div>
                    <div style="font-size: 0.9em;">
                        • Type: <code style="background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px;">workflow_collections</code><br>
                        • Collections: <strong>${detectedInfo.collections}</strong><br>
                        • Workflows: <strong>${detectedInfo.items}</strong><br>
                        • Auto-selected: <strong style="color: var(--accent-primary);">FSR → FAS</strong>
                    </div>
                </div>
            `;
        detectionBanner.style.display = 'block';
    } else if (detectedInfo.format === 'fas') {
        setDirection('fas-to-fsr');
        showFormatDetection('FAS', 'FSR');
        detectionText.innerHTML = `
                <div style="display: grid; gap: 8px;">
                    <div>Detected <strong style="color: var(--success);">FAS (FortiSOAR Cloud)</strong> format</div>
                    <div style="font-size: 0.9em;">
                        • Type: <code style="background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px;">playbook_collections</code><br>
                        • Collections: <strong>${detectedInfo.collections}</strong><br>
                        • Playbooks: <strong>${detectedInfo.items}</strong><br>
                        • Versions: <strong>${detectedInfo.hasVersions ? '✓ Present' : '✗ Missing'}</strong><br>
                        • Auto-selected: <strong style="color: var(--accent-primary);">FAS → FSR</strong>
                    </div>
                </div>
            `;
        detectionBanner.style.display = 'block';
    }
}

function showFormatDetection(inputFormat, outputFormat) {
    const badge = document.createElement('div');
    badge.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: 600;
            box-shadow: 0 10px 30px rgba(0, 217, 255, 0.3);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;
    badge.innerHTML = `🔍 Detected: ${inputFormat} → ${outputFormat}`;
    document.body.appendChild(badge);

    setTimeout(() => {
        badge.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => badge.remove(), 300);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Convert button
convertBtn.addEventListener('click', () => {
    try {
        const input = inputText.value.trim();
        if (!input) {
            showStatus('Please provide input JSON', 'error');
            return;
        }

        let result;
        if (currentDirection === 'fsr-to-fas') {
            result = convertFSRtoFAS(input);
        } else {
            result = convertFAStoFSR(input);
        }

        const output = JSON.stringify(result, null, 2);
        outputText.value = output;

        downloadBtn.disabled = false;
        copyBtn.disabled = false;

        updateStats(result, currentDirection);
        showConversionInfo(result, currentDirection);
        showStatus('✅ Conversion successful!', 'success');
    } catch (error) {
        showStatus('❌ Conversion error: ' + error.message, 'error');
        console.error(error);
    }
});

// Download button
downloadBtn.addEventListener('click', () => {
    const content = outputText.value;
    const blob = new Blob([content], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const prefix = currentDirection === 'fsr-to-fas' ? 'FAS' : 'FSR';
    a.download = `${prefix}_Playbook_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus('📥 File downloaded!', 'success');
});

// Copy button
copyBtn.addEventListener('click', () => {
    outputText.select();
    document.execCommand('copy');
    showStatus('📋 Copied to clipboard!', 'success');
});

// Clear button
clearBtn.addEventListener('click', clearAll);

function clearAll() {
    inputText.value = '';
    outputText.value = '';
    downloadBtn.disabled = true;
    copyBtn.disabled = true;
    statsGrid.style.display = 'none';
    document.getElementById('conversionInfo').style.display = 'none';
    document.getElementById('validationInfo').style.display = 'none';
    document.getElementById('detectionBanner').style.display = 'none';
    fileInput.value = '';
    hideStatus();
}

function showStatus(message, type) {
    statusMsg.textContent = message;
    statusMsg.className = `status status-${type}`;
    statusMsg.style.display = 'block';

    if (type === 'success' || type === 'info') {
        setTimeout(hideStatus, 5000);
    }
}

function hideStatus() {
    statusMsg.style.display = 'none';
}

function updateStats(data, direction) {
    const collections = data.data?.length || 0;
    let playbooks = 0, steps = 0, routes = 0;

    data.data?.forEach(collection => {
        const items = direction === 'fsr-to-fas' ? collection.playbooks : collection.workflows;
        if (items) {
            playbooks += items.length;
            items.forEach(item => {
                steps += item.steps?.length || 0;
                routes += item.routes?.length || 0;
            });
        }
    });

    document.getElementById('statCollections').textContent = collections;
    document.getElementById('statPlaybooks').textContent = playbooks;
    document.getElementById('statSteps').textContent = steps;
    document.getElementById('statRoutes').textContent = routes;
    statsGrid.style.display = 'grid';
}

function showConversionInfo(data, direction) {
    const infoPanel = document.getElementById('conversionInfo');

    if (direction === 'fsr-to-fas') {
        let manualStartInfo = '';
        let unsupportedWarning = '';
        let unknownWarning = '';

        // Handle manual start conversions (informational, not a warning)
        if (data._conversionSummary && data._conversionSummary.totalManualStartsConverted > 0) {
            const summary = data._conversionSummary;
            const playbookDetails = summary.playbooksWithManualStarts
                .map(pb => {
                    const steps = pb.manualStarts
                        .map(s => {
                            const noteMatch = s.note ? s.note.match(/^(.*?) converted to/) : null;
                            const startType = noteMatch ? noteMatch[1] : 'Start';
                            return `<li><strong>${s.name}</strong> (${startType})</li>`;
                        })
                        .join('');
                    return `
                            <div style="margin-bottom: 10px;">
                                <strong style="color: var(--accent-primary);">📋 ${pb.name}</strong>
                                <ul style="margin-left: 20px; margin-top: 5px;">
                                    ${steps}
                                </ul>
                            </div>
                        `;
                })
                .join('');

            manualStartInfo = `
                    <div class="warning-box" style="border-color: var(--accent-primary); background: rgba(0, 217, 255, 0.1);">
                        <h3 style="color: var(--accent-primary); margin-bottom: 10px;">ℹ️ FSR Start Steps Converted to Referenced Start</h3>
                        <p style="margin-bottom: 15px;">
                            <strong>${summary.totalManualStartsConverted}</strong> FSR start step(s) have been converted to referenced start steps.
                            <strong>FAS only supports referenced playbooks</strong> (called by other playbooks or API), not FSR-style triggers.
                        </p>
                        <div style="margin: 15px 0; padding: 10px; background: var(--bg-tertiary); border-radius: 6px;">
                            <strong>FSR Start Types Converted:</strong>
                            <ul style="margin-left: 20px; margin-top: 5px;">
                                <li><strong>Manual Start</strong> - UI button triggers removed</li>
                                <li><strong>On Create</strong> - Record creation triggers removed</li>
                                <li><strong>On Update</strong> - Record update triggers removed</li>
                                <li><strong>API Endpoint</strong> - Custom API routes removed</li>
                            </ul>
                        </div>
                        <div style="margin: 15px 0; padding: 10px; background: var(--bg-tertiary); border-radius: 6px;">
                            <strong>What changed:</strong>
                            <ul style="margin-left: 20px; margin-top: 5px;">
                                <li>Removed: <code>route</code>, <code>resources</code>, <code>fieldbasedtrigger</code>, <code>authentication_methods</code></li>
                                <li>Added: <code>__triggerLimit</code>, <code>triggerOnSource</code></li>
                                <li>Original start configuration preserved in <code>_originalStartStep</code></li>
                                <li>Step type changed to: <code>b348f017-9a94-471f-87f8-ce88b6a7ad62</code> (Referenced Start)</li>
                            </ul>
                        </div>
                        <details style="margin-top: 15px;">
                            <summary style="cursor: pointer; font-weight: 600;">View converted playbooks</summary>
                            <div style="margin-top: 10px;">
                                ${playbookDetails}
                            </div>
                        </details>
                        <div style="margin-top: 15px; padding: 10px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid var(--error); border-radius: 6px;">
                            <strong style="color: var(--error);">⚠️ Important:</strong> These playbooks can no longer be triggered by:
                            <ul style="margin-left: 20px; margin-top: 5px;">
                                <li>Manual UI buttons in FortiSOAR</li>
                                <li>Record create/update events</li>
                                <li>Custom API endpoints</li>
                            </ul>
                            <strong>They must now be called by:</strong>
                            <ul style="margin-left: 20px; margin-top: 5px;">
                                <li>Other playbooks (via Reference Playbook step)</li>
                                <li>FAS API (programmatic execution)</li>
                            </ul>
                        </div>
                    </div>
                `;
        }

        // Handle unknown step types (more critical)
        if (data._conversionSummary && data._conversionSummary.totalUnknownSteps > 0) {
            const summary = data._conversionSummary;
            const stepsByType = Object.entries(summary.unknownStepTypes)
                .map(([uuid, info]) => `<li>${uuid}: ${info.count} step(s) - Examples: ${info.examples.slice(0, 3).join(', ')}</li>`)
                .join('');

            const playbookDetails = summary.playbooksWithUnknown
                .map(pb => {
                    const steps = pb.unknownSteps
                        .map(s => `<li><strong>${s.name}</strong> (UUID: ${s.stepTypeUuid})</li>`)
                        .join('');
                    return `
                            <div style="margin-bottom: 10px;">
                                <strong style="color: var(--error);">📋 ${pb.name}</strong>
                                <ul style="margin-left: 20px; margin-top: 5px;">
                                    ${steps}
                                </ul>
                            </div>
                        `;
                })
                .join('');

            unknownWarning = `
                    <div class="warning-box" style="border-color: var(--error); background: rgba(239, 68, 68, 0.1);">
                        <h3 style="color: var(--error); margin-bottom: 10px;">🚨 CRITICAL: Unknown Step Types Detected</h3>
                        <p style="margin-bottom: 15px;">
                            <strong>${summary.totalUnknownSteps}</strong> step(s) with unrecognized step types were found.
                            These may be new FSR step types, custom steps, or errors. They have been converted to Set Variable
                            steps with "UNKNOWN:" prefix. <strong>Manual verification required before importing to FAS.</strong>
                        </p>
                        <details style="margin-top: 15px;">
                            <summary style="cursor: pointer; font-weight: 600; color: var(--error);">⚠️ View unknown step types</summary>
                            <ul style="margin-top: 10px; padding-left: 20px;">
                                ${stepsByType}
                            </ul>
                        </details>
                        <details style="margin-top: 15px;">
                            <summary style="cursor: pointer; font-weight: 600; color: var(--error);">⚠️ View affected playbooks</summary>
                            <div style="margin-top: 10px;">
                                ${playbookDetails}
                            </div>
                        </details>
                        <div style="margin-top: 15px; padding: 10px; background: var(--bg-tertiary); border-radius: 6px;">
                            <strong>Action Required:</strong>
                            <ol style="margin-left: 20px; margin-top: 5px;">
                                <li>Check the original FSR playbook to verify these step types</li>
                                <li>Research if these step types are supported in FAS</li>
                                <li>If supported: Update the converter's SUPPORTED_STEP_TYPES list</li>
                                <li>If unsupported: Update the converter's UNSUPPORTED_STEP_TYPES list</li>
                                <li>If in doubt: Contact FortiSOAR support before importing</li>
                            </ol>
                        </div>
                    </div>
                `;
        }

        // Handle known unsupported step types
        if (data._conversionSummary && data._conversionSummary.totalUnsupportedSteps > 0) {
            const summary = data._conversionSummary;
            const stepsByType = Object.entries(summary.unsupportedByType)
                .map(([type, count]) => `<li>${type}: ${count} step(s)</li>`)
                .join('');

            const playbookDetails = summary.playbooksWithUnsupported
                .map(pb => {
                    const steps = pb.unsupportedSteps
                        .map(s => `<li><strong>${s.name}</strong> (${s.type})</li>`)
                        .join('');
                    return `
                            <div style="margin-bottom: 10px;">
                                <strong style="color: var(--warning);">📋 ${pb.name}</strong>
                                <ul style="margin-left: 20px; margin-top: 5px;">
                                    ${steps}
                                </ul>
                            </div>
                        `;
                })
                .join('');

            unsupportedWarning = `
                    <div class="warning-box">
                        <h3 style="color: var(--warning); margin-bottom: 10px;">⚠️ Unsupported Steps Converted</h3>
                        <p style="margin-bottom: 15px;">
                            <strong>${summary.totalUnsupportedSteps}</strong> step(s) were not supported in FAS and have been converted to
                            Set Variable steps with "UNSUPPORTED:" prefix. Original step data is preserved in the <code>_tmp</code> variable.
                        </p>
                        <details style="margin-top: 15px;">
                            <summary style="cursor: pointer; font-weight: 600;">View unsupported steps by type</summary>
                            <ul style="margin-top: 10px; padding-left: 20px;">
                                ${stepsByType}
                            </ul>
                        </details>
                        <details style="margin-top: 15px;">
                            <summary style="cursor: pointer; font-weight: 600;">View affected playbooks</summary>
                            <div style="margin-top: 10px;">
                                ${playbookDetails}
                            </div>
                        </details>
                    </div>
                `;
        }

        infoPanel.innerHTML = `
                ${manualStartInfo}
                ${unknownWarning}
                ${unsupportedWarning}
                <h3>🔍 Conversion Details</h3>
                <ul>
                    <li>Changed type: "workflow_collections" → "playbook_collections"</li>
                    <li>Renamed: "workflows" → "playbooks"</li>
                    <li>Updated API paths: /api/3/ → /api/workflow/</li>
                    <li>Converted timestamps to ISO 8601 format</li>
                    <li>Added collection references to playbooks</li>
                    <li>Created versions array (${data.versions?.length || 0} entries)</li>
                    <li>Removed @context fields</li>
                    <li>Converted manual start steps to referenced starts (FAS requirement)</li>
                </ul>
                <details>
                    <summary>About the versions array</summary>
                    <div class="detail-content">
                        <p>The versions array is <strong>required for manual upload</strong> in FAS. It contains:</p>
                        <ul style="margin-top: 10px;">
                            <li>Version metadata (uuid, name, dates)</li>
                            <li>Simplified playbook structure in 'json' field</li>
                            <li>Steps with integer coordinates (not strings)</li>
                            <li>Minimal route structure</li>
                        </ul>
                    </div>
                </details>
                <details>
                    <summary>About unsupported steps</summary>
                    <div class="detail-content">
                        <p><strong>The following step types are not supported in FAS:</strong></p>
                        <ul style="margin-top: 10px;">
                            <li><strong>Create Record</strong> - Creates new records in modules</li>
                            <li><strong>Update Record</strong> - Updates existing records</li>
                            <li><strong>Find Record</strong> - Queries and retrieves records</li>
                            <li><strong>Code Snippet</strong> - Executes custom Python code</li>
                            <li><strong>Ingest Bulk Feed</strong> - Bulk data ingestion</li>
                        </ul>
                        <p style="margin-top: 10px;">
                            These steps have been converted to Set Variable steps with the original configuration preserved
                            in the <code>arguments._tmp</code> field, allowing you to review and manually recreate the functionality.
                        </p>
                    </div>
                </details>
                <details>
                    <summary>About unknown step types</summary>
                    <div class="detail-content">
                        <p><strong>Unknown step types</strong> are step types that the converter doesn't recognize. This could mean:</p>
                        <ul style="margin-top: 10px;">
                            <li>New FSR step types added after this converter was created</li>
                            <li>Custom or plugin-based step types</li>
                            <li>Corrupted or invalid step type UUIDs</li>
                        </ul>
                        <p style="margin-top: 10px;">
                            <strong>These require investigation before importing to FAS.</strong> Check the original FSR playbook
                            to understand what these steps do, then determine if they're supported in FAS.
                        </p>
                    </div>
                </details>
            `;
    } else {
        infoPanel.innerHTML = `
                <h3>🔍 Conversion Details</h3>
                <ul>
                    <li>Changed type: "playbook_collections" → "workflow_collections"</li>
                    <li>Renamed: "playbooks" → "workflows"</li>
                    <li>Updated API paths: /api/workflow/ → /api/3/</li>
                    <li>Converted timestamps to Unix format</li>
                    <li>Removed collection object references</li>
                    <li>Removed versions array</li>
                    <li>Added @context fields</li>
                    <li><strong>Adjusted step positions for FSR canvas</strong></li>
                </ul>
                <details>
                    <summary>About position adjustment</summary>
                    <div class="detail-content">
                        <p>FAS and FSR use different coordinate systems. This converter automatically:</p>
                        <ul style="margin-top: 10px;">
                            <li>Calculates minimum step positions</li>
                            <li>Applies offset to ensure visibility (minimum 30px from top, 300px from left)</li>
                            <li>Maintains relative positioning between steps</li>
                            <li>Prevents steps from being hidden behind UI elements</li>
                        </ul>
                    </div>
                </details>
            `;
    }

    infoPanel.style.display = 'block';
}
