import { RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { ClockComponentProps } from '../types';
import { CENTER, handAngles, handPath, spiralPath } from './hands';
import './SchipholClock.css';

const HOUR_LENGTH = 105;
const MINUTE_LENGTH = 155;
const FACE_RADIUS = 192;

// Must match the keyframes in SchipholClock.css
const MAN_OFFSET = 85;
const SHOULDER = { x: 134, y: 160 };
const REST = { x: 134, y: 250 };
const ARM_RAISED_AT = 1600;
const WIPE_START = 2200;
const WIPE_END = 4200;
const ARM_LOWERED_AT = 4500;
const WIPE_WIDTH = 56;
const SPIRAL = spiralPath();

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

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const blend = (from: { x: number, y: number }, to: { x: number, y: number }, amount: number) => ({
    x: from.x + (to.x - from.x) * amount,
    y: from.y + (to.y - from.y) * amount
});

const HandShapes = ({ hands, color, mask }: { hands: Hands, color: string, mask?: string }) => (
    <g fill={color} mask={mask}>
        <path d={hands.hour} />
        <path d={hands.minute} />
    </g>
);

// Blurred figure behind the frosted screen; his right arm is drawn separately so it can wipe
const Man = ({ armRef, clothRef }: { armRef: RefObject<SVGLineElement>, clothRef: RefObject<SVGCircleElement> }) => (
    <g fill='#2a3566' opacity='0.6'>
        <circle cx='95' cy='120' r='19' />
        <rect x='60' y='142' width='70' height='115' rx='26' />
        <rect x='46' y='150' width='20' height='95' rx='10' />
        <rect x='68' y='250' width='23' height='140' rx='9' />
        <rect x='99' y='250' width='23' height='140' rx='9' />
        <line
            ref={armRef}
            x1={SHOULDER.x}
            y1={SHOULDER.y}
            x2={REST.x}
            y2={REST.y}
            stroke='#1b2352'
            strokeWidth='22'
            strokeLinecap='round'
        />
        <circle ref={clothRef} cx={REST.x} cy={REST.y} r='20' fill='#141a40' />
    </g>
);

interface WipeProps {
    previous: Hands,
    hands: Hands,
    run: number,
    color: string
}

/**
 * The man raises his arm and wipes the old hands away in a spiral; the erased area follows his
 * cloth exactly. Then the new hands are painted in.
 */
const Wipe = ({ previous, hands, run, color }: WipeProps) => {
    const pathRef = useRef<SVGPathElement>(null);
    const armRef = useRef<SVGLineElement>(null);
    const clothRef = useRef<SVGCircleElement>(null);

    useLayoutEffect(() => {
        const path = pathRef.current;
        const arm = armRef.current;
        const cloth = clothRef.current;
        if (!path || !arm || !cloth) {
            return undefined;
        }
        const length = path.getTotalLength();
        path.style.strokeDasharray = `${length}`;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            path.style.strokeDashoffset = '0';
            return undefined;
        }

        const toMan = (point: { x: number, y: number }) => ({ x: point.x - MAN_OFFSET, y: point.y });
        const apply = (elapsed: number) => {
            const progress = clamp((elapsed - WIPE_START) / (WIPE_END - WIPE_START));
            const clothPoint = toMan(path.getPointAtLength(progress * length));
            let target = clothPoint;
            if (elapsed < WIPE_START) {
                target = blend(REST, clothPoint, clamp((elapsed - ARM_RAISED_AT) / (WIPE_START - ARM_RAISED_AT)));
            } else if (elapsed > WIPE_END) {
                target = blend(clothPoint, REST, clamp((elapsed - WIPE_END) / (ARM_LOWERED_AT - WIPE_END)));
            }
            path.style.strokeDashoffset = `${length * (1 - progress)}`;
            arm.setAttribute('x2', String(target.x));
            arm.setAttribute('y2', String(target.y));
            cloth.setAttribute('cx', String(target.x));
            cloth.setAttribute('cy', String(target.y));
        };

        const start = performance.now();
        let frame = 0;
        const tick = (now: number) => {
            const elapsed = now - start;
            apply(elapsed);
            if (elapsed < ARM_LOWERED_AT) {
                frame = requestAnimationFrame(tick);
            }
        };
        apply(0);
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <g>
            <defs>
                <mask id={`schiphol-old-${run}`}>
                    <rect x='0' y='0' width='400' height='400' fill='white' />
                    <path ref={pathRef} d={SPIRAL} fill='none' stroke='black' strokeWidth={WIPE_WIDTH} strokeLinecap='round' strokeLinejoin='round' />
                </mask>
                <mask id={`schiphol-new-${run}`}>
                    <circle className='schiphol-draw-mask' cx={CENTER} cy={CENTER} r='0' fill='white' />
                </mask>
            </defs>
            <g clipPath='url(#schiphol-face)'>
                <g className='schiphol-man' filter='url(#schiphol-blur)' data-testid='schiphol-man'>
                    <Man armRef={armRef} clothRef={clothRef} />
                </g>
            </g>
            <HandShapes hands={previous} color={color} mask={`url(#schiphol-old-${run})`} />
            <HandShapes hands={hands} color={color} mask={`url(#schiphol-new-${run})`} />
        </g>
    );
};

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
                    <Wipe key={run} previous={previous} hands={hands} run={run} color={foreGroundColor} />
                ) : (
                    <HandShapes hands={hands} color={foreGroundColor} />
                )}
                <circle cx={CENTER} cy={CENTER} r='9' fill={foreGroundColor} />
            </svg>
        </Container>
    );
};

export default SchipholClock;
