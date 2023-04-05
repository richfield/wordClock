import moment from 'moment';
import { Container } from 'react-bootstrap';
import { ClockSettings } from '../types';
import { useEffect } from 'react';

function DigitalClock(props: { time: Date, clockSettings: ClockSettings }) {
    const splitterColor = props.time.getSeconds() % 2 === 0 ? props.clockSettings.foreGroundColor : props.clockSettings.backgroundColor;

    useEffect(() => {
        document.body.style.backgroundColor = props.clockSettings.backgroundColor;
    }, [ props.clockSettings.backgroundColor ]);

    const style: React.CSSProperties = {
        paddingTop: props.clockSettings.topDistance,
        fontSize: `${props.clockSettings.sizeFactor}vmin`,
        fontWeight: 'bold',
        color: props.clockSettings.foreGroundColor,
        fontFamily: 'alarm clock',
        textShadow: `${props.clockSettings.sizeFactor / 100}vmin ${props.clockSettings.sizeFactor / 100}vmin ${props.clockSettings.shadeColor}`,
        display: 'flex',
        justifyContent: 'center',
        lineHeight: `${props.clockSettings.sizeFactor}vmin`
    };
    return (
        <Container style={style} >
            {moment(props.time).format('HH')}<div style={{ display: 'contents', color: splitterColor }}>:</div>{moment(props.time).format('mm')}
        </Container>
    );
}

export default DigitalClock;