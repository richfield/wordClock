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
import { FormCheckbox, FormInput, FormSelect } from '../FormControls';
import { ClockSettings } from '../ClockSettings/ClockSettings';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { get } from 'lodash';
import { TimerSettings } from './TimerSettings';
import { validateSchedule } from '../schedule';
import { getErrorMessage } from '../helpers';

const validate = (values: Settings) => {
    const errors: Record<string, unknown> = {};
    if (!values.DefaultClock) {
        errors[ 'DefaultClock' ] = 'Verplicht';
    }
    if (!values.RefreshRate || values.RefreshRate < 10) {
        errors[ 'RefreshRate' ] = 'Minimaal 10 seconden';
    }
    errors.Schedule = validateSchedule(values.Schedule);
    return errors;
};

const ClockTypeSelect = (props: any) => {
    const { onTypeChange, ...rest } = props;
    const input = {
        ...rest.input,
        onChange: (event: unknown) => {
            rest.input.onChange(event);
            onTypeChange?.();
        }
    };
    return <FormSelect {...rest} input={input} />;
};

const SettingsComponent = () => {
    const navigate = useNavigate();
    const [ settings, setSettings ] = useState<Settings>();
    const [ saveError, setSaveError ] = useState<string>();
    const [ saved, setSaved ] = useState(false);
    async function onSubmit(values: Settings, form: any) {
        setSaveError(undefined);
        setSaved(false);
        try {
            await SettingsService.updateSettings(values);
        } catch (error) {
            setSaveError(getErrorMessage(error));
            return;
        }
        setSaved(true);

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

    useEffect(() => {
        if (isExpired) {
            navigate('/login');
        }
    }, [ isExpired, navigate ]);

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
            try {
                setSettings(await SettingsService.getSettings());
            } catch (error) {
                setSaveError(`Instellingen laden mislukt: ${getErrorMessage(error)}`);
            }
        };
        if (!isExpired && !settings) {
            fetchData();
        }
    }, [ isExpired, decodedToken, settings ]);

    useEffect(() => {
        document.body.style.backgroundColor = '#333';
    }, []);
    return (
        <Container className='pb-4' style={{ textAlign: 'left', maxWidth: '960px', paddingTop: '70px' }}>
            <h4 className='text-white mb-3'>Instellingen</h4>
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
                            submitting,
                            form
                        }) => {
                            return (
                                <form onSubmit={handleSubmit}>
                                    <>
                                        <Card className='mb-3'>
                                            <Card.Header className='d-flex justify-content-between align-items-center'>
                                                <strong>Schema's</strong>
                                                <Button
                                                    size='sm'
                                                    onClick={() => push('Schedule', undefined)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <FontAwesomeIcon icon={faCalendarPlus} /> Toevoegen
                                                </Button>
                                            </Card.Header>
                                            <Card.Body className='p-2'>
                                                <FieldArray name='Schedule'>
                                                    {({ fields }) => (<>
                                                        {!fields.length && (
                                                            <p className='text-muted text-center my-3'>
                                                                Geen schema's. De standaard klok wordt altijd getoond.
                                                            </p>
                                                        )}
                                                        {fields.map((name, index) => (
                                                            <Card key={index} className='mb-2'>
                                                                <Card.Body>
                                                                    <Row className='g-2'>

                                                                        <Col sm={4}>
                                                                            <Form.Label className='small text-muted mb-1'>Klok</Form.Label>
                                                                            <Field
                                                                                name={`${name}.clockType`}
                                                                                component={ClockTypeSelect}
                                                                                onTypeChange={() => resetToDefault(name, form)}
                                                                                items={ClockRegistry.map((item) => ({
                                                                                    value: item.id,
                                                                                    text: item.name,
                                                                                }))}
                                                                            />
                                                                        </Col>
                                                                        <Col sm={4}>
                                                                            <Form.Label className='small text-muted mb-1'>Van</Form.Label>
                                                                            <Field
                                                                                name={`${name}.fromTime`}
                                                                                component={FormInput}
                                                                                type='time'
                                                                            />
                                                                        </Col>
                                                                        <Col sm={4}>
                                                                            <Form.Label className='small text-muted mb-1'>Tot</Form.Label>
                                                                            <Field
                                                                                name={`${name}.toTime`}
                                                                                component={FormInput}
                                                                                type='time'
                                                                            />
                                                                        </Col>
                                                                    </Row>
                                                                </Card.Body>
                                                                <Card.Footer className='d-flex justify-content-between align-items-center'>
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
                                                                                {meta.error && <span className='text-danger small'>{meta.error}</span>}
                                                                                <Button
                                                                                    size='sm'
                                                                                    variant='outline-danger'
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
                                                        ))}
                                                    </>)}
                                                </FieldArray>
                                            </Card.Body>
                                        </Card>
                                        <Card className='mb-3'>
                                            <Card.Header><strong>Algemeen</strong></Card.Header>
                                            <Card.Body>
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
                                            </Card.Body>
                                        </Card>
                                        <Card className='mb-3'>
                                        <Card.Header><strong>Klokinstellingen</strong></Card.Header>
                                        <Accordion defaultActiveKey={[]} alwaysOpen flush>
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
                                        </Card>
                                        <Card className='mb-3'>
                                            <Card.Header><strong>Timer</strong></Card.Header>
                                            <Card.Body>
                                                <TimerSettings path='Timer' />
                                            </Card.Body>
                                        </Card>
                                        <div
                                            className='bg-white border-top py-2 px-3 d-flex align-items-center justify-content-between gap-3'
                                            style={{ position: 'sticky', bottom: 0, zIndex: 10 }}
                                        >
                                            <div className='flex-grow-1'>
                                                {hasValidationErrors && (
                                                    <Alert variant='danger' className='mb-0 py-1'>
                                                        Kan niet opslaan, foute invoer
                                                    </Alert>
                                                )}
                                                {saveError && (
                                                    <Alert variant='danger' className='mb-0 py-1'>
                                                        Opslaan mislukt: {saveError}
                                                    </Alert>
                                                )}
                                                {saved && pristine && !saveError && (
                                                    <Alert variant='success' className='mb-0 py-1'>Opgeslagen</Alert>
                                                )}
                                            </div>
                                            <Button
                                                disabled={pristine || hasValidationErrors || submitting}
                                                type='submit'
                                                variant='primary'
                                            >
                                                {submitting ? 'Opslaan…' : 'Opslaan'}
                                            </Button>
                                        </div>
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
