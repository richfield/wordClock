import { describe, expect, it } from 'vitest';
import { findActiveSchedule, isTimeInRange, parseTime, secondsUntil, validateSchedule } from './schedule';
import { ClockSettings, ScheduleEntry } from './types';

const at = (time: string, seconds = 0) => {
    const [ hours, minutes ] = time.split(':').map(Number);
    return new Date(2026, 0, 15, hours, minutes, seconds);
};
const settings = {} as ClockSettings;
const entry = (fromTime: string, toTime: string, clockType = 'wordclock'): ScheduleEntry => ({ fromTime, toTime, clockType, clockSettings: settings });

describe('parseTime', () => {
    it('parses HH:mm into minutes since midnight', () => {
        expect(parseTime('00:00')).toBe(0);
        expect(parseTime('07:30')).toBe(450);
        expect(parseTime('23:59')).toBe(1439);
        expect(parseTime('07:30:15')).toBe(450);
    });

    it.each([ '', '7:30', '24:00', '12:60', '25:99', 'abc', undefined, null, 730 ])('rejects %s', (value) => {
        expect(parseTime(value)).toBeUndefined();
    });
});

describe('isTimeInRange', () => {
    it('includes the start and excludes the end', () => {
        expect(isTimeInRange(at('07:00'), '07:00', '23:00')).toBe(true);
        expect(isTimeInRange(at('22:59', 59), '07:00', '23:00')).toBe(true);
        expect(isTimeInRange(at('23:00'), '07:00', '23:00')).toBe(false);
        expect(isTimeInRange(at('06:59', 59), '07:00', '23:00')).toBe(false);
    });

    it('supports ranges that cross midnight', () => {
        expect(isTimeInRange(at('22:00'), '22:00', '06:00')).toBe(true);
        expect(isTimeInRange(at('23:30'), '22:00', '06:00')).toBe(true);
        expect(isTimeInRange(at('00:00'), '22:00', '06:00')).toBe(true);
        expect(isTimeInRange(at('02:00'), '22:00', '06:00')).toBe(true);
        expect(isTimeInRange(at('06:00'), '22:00', '06:00')).toBe(false);
        expect(isTimeInRange(at('12:00'), '22:00', '06:00')).toBe(false);
    });

    it('treats an empty range and invalid times as never active', () => {
        expect(isTimeInRange(at('12:00'), '12:00', '12:00')).toBe(false);
        expect(isTimeInRange(at('12:00'), '', '23:00')).toBe(false);
        expect(isTimeInRange(at('12:00'), '07:00', 'nonsense')).toBe(false);
    });
});

describe('findActiveSchedule', () => {
    const day = entry('07:00', '23:00', 'wordclock');
    const night = entry('23:00', '07:00', 'digital');

    it('finds the entry that covers the time, including across midnight', () => {
        expect(findActiveSchedule([ day, night ], at('12:00'))).toBe(day);
        expect(findActiveSchedule([ day, night ], at('01:00'))).toBe(night);
        expect(findActiveSchedule([ day, night ], at('23:00'))).toBe(night);
    });

    it('skips disabled entries, but treats a missing flag as enabled', () => {
        const disabled = { ...entry('08:00', '18:00'), enabled: false };
        const enabled = { ...entry('08:00', '18:00'), enabled: true };
        expect(findActiveSchedule([ day, disabled ], at('23:30'))).toBeUndefined();
        expect(findActiveSchedule([ day, disabled ], at('12:00'))).toBe(day);
        expect(findActiveSchedule([ day, enabled ], at('12:00'))).toBe(enabled);
        expect(findActiveSchedule([ enabled, disabled ], at('12:00'))).toBe(enabled);
    });

    it('returns undefined when nothing matches or the schedule is missing', () => {
        expect(findActiveSchedule([ entry('08:00', '09:00') ], at('12:00'))).toBeUndefined();
        expect(findActiveSchedule([], at('12:00'))).toBeUndefined();
        expect(findActiveSchedule(undefined, at('12:00'))).toBeUndefined();
    });

    it('lets later entries override earlier overlapping ones', () => {
        const base = entry('00:00', '23:59', 'wordclock');
        const override = entry('12:00', '13:00', 'flipclock');
        expect(findActiveSchedule([ base, override ], at('12:30'))).toBe(override);
        expect(findActiveSchedule([ base, override ], at('14:00'))).toBe(base);
    });

    it('can be limited with a predicate', () => {
        const countdown = entry('12:00', '12:30', 'countdown');
        const later = entry('11:00', '13:00', 'wordclock');
        expect(findActiveSchedule([ countdown, later ], at('12:10'), i => i.clockType === 'countdown')).toBe(countdown);
        expect(findActiveSchedule([ later ], at('12:10'), i => i.clockType === 'countdown')).toBeUndefined();
    });

    it('does not break on empty rows', () => {
        expect(findActiveSchedule([ undefined as unknown as ScheduleEntry, entry('07:00', '23:00') ], at('12:00'))).toBeDefined();
    });
});

describe('secondsUntil', () => {
    it('counts the seconds to a later time today', () => {
        expect(secondsUntil(at('12:00'), '12:30')).toBe(1800);
        expect(secondsUntil(at('12:29', 30), '12:30')).toBe(30);
    });

    it('rolls over to tomorrow when the time has passed (midnight crossing)', () => {
        expect(secondsUntil(at('23:30'), '06:00')).toBe(6.5 * 3600);
        expect(secondsUntil(at('02:00'), '06:00')).toBe(4 * 3600);
        expect(secondsUntil(at('06:00'), '06:00')).toBe(24 * 3600);
    });
});

describe('validateSchedule', () => {
    it('returns one entry per row, empty for valid rows', () => {
        expect(validateSchedule([ entry('07:00', '23:00') ])).toEqual([ {} ]);
        expect(validateSchedule([])).toEqual([]);
        expect(validateSchedule(undefined)).toEqual([]);
    });

    it('accepts times that cross midnight', () => {
        expect(validateSchedule([ entry('22:00', '06:00') ])).toEqual([ {} ]);
    });

    it('flags invalid and equal times', () => {
        const [ invalid, equal ] = validateSchedule([ entry('', '25:00'), entry('08:00', '08:00') ]);
        expect(invalid).toEqual({ fromTime: 'Ongeldige tijd', toTime: 'Ongeldige tijd' });
        expect(equal.toTime).toMatch(/anders/);
    });

    it('flags a missing clock type and missing settings', () => {
        const [ errors ] = validateSchedule([ { fromTime: '07:00', toTime: '08:00' } ]);
        expect(errors).toEqual({ clockType: 'Klok is verplicht', clockSettings: 'Instellingen zijn nog niet ingevuld' });
    });

    it('keeps errors aligned with their rows when a row is empty', () => {
        const errors = validateSchedule([ undefined, entry('07:00', '23:00'), entry('', '08:00') ]);
        expect(errors).toHaveLength(3);
        expect(errors[ 0 ].clockType).toBeDefined();
        expect(errors[ 1 ]).toEqual({});
        expect(errors[ 2 ]).toEqual({ fromTime: 'Ongeldige tijd' });
    });
});
