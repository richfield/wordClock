import { defaultSettings } from '../Constants';
import { getErrorMessage } from '../helpers';
import { Settings, User } from '../types';
import jwtDecode, { JwtPayload } from 'jwt-decode';
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
    throw new Error(await response.text());
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
    const decodedToken = jwtDecode<JwtPayload>(localStorage.getItem('token') || '');
    if (decodedToken && decodedToken.exp && (decodedToken.exp * 1000) > new Date().getTime()) {
        const result = await fetchData('settings', 'GET');
        return typeof(result) == 'string' ?  JSON.parse(result) : result;
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

const SettingsService = {
    login,
    register,
    getSettings,
    updateSettings,
    getCurrentUser
};

export default SettingsService;