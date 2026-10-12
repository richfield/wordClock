import { ScheduleEntry } from './types';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;
const SECONDS_PER_DAY = 24 * 60 * 60;

export const parseTime = (value: unknown): number | undefined => {
    const match = typeof value === 'string' ? TIME_PATTERN.exec(value) : null;
    return match ? Number(match[ 1 ]) * 60 + Number(match[ 2 ]) : undefined;
};

/**
 * True when `now` is inside [from, to). A range whose end is before its start
 * wraps around midnight, so 22:00-06:00 covers the night.
 */
export const isTimeInRange = (now: Date, from: string, to: string): boolean => {
    const start = parseTime(from);
    const end = parseTime(to);
    if (start === undefined || end === undefined || start === end) {
        return false;
    }
    const current = now.getHours() * 60 + now.getMinutes();
    return start < end ? current >= start && current < end : current >= start || current < end;
};

/** The last matching entry wins, so later schedules override earlier ones. Disabled entries are skipped. */
export const findActiveSchedule = (
    schedule: ScheduleEntry[] | undefined,
    now: Date,
    predicate: (item: ScheduleEntry) => boolean = () => true
): ScheduleEntry | undefined =>
    [ ...(schedule ?? []) ].reverse().find(item =>
        {
            console.log({ item, isin: isTimeInRange(now, item.fromTime, item.toTime), predicate: predicate(item) });
            return item && item.enabled !== false && predicate(item) && isTimeInRange(now, item.fromTime, item.toTime);
        });

/** Seconds until the next occurrence of `to`, which may be on the next day. */
export const secondsUntil = (now: Date, to: string): number => {
    const target = (parseTime(to) ?? 0) * 60;
    const current = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const diff = target - current;
    return diff > 0 ? diff : diff + SECONDS_PER_DAY;
};

export type ScheduleErrors = Partial<Record<'fromTime' | 'toTime' | 'clockType' | 'clockSettings', string>>;

/** Always returns one entry per row so errors line up with the rows of the form. */
export const validateSchedule = (schedule: Array<Partial<ScheduleEntry> | undefined> | undefined): ScheduleErrors[] =>
    (schedule ?? []).map(item => {
        const errors: ScheduleErrors = {};
        if (!item) {
            errors.clockType = 'Klok is verplicht';
            errors.fromTime = 'Verplicht';
            errors.toTime = 'Verplicht';
            return errors;
        }
        const from = parseTime(item.fromTime);
        const to = parseTime(item.toTime);
        if (from === undefined) {
            errors.fromTime = 'Ongeldige tijd';
        }
        if (to === undefined) {
            errors.toTime = 'Ongeldige tijd';
        }
        if (from !== undefined && from === to) {
            errors.toTime = 'Eindtijd moet anders zijn dan de starttijd';
        }
        if (!item.clockType) {
            errors.clockType = 'Klok is verplicht';
        }
        if (!item.clockSettings) {
            errors.clockSettings = 'Instellingen zijn nog niet ingevuld';
        }
        return errors;
    });
