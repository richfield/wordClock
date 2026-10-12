import { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import '@fontsource/mountains-of-christmas/latin-700.css';
import { ClockComponentProps } from '../types';
import { daysUntilChristmas, isChristmas, litCandles } from '../advent';
import './AdventClock.css';

const CENTER = { x: 200, y: 255 };
const RADIUS = 125;
const CANDLE_ANGLES = [ 155, 118, 62, 25 ];
const CANDLE_WIDTH = 26;
const CANDLE_HEIGHT = 92;
const BERRY_ANGLES = [ 0, 40, 85, 140, 180, 215, 250, 290, 330 ];
const BELOW_RING_Y = 445;

const pad = (value: number) => String(value).padStart(2, '0');

const pointOnRing = (angle: number, radius = RADIUS) => ({
    x: CENTER.x + radius * Math.cos(angle * Math.PI / 180),
    y: CENTER.y - radius * Math.sin(angle * Math.PI / 180)
});

const messageText = (time: Date): string => {
    if (isChristmas(time)) {
        return 'Fijne kerst!';
    }
    const days = daysUntilChristmas(time);
    return days === 1 ? 'nog 1 dag tot kerst' : `nog ${days} dagen tot kerst`;
};

const AdventClock = (props: ClockComponentProps): JSX.Element => {
    const { time, clockSettings } = props;
    const { backgroundColor, foreGroundColor, shadeColor, topDistance, sizeFactor, showSeconds } = clockSettings;
    const lit = litCandles(time);

    useEffect(() => {
        document.body.style.backgroundColor = backgroundColor;
    }, [ backgroundColor ]);

    const clock = `${pad(time.getHours())}:${pad(time.getMinutes())}${showSeconds ? `:${pad(time.getSeconds())}` : ''}`;
    const message = messageText(time);

    return (
        <Container fluid style={{ paddingTop: topDistance, textAlign: 'center' }}>
            <svg
                viewBox='0 0 400 460'
                role='img'
                aria-label={`Adventskrans met ${lit} brandende kaarsen`}
                style={{ width: `${sizeFactor}vmin`, maxWidth: '100%', height: 'auto' }}
            >
                <defs>
                    <radialGradient id='advent-glow'>
                        <stop offset='0%' stopColor={foreGroundColor} stopOpacity='0.5' />
                        <stop offset='100%' stopColor={foreGroundColor} stopOpacity='0' />
                    </radialGradient>
                </defs>
                <circle cx={CENTER.x} cy={CENTER.y} r={RADIUS} fill='none' stroke='#1b4d26' strokeWidth='36' />
                <circle cx={CENTER.x} cy={CENTER.y} r={RADIUS} fill='none' stroke='#2f7d3c' strokeWidth='26' strokeDasharray='16 5' />
                <circle cx={CENTER.x} cy={CENTER.y} r={RADIUS} fill='none' stroke='#46a057' strokeWidth='12' strokeDasharray='6 14' />
                {BERRY_ANGLES.map(angle => {
                    const { x, y } = pointOnRing(angle, RADIUS + 4);
                    return <circle key={angle} cx={x} cy={y} r='5' fill='#c02731' />;
                })}
                {CANDLE_ANGLES.map((angle, index) => {
                    const base = pointOnRing(angle);
                    const x = base.x;
                    const bottom = base.y + 6;
                    const top = bottom - CANDLE_HEIGHT;
                    const burning = index < lit;
                    return (
                        <g key={angle}>
                            {burning && <circle cx={x} cy={top - 16} r='44' fill='url(#advent-glow)' />}
                            <rect x={x - CANDLE_WIDTH / 2} y={top} width={CANDLE_WIDTH} height={CANDLE_HEIGHT} rx='3' fill={shadeColor} />
                            <rect x={x - CANDLE_WIDTH / 2} y={top} width='6' height={CANDLE_HEIGHT} rx='3' fill='#ffffff' opacity='0.14' />
                            <ellipse cx={x} cy={bottom} rx={CANDLE_WIDTH / 2 + 5} ry='6' fill='#2f7d3c' />
                            <line x1={x} y1={top} x2={x} y2={top - 7} stroke='#222' strokeWidth='2' />
                            {burning && (
                                <g className={`advent-flame advent-flame-${index + 1}`} data-testid='flame'>
                                    <path
                                        d={`M ${x} ${top - 34} C ${x + 11} ${top - 18}, ${x + 8} ${top - 5}, ${x} ${top - 5} C ${x - 8} ${top - 5}, ${x - 11} ${top - 18}, ${x} ${top - 34} Z`}
                                        fill={foreGroundColor}
                                    />
                                    <ellipse cx={x} cy={top - 12} rx='3.5' ry='6' fill='#ffffff' opacity='0.8' />
                                </g>
                            )}
                        </g>
                    );
                })}
                <g fill={foreGroundColor} textAnchor='middle' className='advent-text'>
                    <text x={CENTER.x} y={CENTER.y + 25} fontSize={showSeconds ? 60 : 84}>{clock}</text>
                    <text x={CENTER.x} y={BELOW_RING_Y} fontSize='34' opacity='0.9'>{message}</text>
                </g>
            </svg>
        </Container>
    );
};

export default AdventClock;
