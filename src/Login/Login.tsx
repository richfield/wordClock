import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useState } from 'react';
import SettingsService from '../Services/SettingsServices';
import { useJwt } from 'react-jwt';

import { Form as FinalForm, Field } from 'react-final-form';
import { FormInput } from '../FormControls';
import { DbUser } from '../types';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [ error, setError ] = useState<string | undefined>();
    const [ message, setMessage ] = useState<string | undefined>();
    const [ token, setToken ] = useState<string>(localStorage.getItem('token') || '');
    const { isExpired } = useJwt<{ username: string, exp: number }>(token);
    const navigate = useNavigate();

    const clearMessages = () => {
        setMessage(undefined);
        setError(undefined);
    };

    const onSubmit = async (values: DbUser) => {
        clearMessages();
        const result = await SettingsService.login(values.Username, values.Password);
        setToken(localStorage.getItem('token') || '');
        setError(result.error);
        if(result.success) {
            navigate('/Settings');
        }
    };

    const register = async (values: any) => {
        clearMessages();
        const result = await SettingsService.register(values.Username, values.Password);
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

    const validate = (values: DbUser) => {
        const errors: any = {};
        if(!values.Username) {
            errors['Username'] = 'Gebruikersnaam is verplicht';
        }
        if (!values.Password) {
            errors[ 'Password' ] = 'Wachtwoord is verplicht';
        }
        return errors;
    };
    document.body.style.backgroundColor = '#333';
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
            <FinalForm
                onSubmit={onSubmit}
                validate={validate}
                render={({
                    handleSubmit,
                    pristine,
                    hasValidationErrors,
                    values
                }) => {
                    return (
                        <form onSubmit={handleSubmit}>
                            <>
                                <Form.Group
                                    as={Row}
                                    className='mb-3'
                                >
                                    <Form.Label column>Gebruikersnaam</Form.Label>
                                    <Col>
                                        <Field
                                            name='Username'
                                            type='text'
                                            component={FormInput}
                                        />
                                    </Col>
                                </Form.Group>
                                <Form.Group
                                    as={Row}
                                    className='mb-3'
                                >
                                    <Form.Label column>Wachtwoord</Form.Label>
                                    <Col>
                                        <Field
                                            name='Password'
                                            type='password'
                                            component={FormInput}
                                        />
                                    </Col>
                                </Form.Group>
                                <Row>
                                    <Col>
                                        {' '}
                                        {hasValidationErrors && !pristine && <Alert variant='danger'>Onvolledige invoer</Alert>}
                                        {error && <Alert variant='danger'>{error}</Alert>}
                                        {message && <Alert variant='info'>{message}</Alert>}
                                    </Col>
                                    <Col sm={1}>
                                        <Button
                                            disabled={pristine || hasValidationErrors}
                                            type='submit'
                                            variant='primary'
                                        >
                                            Inloggen
                                        </Button>
                                        </Col><Col>
                                        <Button
                                            disabled={pristine || hasValidationErrors}
                                            onClick={() => register(values)}
                                            variant='secondary'
                                        >
                                            Registreren
                                        </Button>
                                    </Col>
                                </Row>
                            </>
                        </form>
                    );
                }}
            />
        }
    </Container>;
};

export default Login;