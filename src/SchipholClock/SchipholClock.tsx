import { useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { ClockComponentProps } from '../types';
import { CENTER, handAngles, handPath } from './hands';
import './SchipholClock.css';

const HOUR_LENGTH = 105;
const MINUTE_LENGTH = 160;

interface Hands {
    hour: string,
    minute: string
}

interface Drawing {
    key: number,
    hands: Hands,
    previous: Hands | null,
    run: number
}

const buildHands = (time: Date, minuteKey: number): Hands => {
    const { hour, minute } = handAngles(time);
    return {
        hour: handPath(hour, HOUR_LENGTH, 17, minuteKey),
        minute: handPath(minute, MINUTE_LENGTH, 12, minuteKey + 7919)
    };
};

const HandShapes = ({ hands, color, mask }: { hands: Hands, color: string, mask?: string }) => (
    <g fill={color} mask={mask}>
        <path d={hands.hour} />
        <path d={hands.minute} />
    </g>
);

/**
 * Inspired by Maarten Baas' "Schiphol Clock": every minute the old hands are wiped away
 * with a squeegee and the new ones are drawn on the way back.
 */
const SchipholClock = (props: ClockComponentProps): JSX.Element => {
    const { time, clockSettings } = props;
    const { backgroundColor, foreGroundColor, shadeColor, topDistance, sizeFactor } = clockSettings;
    const minuteKey = Math.floor(time.getTime() / 60000);
    const drawing = useRef<Drawing | null>(null);

    if (drawing.current === null) {
        drawing.current = { key: minuteKey, hands: buildHands(time, minuteKey), previous: null, run: 0 };
    } else if (drawing.current.key !== minuteKey) {
        drawing.current = {
            key: minuteKey,
            hands: buildHands(time, minuteKey),
            previous: drawing.current.hands,
            run: drawing.current.run + 1
        };
    }
    const { hands, previous, run } = drawing.current;

    useEffect(() => {
        document.body.style.backgroundColor = backgroundColor;
    }, [ backgroundColor ]);

    return (
        <Container fluid style={{ paddingTop: topDistance, textAlign: 'center' }}>
            <svg
                viewBox='0 0 400 400'
                role='img'
                aria-label={`Klok: ${time.getHours()} uur ${time.getMinutes()} minuten`}
                style={{ width: `${sizeFactor}vmin`, maxWidth: '100%', height: 'auto' }}
            >
                <circle cx={CENTER} cy={CENTER} r='190' fill='none' stroke={shadeColor} strokeWidth='2' />
                {Array.from({ length: 12 }, (_, index) => (
                    <line
                        key={index}
                        x1={CENTER}
                        y1='18'
                        x2={CENTER}
                        y2={index % 3 === 0 ? 34 : 26}
                        stroke={shadeColor}
                        strokeWidth={index % 3 === 0 ? 4 : 2}
                        transform={`rotate(${index * 30} ${CENTER} ${CENTER})`}
                    />
                ))}
                {previous ? (
                    <g key={run}>
                        <defs>
                            <mask id={`schiphol-old-${run}`}>
                                <rect x='0' y='0' width='400' height='400' fill='white' />
                                <rect className='schiphol-wipe-mask' x='0' y='0' width='0' height='400' fill='black' />
                            </mask>
                            <mask id={`schiphol-new-${run}`}>
                                <rect className='schiphol-draw-mask' x='400' y='0' width='0' height='400' fill='white' />
                            </mask>
                        </defs>
                        <HandShapes hands={previous} color={foreGroundColor} mask={`url(#schiphol-old-${run})`} />
                        <HandShapes hands={hands} color={foreGroundColor} mask={`url(#schiphol-new-${run})`} />
                        <rect className='schiphol-squeegee-forward' x='-4' y='5' width='8' height='390' rx='3' fill={shadeColor} />
                        <rect className='schiphol-squeegee-back' x='-4' y='5' width='8' height='390' rx='3' fill={shadeColor} />
                    </g>
                ) : (
                    <HandShapes hands={hands} color={foreGroundColor} />
                )}
            </svg>
        </Container>
    );
};

export default SchipholClock;
