import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import SettingsService from '../Services/SettingsServices';
import { useJwt } from 'react-jwt';

import { Form as FinalForm, Field } from 'react-final-form';
import { FormInput } from '../FormControls';
import { useNavigate } from 'react-router-dom';

interface Credentials {
    Username: string;
    Password: string;
}

const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 8;

const validate = (values: Partial<Credentials>) => {
    const errors: Partial<Record<keyof Credentials, string>> = {};
    if (!values.Username) {
        errors.Username = 'Gebruikersnaam is verplicht';
    }
    if (!values.Password) {
        errors.Password = 'Wachtwoord is verplicht';
    }
    return errors;
};

const Login = () => {
    const [ error, setError ] = useState<string | undefined>();
    const [ message, setMessage ] = useState<string | undefined>();
    const [ token, setToken ] = useState<string>(localStorage.getItem('token') || '');
    const [ registering, setRegistering ] = useState(false);
    const { isExpired } = useJwt<{ username: string, exp: number }>(token);
    const navigate = useNavigate();

    useEffect(() => {
        const previous = document.body.style.backgroundColor;
        document.body.style.backgroundColor = '#333';
        return () => {
            document.body.style.backgroundColor = previous;
        };
    }, []);

    const clearMessages = () => {
        setMessage(undefined);
        setError(undefined);
    };

    const onSubmit = async (values: Credentials) => {
        clearMessages();
        const result = await SettingsService.login(values.Username, values.Password);
        setToken(localStorage.getItem('token') || '');
        setError(result.error);
        if (result.success) {
            navigate('/settings');
        }
    };

    const register = async (values: Partial<Credentials>) => {
        clearMessages();
        const { Username = '', Password = '' } = values;
        if (Username.length < MIN_USERNAME_LENGTH) {
            setError(`Gebruikersnaam moet minimaal ${MIN_USERNAME_LENGTH} tekens bevatten`);
            return;
        }
        if (Password.length < MIN_PASSWORD_LENGTH) {
            setError(`Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens bevatten`);
            return;
        }
        setRegistering(true);
        const result = await SettingsService.register(Username, Password);
        setRegistering(false);
        if (result.success) {
            setMessage('Registreren gelukt, inloggen a.u.b.');
        } else {
            setError(result.error);
        }
    };

    const logout = () => {
        clearMessages();
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        setToken('');
    };

    return <Container style={{
        textAlign: 'left',
        position: 'absolute',
        backgroundColor: 'white',
        bottom: '1vh',
        top: '50px',
        left: '1vw',
        right: '1vw',
        padding: '2vw',
    }}>
        {!isExpired ? <Card>
            <Card.Body>
                <Card.Title>Ingelogd</Card.Title>
                <Button variant="primary" onClick={logout}>Uitloggen</Button>
            </Card.Body>
        </Card> :
            <FinalForm<Credentials>
                onSubmit={onSubmit}
                validate={validate}
                render={({ handleSubmit, pristine, hasValidationErrors, submitting, values }) => (
                    <form onSubmit={handleSubmit}>
                        <Form.Group as={Row} className='mb-3'>
                            <Form.Label column>Gebruikersnaam</Form.Label>
                            <Col>
                                <Field
                                    name='Username'
                                    type='text'
                                    autoComplete='username'
                                    component={FormInput}
                                />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} className='mb-3'>
                            <Form.Label column>Wachtwoord</Form.Label>
                            <Col>
                                <Field
                                    name='Password'
                                    type='password'
                                    autoComplete='current-password'
                                    component={FormInput}
                                />
                            </Col>
                        </Form.Group>
                        {hasValidationErrors && !pristine && <Alert variant='danger'>Onvolledige invoer</Alert>}
                        {error && <Alert variant='danger'>{error}</Alert>}
                        {message && <Alert variant='info'>{message}</Alert>}
                        <div className='d-flex gap-2'>
                            <Button
                                disabled={pristine || hasValidationErrors || submitting || registering}
                                type='submit'
                                variant='primary'
                            >
                                Inloggen
                            </Button>
                            <Button
                                disabled={pristine || hasValidationErrors || submitting || registering}
                                onClick={() => register(values)}
                                variant='secondary'
                            >
                                Registreren
                            </Button>
                        </div>
                    </form>
                )}
            />
        }
    </Container>;
};

export default Login;
