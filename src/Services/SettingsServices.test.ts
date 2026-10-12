import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../Constants';
import SettingsService from './SettingsServices';

const makeToken = (payload: object) => {
    const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
};
const nowInSeconds = () => Math.floor(Date.now() / 1000);

const jsonResponse = (body: unknown, init: { status?: number, headers?: Record<string, string> } = {}) =>
    new Response(JSON.stringify(body), { status: init.status ?? 200, headers: init.headers });

describe('SettingsService', () => {
    const store = new Map<string, string>();
    const fetchMock = vi.fn();

    beforeEach(() => {
        store.clear();
        fetchMock.mockReset();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => store.get(key) ?? null,
            setItem: (key: string, value: unknown) => void store.set(key, String(value)),
            removeItem: (key: string) => void store.delete(key),
        });
        vi.stubGlobal('fetch', fetchMock);
        vi.stubGlobal('window', { atob: globalThis.atob });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('login', () => {
        it('stores the token and user id on success', async () => {
            fetchMock.mockResolvedValue(jsonResponse([ { Id: 7, Username: 'alice', Token: 'abc' } ]));
            await expect(SettingsService.login('alice', 'password1')).resolves.toEqual({ success: true });
            expect(store.get('token')).toBe('abc');
            expect(store.get('user_id')).toBe('7');
            const [ url, options ] = fetchMock.mock.calls[0];
            expect(url).toMatch(/\/login$/);
            expect(options.method).toBe('POST');
            expect(JSON.parse(options.body)).toEqual({ Username: 'alice', Password: 'password1' });
        });

        it('unwraps a JSON string error from the API', async () => {
            fetchMock.mockResolvedValue(jsonResponse('Invalid username or password', { status: 401 }));
            await expect(SettingsService.login('alice', 'nope')).resolves.toEqual({
                success: false,
                error: 'Invalid username or password',
            });
            expect(store.has('token')).toBe(false);
        });

        it('unwraps an { error } object from the API', async () => {
            fetchMock.mockResolvedValue(jsonResponse({ error: 'Too many attempts' }, { status: 429 }));
            const result = await SettingsService.login('alice', 'nope');
            expect(result.error).toBe('Too many attempts');
        });

        it('falls back to the raw text when the error is not JSON', async () => {
            fetchMock.mockResolvedValue(new Response('Bad Gateway', { status: 502 }));
            const result = await SettingsService.login('alice', 'nope');
            expect(result.error).toBe('Bad Gateway');
        });

        it('reports network failures', async () => {
            fetchMock.mockRejectedValue(new Error('Failed to fetch'));
            await expect(SettingsService.login('alice', 'x')).resolves.toEqual({ success: false, error: 'Failed to fetch' });
        });
    });

    describe('register', () => {
        it('succeeds on a 201 response', async () => {
            fetchMock.mockResolvedValue(jsonResponse('Success', { status: 201 }));
            await expect(SettingsService.register('alice', 'password1')).resolves.toEqual({ success: true });
        });

        it('returns the API error for duplicates', async () => {
            fetchMock.mockResolvedValue(jsonResponse('Record already exists. Please login', { status: 409 }));
            const result = await SettingsService.register('alice', 'password1');
            expect(result).toEqual({ success: false, error: 'Record already exists. Please login' });
        });
    });

    describe('getSettings', () => {
        it('returns the defaults without calling the API when logged out', async () => {
            await expect(SettingsService.getSettings()).resolves.toEqual(defaultSettings);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('returns the defaults for a malformed token', async () => {
            store.set('token', 'not-a-jwt');
            await expect(SettingsService.getSettings()).resolves.toEqual(defaultSettings);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('returns the defaults for an expired token', async () => {
            store.set('token', makeToken({ exp: nowInSeconds() - 60 }));
            await expect(SettingsService.getSettings()).resolves.toEqual(defaultSettings);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('fetches settings with a valid token and sends it as a Bearer header', async () => {
            const token = makeToken({ exp: nowInSeconds() + 600 });
            store.set('token', token);
            fetchMock.mockResolvedValue(jsonResponse({ ...defaultSettings, Timer: 5 }));
            const result = await SettingsService.getSettings();
            expect(result.Timer).toBe(5);
            const [ url, options ] = fetchMock.mock.calls[0];
            expect(url).toMatch(/\/settings$/);
            expect(options.headers.Authorization).toBe(`Bearer ${token}`);
        });

        it('stores a refreshed token from the Token response header', async () => {
            store.set('token', makeToken({ exp: nowInSeconds() + 600 }));
            fetchMock.mockResolvedValue(jsonResponse(defaultSettings, { headers: { Token: 'refreshed' } }));
            await SettingsService.getSettings();
            expect(store.get('token')).toBe('refreshed');
        });

        it('parses settings that arrive as a JSON string', async () => {
            store.set('token', makeToken({ exp: nowInSeconds() + 600 }));
            fetchMock.mockResolvedValue(jsonResponse(JSON.stringify({ ...defaultSettings, Timer: 9 })));
            expect((await SettingsService.getSettings()).Timer).toBe(9);
        });
    });

    describe('updateSettings / getCurrentUser', () => {
        it('does nothing when logged out', async () => {
            await SettingsService.updateSettings(defaultSettings);
            await expect(SettingsService.getCurrentUser()).resolves.toBeUndefined();
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('posts the settings when logged in', async () => {
            store.set('token', 'abc');
            fetchMock.mockResolvedValue(jsonResponse(defaultSettings));
            await SettingsService.updateSettings({ ...defaultSettings, Timer: 3 });
            const [ url, options ] = fetchMock.mock.calls[0];
            expect(url).toMatch(/\/settings$/);
            expect(options.method).toBe('POST');
            expect(JSON.parse(options.body).Timer).toBe(3);
        });

        it('loads the current user', async () => {
            store.set('token', 'abc');
            fetchMock.mockResolvedValue(jsonResponse({ Username: 'alice' }));
            await expect(SettingsService.getCurrentUser()).resolves.toEqual({ Username: 'alice' });
        });
    });
});
