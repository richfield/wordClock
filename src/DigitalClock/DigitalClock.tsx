import moment from 'moment';
import { Container } from 'react-bootstrap';
import { ClockSettings } from '../types';
import { useEffect } from 'react';

function DigitalClock(props: { time: Date, clockSettings: ClockSettings }) {
    const splitterColor = props.clockSettings.showSeconds ?
        props.clockSettings.foreGroundColor :
        props.time.getSeconds() % 2 === 0 ? props.clockSettings.foreGroundColor : props.clockSettings.shadeColor;

    useEffect(() => {
        document.body.style.backgroundColor = props.clockSettings.backgroundColor;
    }, [ props.clockSettings.backgroundColor ]);

    const style: React.CSSProperties = {
        paddingTop: props.clockSettings.topDistance,
        fontSize: `${props.clockSettings.sizeFactor}vmin`,
        fontWeight: 'bold',
        color: props.clockSettings.foreGroundColor,
        fontFamily: 'alarm clock',
        display: 'grid',
        justifyContent: 'center',
        lineHeight: `${props.clockSettings.sizeFactor}vmin`
    };

    return (
        <Container style={style} >
            <div style={{ zIndex: 1, gridColumn: 1, gridRow: 1 }}>
                {moment(props.time).format('HH')}<div style={{ display: 'contents', color: splitterColor }}>:</div>{moment(props.time).format('mm')}{props.clockSettings.showSeconds && `:${moment(props.time).format('ss')}`}
            </div>
            <div style={{ zIndex: -1, gridColumn: 1, gridRow: 1, color: props.clockSettings.shadeColor }}>
                88:88{props.clockSettings.showSeconds && ':88'}
            </div>
        </Container >

    );
}

export default DigitalClock;