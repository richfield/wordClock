import { Card, Col, Form, Row } from 'react-bootstrap';
import { Field } from 'react-final-form';
import { FormInput } from '../FormControls/FormInput';

export const ClockSettings = (props: { path: string, title?: string }) => {

    return <Card>
        <Card.Body>
            {props.title && <Card.Title>{props.title}</Card.Title>}
            <Form.Group as={Row} className='mb-3'>
                <Form.Label column>AchtergrondKleur</Form.Label>
                <Col>
                    <Field name={`${props.path}.backgroundColor`} type='color' component={FormInput} />
                </Col>
            </Form.Group>
            <Form.Group as={Row} className='mb-3'>
                <Form.Label column>VoorgrondKleur</Form.Label>
                <Col>
                    <Field name={`${props.path}.foreGroundColor`} type='color' component={FormInput} />
                </Col>
            </Form.Group>
            <Form.Group as={Row} className='mb-3'>
                <Form.Label column>Schaduwkleur</Form.Label>
                <Col>
                    <Field name={`${props.path}.shadeColor`} type='color' component={FormInput} />
                </Col>
            </Form.Group>
            <Form.Group as={Row} className='mb-3'>
                <Form.Label column>Afstand tot bovenkant</Form.Label>
                <Col>
                    <Field name={`${props.path}.topDistance`} type='text' component={FormInput} />
                </Col>
            </Form.Group>
            <Form.Group as={Row} className='mb-3'>
                <Form.Label column>Schaalfactor</Form.Label>
                <Col>
                    <Field name={`${props.path}.sizeFactor`} type='number' component={FormInput} />
                </Col>
            </Form.Group>
        </Card.Body>
    </Card>;
};