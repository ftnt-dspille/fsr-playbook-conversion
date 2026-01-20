// Conversion functions
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function extractUUID(ref) {
    if (!ref) return null;
    if (typeof ref === 'string' && ref.includes('/')) {
        const parts = ref.split('/');
        return parts[parts.length - 1];
    }
    return ref;
}

function getPriority(priorityRef) {
    if (!priorityRef) return 'medium';
    if (typeof priorityRef === 'string' && priorityRef.includes('picklists')) {
        return 'medium';
    }
    return priorityRef;
}

function getStepName(stepRef, steps) {
    const uuid = extractUUID(stepRef);
    const step = steps?.find(s => s.uuid === uuid);
    return step ? step.name : 'Unknown';
}

// Define all FSR start step types that must be converted to referenced starts
const FSR_START_STEP_TYPES = {
    // Manual Start (UI button trigger)
    'f414d039-bb0d-4e59-9c39-a8f1e880b18a': 'Manual Start',
    // On Create (triggered when record created)
    'ea155646-3821-4542-9702-b246da430a8d': 'On Create',
    // On Update (triggered when record updated)
    '9300bf69-5063-486d-b3a6-47eb9da24872': 'On Update',
    // API Start (triggered via API endpoint)
    'df26c7a2-4166-4ca5-91e5-548e24c01b5f': 'API Endpoint'
};

// Define unsupported step types that need to be converted to Set Variable steps
const UNSUPPORTED_STEP_TYPES = {
    // Create Record
    '2597053c-e718-44b4-8394-4d40fe26d357': 'Create Record',
    // Update Record
    'b593663d-7d13-40ce-a3a3-96dece928722': 'Update Record',
    // Find Record
    'b593663d-7d13-40ce-a3a3-96dece928770': 'Find Record',
    // Code Snippet
    '1fdd14cc-d6b4-4335-a3af-ab49c8ed2fd8': 'Code Snippet',
    // Ingest Bulk Feed
    '7b221880-716b-4726-a2ca-5e568d330b3e': 'Ingest Bulk Feed'
};

// Define known supported step types in FAS
const SUPPORTED_STEP_TYPES = {
    // Start/Trigger Steps (FAS referenced only)
    'b348f017-9a94-471f-87f8-ce88b6a7ad62': 'Start/Trigger (FAS Referenced)',
    // Set Variables / Configuration
    '04d0cf46-b6a8-42c4-8683-60a7eaa69e8f': 'Set Variables',
    // Decision
    '12254cf5-5db7-4b1a-8cb1-3af081924b28': 'Decision',
    // Reference Playbook
    '74932bdc-b8b6-4d24-88c4-1a4dfbc524f3': 'Reference Playbook',
    // Wait
    '6832e556-b9c7-497a-babe-feda3bd27dbf': 'Wait',
    // Manual Input / User Input
    'fc04082a-d7dc-4299-96fb-6837b1baa0fe': 'Manual Input',
    // Connector
    '0bfed618-0316-11e7-93ae-92361f002671': 'Connector',
    // Utility / No-Op
    '0109f35d-090b-4a2b-bd8a-94cbc3508562': 'Utility/No-Op',
    // Email
    '0bfed618-0316-11e7-93ae-92361f002675': 'Email',
    // Attachment
    '0bfed618-0316-11e7-93ae-92361f002674': 'Attachment'
};

// Set Variable step type UUID for FAS
const SET_VARIABLE_STEP_TYPE = '04d0cf46-b6a8-42c4-8683-60a7eaa69e8f';

// FAS Start/Trigger step type (referenced only)
const FAS_START_STEP_TYPE = 'b348f017-9a94-471f-87f8-ce88b6a7ad62';

function isUnsupportedStepType(stepTypeUuid) {
    return UNSUPPORTED_STEP_TYPES.hasOwnProperty(stepTypeUuid);
}

function isSupportedStepType(stepTypeUuid) {
    return SUPPORTED_STEP_TYPES.hasOwnProperty(stepTypeUuid);
}

function isFSRStartStep(stepTypeUuid) {
    return FSR_START_STEP_TYPES.hasOwnProperty(stepTypeUuid);
}

function isUnknownStepType(stepTypeUuid) {
    return !isUnsupportedStepType(stepTypeUuid) &&
        !isSupportedStepType(stepTypeUuid) &&
        !isFSRStartStep(stepTypeUuid);
}
;