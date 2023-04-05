import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { Container } from 'react-bootstrap';
import { formatTime, invertHex, toColor } from '../helpers';
import { useState } from 'react';
import alarm from '../assets/alarm.mp3';
import useSound from 'use-sound';
import { ClockComponentProps } from '../types';

const Countdown = (props: ClockComponentProps): JSX.Element => {
    const [ play ] = useSound(alarm, { interrupt: true });
    const [ animate, setAnimate ] = useState<boolean>(true);
    const height = (window.innerHeight * 80) / 100;
    const [ format, setFormat ] = useState<string>('HH:mm:ss');
    const [ fontSize, setFontSize ] = useState(height / 5);
    const backGroundColor = props.clockSettings.backgroundColor;
    const textColor = invertHex(backGroundColor);
    const updating = (remainingTime: number) => {
        if (remainingTime < 60) {
            setFormat('ss');
            setFontSize(height / 2.5);
        } else if (remainingTime < 3600) {
            setFontSize(height / 5);
            setFormat('mm:ss');
        } else {
            setFormat('HH:mm:ss');
        }
    };

    const onFinished = () => {
        props.finished && props.finished();
        setAnimate(false);
        play();
        return { shouldRepeat: false, delay: 5, newInitialRemainingTime: 0 };
    };

    const duration = props.timer || 0;
    document.body.style.backgroundColor = backGroundColor;
    return <Container style={{ display: 'flex', justifyContent: 'center', paddingTop: props.clockSettings.topDistance }}>
        <CountdownCircleTimer
            isPlaying={animate}
            duration={duration}
            size={height}
            strokeWidth={height / 10}
            colors={toColor(props.clockSettings.foreGroundColor)}
            trailColor={toColor(props.clockSettings.shadeColor)}
            onUpdate={updating}
            onComplete={onFinished}
        >
            {({ remainingTime }) => <span style={{ fontSize: fontSize, color: textColor }}>{formatTime(remainingTime, format)}</span>}
        </CountdownCircleTimer>
    </Container>;
};



export default Countdown;