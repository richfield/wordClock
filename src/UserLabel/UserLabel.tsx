import { useEffect, useState } from 'react';
import { Navbar } from 'react-bootstrap';
import { useJwt } from 'react-jwt';
import SettingsService from '../Services/SettingsServices';

export const UserLabel = () => {
    const [ userName, setUserName ] = useState<string>();
    const { isExpired } = useJwt<{
        username: string;
        exp: number;
        user_id: string;
    }>(localStorage.getItem('token') || '');

    useEffect(() => {
        if (!isExpired) {
            SettingsService.getCurrentUser().then(result => {
                if (result) {
                    setUserName(result.Username);
                }
            });
        }
    }, [ isExpired ]);

    return <Navbar.Brand href="/login">{userName}</Navbar.Brand>;
};