import { useEffect } from 'react';
import { Form as FinalForm, Field, useForm } from 'react-final-form';
import { Form, Col, Row, Container, Button, Alert, Modal, Accordion, Card } from 'react-bootstrap';
import { Settings } from '../types';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import 'react-clock/dist/Clock.css';
import ClockRegistry from '../ClockRegistry';
import SettingsService from '../Services/SettingsServices';
import { useState } from 'react';
import { useJwt } from 'react-jwt';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarXmark,
    faCalendarPlus,
    faRotateBack,
    faClose,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { FormCheckbox, FormInput, FormSelect } from '../FormControls';
import { ClockSettings } from '../ClockSettings/ClockSettings';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { get } from 'lodash';
import { TimerSettings } from './TimerSettings';

const validate = (values: Settings) => {
    const errors: any = {};
    if (!values.DefaultClock) {
        errors[ 'DefaultClock' ] = 'Verplicht';
    }
    if (!values.RefreshRate || values.RefreshRate < 10) {
        errors[ 'RefreshRate' ] = 'Minimaal 10 seconden';
    }
    errors.Schedule = [];
    values.Schedule?.forEach((item, index) => {
        const error: any = {};
        if (!item) {
            errors[ `Schedule[${index}]` ] = { fromTime: 'Verplicht' };
            return;
        }
        if (!moment(item.fromTime, 'HH:mm').isValid()) {
            error[ 'fromTime' ] = 'Ongeldige tijd';
        }
        if (!moment(item.toTime, 'HH:mm').isValid()) {
            error[ 'toTime' ] = 'Ongeldige tijd';
        }
        if (!item.clockType) {
            error[ 'clockType' ] = 'Klok is veplicht';
        }

        if (!item.clockSettings) {
            error[ 'clockSettings' ] = 'Instellingen zijn nog niet ingevuld';
        }
        errors.Schedule.push(error);
    });
    return errors;
};

const SettingsComponent = () => {
    const navigate = useNavigate();
    const [ settings, setSettings ] = useState<Settings>();
    async function onSubmit(values: Settings, form: any) {
        await SettingsService.updateSettings(values);

        setSettings({
            ...values,
            Timer: 0,
            ForceReload: false
        });

        form.change('Timer', 0);
        form.change('ForceReload', false);
    }

    const { decodedToken, isExpired } = useJwt<{
        username: string;
        exp: number;
        user_id: string;
    }>(localStorage.getItem('token') || '');

    if (isExpired) {
        navigate('/login');
    }

    const [ visibleModal, setVisibleModal ] = useState<string>();

    const isModalVisible = (name: string) => visibleModal === name;

    const setModalVisible = (name: string) => setVisibleModal(name);

    const resetToDefault = (path: string, form: any) => {
        const change = form.change;
        const values = form.getState().values;
        const wordClock = values[ 'WordClockDefaultSettings' ];
        const digital = values[ 'DigitalClockDefaultSettings' ];
        const countdown = values[ 'TimerSettings' ];
        const flipclock = values['FlipClockDefaultSettings'];
        const clockClock24 = values['ClockClock24DefaultSettings'];
        const clockType = get(values, `${path}.clockType`);
        switch (clockType) {
            case 'wordclock':
                change(`${path}.clockSettings`, wordClock);
                break;
            case 'digital':
                change(`${path}.clockSettings`, digital);
                break;
            case 'countdown':
                change(`${path}.clockSettings`, countdown);
                break;
            case 'flipclock':
                change(`${path}.clockSettings`, flipclock);
                break;
            case 'clockClock24':
                change(`${path}.clockSettings`, clockClock24);
                break;
            default:
                break;
        }
    };

    const ResetToDefault = (props: { path: string }) => {
        const form = useForm();
        return <Button
            size='sm'
            onClick={() => resetToDefault(props.path, form)}
            style={{ cursor: 'pointer' }}
        >
            <FontAwesomeIcon icon={faRotateBack} />
        </Button>;
    };

    useEffect(() => {
        const fetchData = async () => {
            const result = await SettingsService.getSettings();
            setSettings(result);
        };
        if (!isExpired && !settings) {
            fetchData();
        }
    }, [ isExpired, decodedToken, settings ]);

    document.body.style.backgroundColor = '#333';
    return (
        <Container
            style={{
                textAlign: 'left',
                position: 'absolute',
                backgroundColor: 'white',
                top: '50px',
                left: '1vw',
                right: '1vw',
                padding: '2vw',
            }}
        >
            <Row>
                <Col>
                    <FinalForm
                        onSubmit={onSubmit}
                        validate={validate}
                        initialValues={settings}
                        mutators={{
                            ...arrayMutators,
                        }}
                        render={({
                            handleSubmit,
                            form: {
                                mutators: { push },
                            },
                            pristine,
                            hasValidationErrors,
                            form
                        }) => {
                            return (
                                <form onSubmit={handleSubmit}>
                                    <>
                                        <Form.Group
                                            as={Row}
                                            className='mb-3'
                                        >
                                            <Col xs={3}>
                                                <Row>
                                                    <Row>
                                                        <Form.Label column m={1}>
                                                            Schema's
                                                        </Form.Label>

                                                    </Row>
                                                    <Row>
                                                        <Col m={1}>
                                                            <Button
                                                                size='sm'
                                                                onClick={() => push('Schedule', undefined)}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <FontAwesomeIcon icon={faCalendarPlus} /> Toevoegen
                                                            </Button>
                                                        </Col>

                                                    </Row>
                                                </Row>
                                            </Col>
                                            <Col>
                                                <FieldArray name='Schedule'>
                                                    {({ fields }) =>
                                                        fields.map((name, index) => (
                                                            <Card key={index}>
                                                                <Card.Body>
                                                                    <Row>

                                                                        <Col sm={3}>
                                                                            <Field
                                                                                name={`${name}.clockType`}
                                                                                component={FormSelect}
                                                                                items={ClockRegistry.map((item) => ({
                                                                                    value: item.id,
                                                                                    text: item.name,
                                                                                }))}
                                                                            />
                                                                        </Col>
                                                                        <Col sm={3}>
                                                                            <Field
                                                                                name={`${name}.fromTime`}
                                                                                component={FormInput}
                                                                                type='time'
                                                                            />
                                                                        </Col>
                                                                        <Col sm={3}>
                                                                            <Field
                                                                                name={`${name}.toTime`}
                                                                                component={FormInput}
                                                                                type='time'
                                                                            />
                                                                        </Col>
                                                                    </Row>
                                                                </Card.Body>
                                                                <Card.Footer style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Field name={`${name}.clockSettings`}>
                                                                        {({ input, meta }) => (
                                                                            <>
                                                                                <Button
                                                                                    size='sm'
                                                                                    onClick={() => setModalVisible(name)}
                                                                                    style={{ cursor: 'pointer' }}
                                                                                    variant={ meta.error ? 'danger' : 'primary'}
                                                                                >
                                                                                    <FontAwesomeIcon icon={faGear} /> Instellingen
                                                                                </Button>
                                                                                {meta.error && <span>{meta.error}</span>}
                                                                                <Button
                                                                                    size='sm'
                                                                                    onClick={() => fields.remove(index)}
                                                                                    style={{ cursor: 'pointer' }}
                                                                                >
                                                                                    <FontAwesomeIcon icon={faCalendarXmark} /> Verwijderen
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                    </Field>
                                                                    <Modal show={isModalVisible(name)} onHide={() => setVisibleModal(undefined)}>
                                                                        <Modal.Body>
                                                                            <ClockSettings path={`${name}.clockSettings`} title='KlokInstellingen' />
                                                                        </Modal.Body>
                                                                        <Modal.Footer>
                                                                            <ResetToDefault path={name} />
                                                                            <Button
                                                                                size='sm'
                                                                                onClick={() => setVisibleModal(undefined)}
                                                                                style={{ cursor: 'pointer' }}
                                                                            >
                                                                                <FontAwesomeIcon icon={faClose} />
                                                                            </Button>
                                                                        </Modal.Footer>
                                                                    </Modal>
                                                                </Card.Footer>
                                                            </Card>
                                                        ))
                                                    }
                                                </FieldArray>
                                            </Col>
                                        </Form.Group>
                                        <Form.Group
                                            as={Row}
                                            className='mb-3'
                                        >
                                            <Form.Label column>Standaard Klok</Form.Label>
                                            <Col>
                                                <Field
                                                    name='DefaultClock'
                                                    component={FormSelect}
                                                    items={ClockRegistry.map((item) => ({
                                                        value: item.id,
                                                        text: item.name,
                                                    }))}
                                                />
                                            </Col>
                                        </Form.Group>
                                        <Form.Group
                                            as={Row}
                                            className='mb-3'
                                        >
                                            <Form.Label column>
                                                Instellingen vernieuwen (s)
                                            </Form.Label>
                                            <Col>
                                                <Field
                                                    name='RefreshRate'
                                                    type='number'
                                                    component={FormInput}
                                                />
                                            </Col>
                                        </Form.Group>
                                        <Form.Group
                                            as={Row}
                                            className='mb-3'
                                        >
                                            <Form.Label column>Forceer herlaad</Form.Label>
                                            <Col>
                                                <Field
                                                    name='ForceReload'
                                                    type='checkbox'
                                                    component={FormCheckbox}
                                                />
                                            </Col>
                                        </Form.Group>
                                        <Accordion defaultActiveKey={[]} alwaysOpen>
                                            <Accordion.Item eventKey="0">
                                                <Accordion.Header>Standaard instellingen Woordklok</Accordion.Header>
                                                <Accordion.Body>
                                                    <ClockSettings path='WordClockDefaultSettings' />
                                                </Accordion.Body>
                                            </Accordion.Item>
                                            <Accordion.Item eventKey="1">
                                                <Accordion.Header>Standaard instellingen Digitale klok</Accordion.Header>
                                                <Accordion.Body>
                                                    <ClockSettings path='DigitalClockDefaultSettings' />
                                                </Accordion.Body>
                                            </Accordion.Item>
                                            <Accordion.Item eventKey="2">
                                                <Accordion.Header>Standaard instellingen Flip Clock</Accordion.Header>
                                                <Accordion.Body>
                                                    <ClockSettings path='FlipClockDefaultSettings' />
                                                </Accordion.Body>
                                            </Accordion.Item>
                                            <Accordion.Item eventKey="3">
                                                <Accordion.Header>Instellingen Timer</Accordion.Header>
                                                <Accordion.Body>
                                                    <ClockSettings path='TimerSettings' />
                                                </Accordion.Body>
                                            </Accordion.Item>
                                            <Accordion.Item eventKey="4">
                                                <Accordion.Header>Instellingen ClockClock24</Accordion.Header>
                                                <Accordion.Body>
                                                    <ClockSettings path='ClockClock24DefaultSettings' />
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        </Accordion>
                                        <Form.Group
                                            as={Row}
                                            className='mb-3'
                                        >
                                            <Form.Label column sm={1}>Timer</Form.Label>
                                            <Col>
                                                <TimerSettings path='Timer' />
                                            </Col>
                                        </Form.Group>
                                        <Row>
                                            <Col>
                                                {' '}
                                                {hasValidationErrors && (
                                                    <Alert variant='danger'>
                                                        Kan niet opslaan, foute invoer
                                                    </Alert>
                                                )}
                                            </Col>
                                            <Col sm={1}>
                                                <Button
                                                    disabled={pristine || hasValidationErrors}
                                                    type='submit'
                                                    variant='primary'
                                                >
                                                    Opslaan
                                                </Button>
                                            </Col>
                                        </Row>
                                    </>
                                </form>
                            );
                        }}
                    />
                </Col>
            </Row>
        </Container>
    );
};

export default SettingsComponent;
