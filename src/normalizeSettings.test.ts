import { describe, expect, it } from 'vitest';
import { defaultSettings } from './Constants';
import { normalizeSettings } from './normalizeSettings';

describe('normalizeSettings', () => {
    it('returns the defaults for empty or invalid input', () => {
        expect(normalizeSettings(undefined)).toEqual(defaultSettings);
        expect(normalizeSettings(null)).toEqual(defaultSettings);
        expect(normalizeSettings('nope')).toEqual(defaultSettings);
        expect(normalizeSettings([])).toEqual(defaultSettings);
    });

    it('keeps saved values and fills missing top-level keys', () => {
        const result = normalizeSettings({ RefreshRate: 30, DefaultClock: 'flipclock' });
        expect(result.RefreshRate).toBe(30);
        expect(result.DefaultClock).toBe('flipclock');
        expect(result.TimerSettings).toEqual(defaultSettings.TimerSettings);
    });

    it('fills missing keys inside a clock settings object', () => {
        const result = normalizeSettings({ TimerSettings: { backgroundColor: '#111111' } });
        expect(result.TimerSettings).toEqual({ ...defaultSettings.TimerSettings, backgroundColor: '#111111' });
    });

    it('ignores clock settings that are not objects', () => {
        const result = normalizeSettings({ DigitalClockDefaultSettings: 'broken' });
        expect(result.DigitalClockDefaultSettings).toEqual(defaultSettings.DigitalClockDefaultSettings);
    });

    it('fills partial schedule clock settings from the defaults of that clock type', () => {
        const result = normalizeSettings({
            Schedule: [ { fromTime: '08:00', toTime: '09:00', clockType: 'clockClock24', clockSettings: { foreGroundColor: '#123456' } } ]
        });
        expect(result.Schedule[ 0 ].clockSettings).toEqual({
            ...defaultSettings.ClockClock24DefaultSettings,
            foreGroundColor: '#123456'
        });
    });

    it('leaves schedule rows without clock settings untouched so the form can flag them', () => {
        const row = { fromTime: '08:00', toTime: '09:00', clockType: 'digital' };
        expect(normalizeSettings({ Schedule: [ row ] }).Schedule[ 0 ]).toEqual(row);
    });

    it('drops invalid schedule rows and tolerates a non-array schedule', () => {
        expect(normalizeSettings({ Schedule: [ null, 5 ] }).Schedule).toEqual([]);
        expect(normalizeSettings({ Schedule: 'x' }).Schedule).toEqual(defaultSettings.Schedule);
    });
});
