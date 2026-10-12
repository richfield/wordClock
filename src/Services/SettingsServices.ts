import { defaultSettings } from '../Constants';
import { getErrorMessage } from '../helpers';
import { Settings, User } from '../types';
import { decodeToken } from 'react-jwt';
const fetchData = async (path: string, method: 'POST' | 'GET', body: unknown = {}): Promise<any> => {
    var response = await fetch(`${import.meta.env.VITE_API_URL}/${path}`, {
        method: method,
        body: method === 'POST' ? JSON.stringify(body) : undefined,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'user_id': `${localStorage.getItem('user_id')}`
        },
    });
    if (response.ok) {
        const token = response.headers.get('Token');
        if (token) {
            localStorage.setItem('token', token);
        }
        return await response.json();
    }
    const text = await response.text();
    if (response.status === 401 && path !== 'login') {
        // The server no longer accepts this token (e.g. key rotated): drop it so the app asks for a new login
        localStorage.removeItem('token');
    }
    let message = text;
    try {
        const parsed = JSON.parse(text);
        message = typeof parsed === 'string' ? parsed : parsed?.error ?? text;
    } catch {
        // Not JSON: use the raw response text
    }
    throw new Error(message);
};

const login = async (Username: string, Password: string): Promise<{ success: boolean, error?: string }> => {
    try {
        const data = { Username, Password };
        const user = await fetchData('login', 'POST', data);
        localStorage.setItem('token', user[ 0 ].Token);
        localStorage.setItem('user_id', user[ 0 ].Id);
    } catch (err) {
        return { success: false, error: getErrorMessage(err) };
    }
    return { success: true };
};

const register = async (Username: string, Password: string): Promise<{ success: boolean, error?: string }> => {
    try {
        const data = { Username, Password };
        await fetchData('register', 'POST', data);
    } catch (err) {
        return { success: false, error: getErrorMessage(err) };
    }
    return { success: true };
};

const getSettings = async (): Promise<Settings> => {
    const decodedToken = decodeToken<{ exp?: number }>(localStorage.getItem('token') || '');
    if (decodedToken?.exp && (decodedToken.exp * 1000) > new Date().getTime()) {
        const result = await fetchData('settings', 'GET');
        const parsed = typeof(result) == 'string' ? JSON.parse(result) : result;
        // Settings saved by older versions may lack newer keys
        return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
};

const getCurrentUser = async (): Promise<User | undefined> => {
    if (localStorage.getItem('token')) {
        const result = await fetchData('me', 'GET');
        return result;
    }
};


const updateSettings = async (settings: Settings) => {
    if (localStorage.getItem('token')) {
        await fetchData('settings', 'POST', settings);
    }
};

const patchSettings = async (patch: Partial<Settings>) => {
    if (localStorage.getItem('token')) {
        const latest = await getSettings();
        await updateSettings({ ...latest, ...patch });
    }
};

const SettingsService = {
    login,
    register,
    getSettings,
    updateSettings,
    patchSettings,
    getCurrentUser
};

export default SettingsService;