import { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { ClockComponentProps } from '../types';
import { daysUntilChristmas, isChristmas, litCandles } from '../advent';
import './AdventClock.css';

const WREATH = { cx: 200, cy: 215, rx: 175, ry: 42 };
const CANDLE_X = [ 90, 163, 237, 310 ];
const CANDLE_WIDTH = 30;
const CANDLE_HEIGHT = 105;

const pad = (value: number) => String(value).padStart(2, '0');

const daysText = (time: Date): string => {
    if (isChristmas(time)) {
        return 'Fijne kerst!';
    }
    const days = daysUntilChristmas(time);
    return days === 1 ? 'Nog 1 dag tot kerst' : `Nog ${days} dagen tot kerst`;
};

// The candle foot sits on the back half of the wreath so the greenery overlaps it
const candleBase = (x: number): number => {
    const dx = (x - WREATH.cx) / WREATH.rx;
    return WREATH.cy - WREATH.ry * Math.sqrt(Math.max(0, 1 - dx * dx)) + 14;
};

const BERRIES = [ [ 60, 232 ], [ 120, 250 ], [ 200, 257 ], [ 285, 250 ], [ 340, 232 ], [ 140, 178 ], [ 262, 178 ] ];

const AdventClock = (props: ClockComponentProps): JSX.Element => {
    const { time, clockSettings } = props;
    const { backgroundColor, foreGroundColor, shadeColor, topDistance, sizeFactor, showSeconds } = clockSettings;
    const lit = litCandles(time);

    useEffect(() => {
        document.body.style.backgroundColor = backgroundColor;
    }, [ backgroundColor ]);

    const clock = `${pad(time.getHours())}:${pad(time.getMinutes())}${showSeconds ? `:${pad(time.getSeconds())}` : ''}`;

    return (
        <Container fluid style={{ paddingTop: topDistance, textAlign: 'center', color: foreGroundColor }}>
            <svg
                viewBox='0 0 400 290'
                role='img'
                aria-label={`Adventskrans met ${lit} brandende kaarsen`}
                style={{ width: `${sizeFactor}vmin`, maxWidth: '100%', height: 'auto' }}
            >
                <defs>
                    <radialGradient id='advent-glow'>
                        <stop offset='0%' stopColor={foreGroundColor} stopOpacity='0.55' />
                        <stop offset='100%' stopColor={foreGroundColor} stopOpacity='0' />
                    </radialGradient>
                </defs>
                <ellipse cx={WREATH.cx} cy={WREATH.cy} rx={WREATH.rx} ry={WREATH.ry} fill='none' stroke='#1f5a2b' strokeWidth='34' />
                <ellipse cx={WREATH.cx} cy={WREATH.cy} rx={WREATH.rx} ry={WREATH.ry} fill='none' stroke='#2f7d3c' strokeWidth='22' strokeDasharray='14 6' />
                {BERRIES.map(([ x, y ]) => <circle key={`${x}-${y}`} cx={x} cy={y} r='5' fill='#b3202a' />)}
                {CANDLE_X.map((x, index) => {
                    const base = candleBase(x);
                    const top = base - CANDLE_HEIGHT;
                    const burning = index < lit;
                    return (
                        <g key={x}>
                            {burning && <circle cx={x} cy={top - 18} r='46' fill='url(#advent-glow)' />}
                            <rect x={x - CANDLE_WIDTH / 2} y={top} width={CANDLE_WIDTH} height={CANDLE_HEIGHT} rx='3' fill={shadeColor} />
                            <rect x={x - CANDLE_WIDTH / 2} y={top} width='7' height={CANDLE_HEIGHT} rx='3' fill='#ffffff' opacity='0.12' />
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
                <path
                    d={`M ${WREATH.cx - WREATH.rx} ${WREATH.cy} A ${WREATH.rx} ${WREATH.ry} 0 0 0 ${WREATH.cx + WREATH.rx} ${WREATH.cy}`}
                    fill='none' stroke='#2f7d3c' strokeWidth='34' strokeLinecap='round'
                />
                <path
                    d={`M ${WREATH.cx - WREATH.rx} ${WREATH.cy} A ${WREATH.rx} ${WREATH.ry} 0 0 0 ${WREATH.cx + WREATH.rx} ${WREATH.cy}`}
                    fill='none' stroke='#3f9a4d' strokeWidth='20' strokeDasharray='14 6'
                />
            </svg>
            <div style={{ fontSize: `${sizeFactor / 7}vmin`, fontWeight: 'bold', lineHeight: 1.1 }}>{clock}</div>
            <div style={{ fontSize: `${sizeFactor / 18}vmin`, opacity: 0.85 }}>{daysText(time)}</div>
        </Container>
    );
};

export default AdventClock;
