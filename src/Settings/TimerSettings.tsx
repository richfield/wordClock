import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, ButtonGroup, Card, Col, Container, Row } from 'react-bootstrap';
import { useField, useForm } from 'react-final-form';
import { formatTime } from '../helpers';

export const TimerSettings = (props: { path: string }) => {
    const { input } = useField(props.path);
    const form = useForm();

    const addToValue = (seconds: number) => {
        let value = input.value || 0;
        value += seconds;
        form.change(props.path, value);
    };

    const resetValue = () => {
        form.change(props.path, 0);
    };
    return <Container>
        <Card style={{ marginTop: '2vmin', textAlign: 'center' }}>
            <Col>{formatTime(input.value, 'HH:mm:ss')}</Col>
        </Card>
        <Row>
            <ButtonGroup aria-label="Basic example">
                <Button size='sm' onClick={() => addToValue(5)}>5s</Button>


                <Button size='sm' onClick={() => addToValue(10)}>10s</Button>


                <Button size='sm' onClick={() => addToValue(30)}>30s</Button>


                <Button size='sm' onClick={() => addToValue(60)}>1m</Button>


                <Button size='sm' onClick={() => addToValue(300)}>5m</Button>


                <Button size='sm' onClick={() => addToValue(600)}>10m</Button>

                <Button size='sm' onClick={resetValue}>
                    <FontAwesomeIcon icon={faTrash} />
                </Button>
            </ButtonGroup>
        </Row>
    </Container>;
};