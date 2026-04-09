// Unit tests for pure helper functions in constants.js, fsr-to-fas.js, fas-to-fsr.js.
// All functions are loaded as globals via tests/setup.js.

describe('extractUUID', () => {
    it('extracts trailing UUID from an IRI string', () => {
        expect(extractUUID('/api/3/people/abc-123')).toBe('abc-123');
        expect(extractUUID('/api/3/workflow_steps/step-uuid')).toBe('step-uuid');
    });

    it('returns the value as-is when there is no slash', () => {
        expect(extractUUID('plain-uuid')).toBe('plain-uuid');
    });

    it('returns null for falsy input', () => {
        expect(extractUUID(null)).toBeNull();
        expect(extractUUID('')).toBeNull();
        expect(extractUUID(undefined)).toBeNull();
    });
});

describe('getPriority', () => {
    it('returns "medium" for a picklist IRI', () => {
        expect(getPriority('/api/3/picklists/2b563c61-ae2c-41c0-a85a-c9709585e3f2')).toBe('medium');
    });

    it('returns "medium" for falsy input', () => {
        expect(getPriority(null)).toBe('medium');
        expect(getPriority(undefined)).toBe('medium');
    });

    it('returns the value as-is when it is not a picklist IRI', () => {
        expect(getPriority('high')).toBe('high');
    });
});

describe('isUnsupportedStepType / isSupportedStepType / isFSRStartStep / isUnknownStepType', () => {
    const CREATE_RECORD  = '2597053c-e718-44b4-8394-4d40fe26d357';
    const SET_VAR        = '04d0cf46-b6a8-42c4-8683-60a7eaa69e8f';
    const MANUAL_START   = 'f414d039-bb0d-4e59-9c39-a8f1e880b18a';
    const TOTALLY_UNKNOWN = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    it('identifies unsupported step types', () => {
        expect(isUnsupportedStepType(CREATE_RECORD)).toBe(true);
        expect(isUnsupportedStepType(SET_VAR)).toBe(false);
    });

    it('identifies supported step types', () => {
        expect(isSupportedStepType(SET_VAR)).toBe(true);
        expect(isSupportedStepType(CREATE_RECORD)).toBe(false);
    });

    it('identifies FSR start steps', () => {
        expect(isFSRStartStep(MANUAL_START)).toBe(true);
        expect(isFSRStartStep(SET_VAR)).toBe(false);
    });

    it('marks a UUID in none of the lists as unknown', () => {
        expect(isUnknownStepType(TOTALLY_UNKNOWN)).toBe(true);
        expect(isUnknownStepType(SET_VAR)).toBe(false);
        expect(isUnknownStepType(CREATE_RECORD)).toBe(false);
        expect(isUnknownStepType(MANUAL_START)).toBe(false);
    });
});

describe('convertUnixToISO (fsr-to-fas helper)', () => {
    it('converts a Unix timestamp in seconds to ISO string', () => {
        const iso = convertUnixToISO(1700000000);
        expect(iso).toBe(new Date(1700000000 * 1000).toISOString());
    });

    it('converts a Unix timestamp in milliseconds to ISO string', () => {
        const ms = 1700000000000;
        const iso = convertUnixToISO(ms);
        expect(iso).toBe(new Date(ms).toISOString());
    });

    it('returns an ISO string unchanged when already ISO', () => {
        const input = '2023-11-14T22:13:20.000Z';
        expect(convertUnixToISO(input)).toBe(input);
    });

    it('returns current time string for null/undefined', () => {
        const before = Date.now();
        const iso = convertUnixToISO(null);
        const after = Date.now();
        const t = new Date(iso).getTime();
        expect(t).toBeGreaterThanOrEqual(before);
        expect(t).toBeLessThanOrEqual(after);
    });
});

describe('convertDateToUnix (fas-to-fsr helper)', () => {
    it('converts an ISO string to a Unix timestamp in seconds', () => {
        const ts = convertDateToUnix('2023-11-14T22:13:20.000Z');
        expect(ts).toBe(1700000000);
    });

    it('passes through a seconds timestamp unchanged', () => {
        expect(convertDateToUnix(1700000000)).toBe(1700000000);
    });

    it('converts a millisecond timestamp to seconds', () => {
        expect(convertDateToUnix(1700000000000)).toBe(1700000000);
    });

    it('returns current time for null/undefined', () => {
        const before = Math.floor(Date.now() / 1000);
        const ts = convertDateToUnix(null);
        const after = Math.floor(Date.now() / 1000);
        expect(ts).toBeGreaterThanOrEqual(before);
        expect(ts).toBeLessThanOrEqual(after);
    });

    it('returns current time for an invalid date string', () => {
        const before = Math.floor(Date.now() / 1000);
        const ts = convertDateToUnix('not-a-date');
        const after = Math.floor(Date.now() / 1000);
        expect(ts).toBeGreaterThanOrEqual(before);
        expect(ts).toBeLessThanOrEqual(after);
    });
});
