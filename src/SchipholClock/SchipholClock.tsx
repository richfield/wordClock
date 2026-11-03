import { useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { ClockComponentProps } from '../types';
import { CENTER, handAngles, handPath } from './hands';
import './SchipholClock.css';

const HOUR_LENGTH = 105;
const MINUTE_LENGTH = 155;
const FACE_RADIUS = 192;

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

// Blurred figure behind the frosted screen, standing with his feet at the bottom of the dial
const Man = () => (
    <g fill='#2a3566' opacity='0.6'>
        <circle cx='95' cy='120' r='19' />
        <rect x='60' y='142' width='70' height='115' rx='26' />
        <rect x='46' y='150' width='20' height='95' rx='10' />
        <rect x='124' y='150' width='20' height='95' rx='10' />
        <rect x='68' y='250' width='23' height='140' rx='9' />
        <rect x='99' y='250' width='23' height='140' rx='9' />
    </g>
);

/**
 * Inspired by Maarten Baas' "Schiphol Clock": every minute a man behind the screen
 * wipes the old hands away and paints the new ones.
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
                <defs>
                    <clipPath id='schiphol-face'>
                        <circle cx={CENTER} cy={CENTER} r={FACE_RADIUS} />
                    </clipPath>
                    <filter id='schiphol-blur' x='-50%' y='-20%' width='200%' height='140%'>
                        <feGaussianBlur stdDeviation='7' />
                    </filter>
                </defs>
                <circle cx={CENTER} cy={CENTER} r={FACE_RADIUS} fill={shadeColor} />
                {Array.from({ length: 60 }, (_, index) => {
                    const isHour = index % 5 === 0;
                    return (
                        <line
                            key={index}
                            x1={CENTER}
                            y1={CENTER - FACE_RADIUS + 6}
                            x2={CENTER}
                            y2={CENTER - FACE_RADIUS + (isHour ? 30 : 15)}
                            stroke={foreGroundColor}
                            strokeWidth={isHour ? 6 : 2}
                            transform={`rotate(${index * 6} ${CENTER} ${CENTER})`}
                        />
                    );
                })}
                {previous ? (
                    <g key={run}>
                        <defs>
                            <mask id={`schiphol-old-${run}`}>
                                <rect x='0' y='0' width='400' height='400' fill='white' />
                                <circle className='schiphol-erase-mask' cx={CENTER} cy={CENTER} r='0' fill='black' />
                            </mask>
                            <mask id={`schiphol-new-${run}`}>
                                <circle className='schiphol-draw-mask' cx={CENTER} cy={CENTER} r='0' fill='white' />
                            </mask>
                        </defs>
                        <g clipPath='url(#schiphol-face)'>
                            <g className='schiphol-man' filter='url(#schiphol-blur)' data-testid='schiphol-man'>
                                <Man />
                            </g>
                        </g>
                        <HandShapes hands={previous} color={foreGroundColor} mask={`url(#schiphol-old-${run})`} />
                        <HandShapes hands={hands} color={foreGroundColor} mask={`url(#schiphol-new-${run})`} />
                    </g>
                ) : (
                    <HandShapes hands={hands} color={foreGroundColor} />
                )}
                <circle cx={CENTER} cy={CENTER} r='9' fill={foreGroundColor} />
            </svg>
        </Container>
    );
};

export default SchipholClock;
