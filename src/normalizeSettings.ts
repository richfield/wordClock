import { defaultSettings } from './Constants';
import { ClockSettings, Settings } from './types';

const clockSettingsKeys: Record<string, keyof Settings> = {
    wordclock: 'WordClockDefaultSettings',
    digital: 'DigitalClockDefaultSettings',
    countdown: 'TimerSettings',
    flipclock: 'FlipClockDefaultSettings',
    clockClock24: 'ClockClock24DefaultSettings'
};

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const withDefaults = (defaults: ClockSettings, value: unknown): ClockSettings =>
    ({ ...defaults, ...(isObject(value) ? value : {}) }) as ClockSettings;

/**
 * Settings saved by older versions (or edited by hand) can lack keys at any level.
 * Fill the gaps from the defaults so the clocks never receive undefined settings.
 */
export const normalizeSettings = (input: unknown): Settings => {
    const raw = isObject(input) ? input : {};
    const result = { ...defaultSettings, ...raw } as Settings;

    Object.values(clockSettingsKeys).forEach(key => {
        (result as unknown as Record<string, unknown>)[ key ] =
            withDefaults(defaultSettings[ key ] as ClockSettings, raw[ key ]);
    });

    result.Schedule = (Array.isArray(raw.Schedule) ? raw.Schedule : defaultSettings.Schedule)
        .filter(isObject)
        .map(item => {
            const key = clockSettingsKeys[ String(item.clockType) ];
            if (!key || !isObject(item.clockSettings)) {
                return item;
            }
            return { ...item, clockSettings: withDefaults(result[ key ] as ClockSettings, item.clockSettings) };
        }) as unknown as Settings['Schedule'];

    return result;
};
