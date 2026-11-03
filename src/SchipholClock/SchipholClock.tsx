import { useEffect, useLayoutEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { ClockComponentProps } from '../types';
import { DURATION, frameAt, handSegment, poseAt } from './choreography';
import { CENTER, HOUR_LENGTH, MINUTE_LENGTH, Point, handAngles, handPath, spiralPath } from './hands';

const FACE_RADIUS = 192;
const MAN_COLOR = '#1c2452';

interface Hands {
    hour: string,
    minute: string,
    angles: { hour: number, minute: number }
}

interface Drawing {
    key: number,
    hands: Hands,
    previous: Hands | null,
    run: number
}

const buildHands = (time: Date, minuteKey: number): Hands => {
    const angles = handAngles(time);
    return {
        hour: handPath(angles.hour, HOUR_LENGTH, 17, minuteKey),
        minute: handPath(angles.minute, MINUTE_LENGTH, 12, minuteKey + 7919),
        angles
    };
};

const HandShapes = ({ hands, color, mask }: { hands: Hands, color: string, mask?: string }) => (
    <g fill={color} mask={mask}>
        <path d={hands.hour} />
        <path d={hands.minute} />
    </g>
);

interface ManRefs {
    torso: React.RefObject<SVGGElement>,
    legs: React.RefObject<SVGPathElement>,
    working: React.RefObject<SVGPolylineElement>,
    resting: React.RefObject<SVGPolylineElement>,
    tool: React.RefObject<SVGCircleElement>
}

// Blurred figure behind the frosted screen. The torso is drawn around the hip, everything else in dial coordinates.
const Man = ({ refs }: { refs: ManRefs }) => (
    <g fill={MAN_COLOR} stroke={MAN_COLOR} opacity='0.8' strokeLinecap='round' strokeLinejoin='round'>
        <path ref={refs.legs} fill='none' strokeWidth='30' />
        <polyline ref={refs.resting} fill='none' strokeWidth='20' />
        <g ref={refs.torso}>
            <path d='M-33 -120 L33 -120 L25 0 L-25 0 Z' strokeWidth='14' />
            <rect x='-7' y='-140' width='14' height='24' stroke='none' />
            <circle cx='0' cy='-156' r='19' stroke='none' />
        </g>
        <polyline ref={refs.working} fill='none' stroke='#101640' strokeWidth='20' />
        <circle ref={refs.tool} fill='#141a40' stroke='none' r='24' />
    </g>
);
interface WipeProps {
    previous: Hands,
    hands: Hands,
    run: number,
    color: string
}

/**
 * The man wipes the old hands away in a spiral with a cloth, then paints the new hands.
 * His body follows his hand so the arm keeps the same length.
 */
const Wipe = ({ previous, hands, run, color }: WipeProps) => {
    const wipeRef = useRef<SVGPathElement>(null);
    const hourRef = useRef<SVGLineElement>(null);
    const minuteRef = useRef<SVGLineElement>(null);
    const fadeRef = useRef<SVGGElement>(null);
    const torso = useRef<SVGGElement>(null);
    const legs = useRef<SVGPathElement>(null);
    const working = useRef<SVGPolylineElement>(null);
    const resting = useRef<SVGPolylineElement>(null);
    const tool = useRef<SVGCircleElement>(null);

    useLayoutEffect(() => {
        const elements = [ wipeRef, hourRef, minuteRef, fadeRef, torso, legs, working, resting, tool ].map(ref => ref.current);
        if (elements.some(element => element === null)) {
            return undefined;
        }
        const [ wipeEl, hourEl, minuteEl, fadeEl, torsoEl, legsEl, workingEl, restingEl, toolEl ] = elements as SVGElement[];
        const hour = handSegment(hands.angles.hour, HOUR_LENGTH);
        const minute = handSegment(hands.angles.minute, MINUTE_LENGTH);

        const setLine = (line: SVGElement, from: { x: number, y: number }, to: { x: number, y: number }, amount: number) => {
            line.setAttribute('x1', String(from.x));
            line.setAttribute('y1', String(from.y));
            line.setAttribute('x2', String(from.x + (to.x - from.x) * amount));
            line.setAttribute('y2', String(from.y + (to.y - from.y) * amount));
        };

        const apply = (elapsed: number) => {
            const frame = frameAt(elapsed, hands.angles);
            const pose = poseAt(elapsed, frame);
            const points = (arm: { shoulder: Point, elbow: Point, hand: Point }) =>
                [ arm.shoulder, arm.elbow, arm.hand ].map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
            wipeEl.setAttribute('d', frame.wipe > 0 ? spiralPath(frame.wipe) : '');
            setLine(hourEl, hour.start, hour.tip, frame.hour);
            setLine(minuteEl, minute.start, minute.tip, frame.minute);
            fadeEl.setAttribute('opacity', String(frame.opacity));
            torsoEl.setAttribute('transform', `translate(${pose.hip.x} ${pose.hip.y}) rotate(${pose.lean})`);
            const [ left, right ] = pose.feet;
            const [ leftKnee, rightKnee ] = pose.knees;
            legsEl.setAttribute('d', `M${pose.hip.x - 9 * (1 - pose.walking)} ${pose.hip.y} L${leftKnee.x} ${leftKnee.y} L${left.x} ${left.y} M${pose.hip.x + 9 * (1 - pose.walking)} ${pose.hip.y} L${rightKnee.x} ${rightKnee.y} L${right.x} ${right.y}`);
            workingEl.setAttribute('points', points(pose.working));
            restingEl.setAttribute('points', points(pose.resting));
            toolEl.setAttribute('cx', String(pose.working.hand.x));
            toolEl.setAttribute('cy', String(pose.working.hand.y));
            toolEl.setAttribute('r', String(pose.toolRadius));        };

        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            apply(DURATION);
            return undefined;
        }

        const start = performance.now();
        let frame = 0;
        const tick = (now: number) => {
            const elapsed = Math.min(DURATION, now - start);
            apply(elapsed);
            if (elapsed < DURATION) {
                frame = requestAnimationFrame(tick);
            }
        };
        apply(0);
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [ hands ]);

    return (
        <g>
            <defs>
                <mask id={`schiphol-old-${run}`}>
                    <rect x='0' y='0' width='400' height='400' fill='white' />
                    <path ref={wipeRef} fill='none' stroke='black' strokeWidth='56' strokeLinecap='round' strokeLinejoin='round' />
                </mask>
                <mask id={`schiphol-new-${run}`}>
                    <line ref={hourRef} stroke='white' strokeWidth='40' />
                    <line ref={minuteRef} stroke='white' strokeWidth='40' />
                </mask>
            </defs>
            <g clipPath='url(#schiphol-face)'>
                <g ref={fadeRef} filter='url(#schiphol-blur)' opacity='0' data-testid='schiphol-man'>
                    <Man refs={{ torso, legs, working, resting, tool }} />
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
