import { useEffect, useLayoutEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { ClockComponentProps } from '../types';
import { DURATION, LEG_OFFSET, TORSO, frameAt, handSegment, poseAt } from './choreography';
import { Point, CENTER, HOUR_LENGTH, MINUTE_LENGTH, handAngles, handPath, spiralPath } from './hands';

const FACE_RADIUS = 192;
const MAN_COLOR = '#26306a';
const HEAD_COLOR = '#36427f';
const LEG_COLOR = '#1a2150';
const ARM_COLOR = '#222b5f';
const HAND_COLOR = '#141a40';
// The broom keeps its length; the hand slides along the pole
const BROOM_LENGTH = 220;
const BROOM_HANDLE = '#3a2f2a';
const BROOM_HEAD = '#4a3b2c';

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
    restHand: React.RefObject<SVGCircleElement>,
    tool: React.RefObject<SVGCircleElement>,
    broom: React.RefObject<SVGGElement>,
    pole: React.RefObject<SVGLineElement>,
    head: React.RefObject<SVGRectElement>
}

// A blurred Lego minifig behind the frosted screen. The torso is drawn around the hip, everything else in dial coordinates.
const Man = ({ refs }: { refs: ManRefs }) => (
    <g opacity='0.85'>
        <path ref={refs.legs} fill='none' stroke={LEG_COLOR} strokeWidth='50' strokeLinecap='butt' />
        <polyline ref={refs.resting} fill='none' stroke={ARM_COLOR} strokeWidth='32' strokeLinecap='round' strokeLinejoin='round' />
        <circle ref={refs.restHand} r='17' fill={HAND_COLOR} />
        <g ref={refs.torso}>
            <rect x='-52' y='-26' width='104' height='26' fill={LEG_COLOR} />
            <rect x='-52' y={-TORSO} width='104' height={TORSO - 26} fill={MAN_COLOR} />
            <rect x='-38' y={-TORSO - 70} width='76' height='70' rx='20' fill={HEAD_COLOR} />
            <rect x='-15' y={-TORSO - 82} width='30' height='14' rx='5' fill={HEAD_COLOR} />
        </g>
        <polyline ref={refs.working} fill='none' stroke={ARM_COLOR} strokeWidth='32' strokeLinecap='round' strokeLinejoin='round' />
        <g ref={refs.broom}>
            <line ref={refs.pole} x1='0' y1='0' y2='0' stroke={BROOM_HANDLE} strokeWidth='9' strokeLinecap='round' />
            <rect ref={refs.head} x='-34' y='-30' width='34' height='60' rx='6' fill={BROOM_HEAD} />
        </g>
        <circle ref={refs.tool} r='24' fill={HAND_COLOR} />
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
 * He stands still and reaches with a broom of fixed length.
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
    const restHand = useRef<SVGCircleElement>(null);
    const tool = useRef<SVGCircleElement>(null);
    const broom = useRef<SVGGElement>(null);
    const pole = useRef<SVGLineElement>(null);
    const head = useRef<SVGRectElement>(null);

    useLayoutEffect(() => {
        const elements = [ wipeRef, hourRef, minuteRef, fadeRef, torso, legs, working, resting, restHand, tool, broom, pole, head ].map(ref => ref.current);
        if (elements.some(element => element === null)) {
            return undefined;
        }
        const [ wipeEl, hourEl, minuteEl, fadeEl, torsoEl, legsEl, workingEl, restingEl, restHandEl, toolEl, broomEl, poleEl, headEl ] = elements as SVGElement[];
        const hour = handSegment(hands.angles.hour, HOUR_LENGTH);
        const minute = handSegment(hands.angles.minute, MINUTE_LENGTH);

        const setArm = (el: SVGElement, arm: { shoulder: Point, elbow: Point, hand: Point }) =>
            el.setAttribute('points', [ arm.shoulder, arm.elbow, arm.hand ].map(p => `${p.x},${p.y}`).join(' '));
        const setLine = (line: SVGElement, from: { x: number, y: number }, to: { x: number, y: number }, amount: number) => {
            line.setAttribute('x1', String(from.x));
            line.setAttribute('y1', String(from.y));
            line.setAttribute('x2', String(from.x + (to.x - from.x) * amount));
            line.setAttribute('y2', String(from.y + (to.y - from.y) * amount));
        };

        const apply = (elapsed: number) => {
            const frame = frameAt(elapsed, hands.angles);
            const pose = poseAt(elapsed, frame);
            wipeEl.setAttribute('d', frame.wipe > 0 ? spiralPath(frame.wipe) : '');
            setLine(hourEl, hour.start, hour.tip, frame.hour);
            setLine(minuteEl, minute.start, minute.tip, frame.minute);
            fadeEl.setAttribute('opacity', String(frame.opacity));
            torsoEl.setAttribute('transform', `translate(${pose.hip.x} ${pose.hip.y})`);
            const [ left, right ] = pose.feet;
            legsEl.setAttribute('d', `M${pose.hip.x - LEG_OFFSET} ${pose.hip.y} L${left.x} ${left.y} M${pose.hip.x + LEG_OFFSET} ${pose.hip.y} L${right.x} ${right.y}`);
            setArm(workingEl, pose.working);
            setArm(restingEl, pose.resting);
            restHandEl.setAttribute('cx', String(pose.resting.hand.x));
            restHandEl.setAttribute('cy', String(pose.resting.hand.y));            const { tip } = pose;
            const grip = pose.working.hand;
            const angle = Math.atan2(tip.y - grip.y, tip.x - grip.x) * 180 / Math.PI;
            broomEl.setAttribute('transform', `translate(${tip.x} ${tip.y}) rotate(${angle})`);
            broomEl.setAttribute('opacity', String(frame.engage > 0 ? 1 : 0));
            poleEl.setAttribute('x2', String(-BROOM_LENGTH));
            headEl.setAttribute('opacity', String(1 - frame.tool));
            toolEl.setAttribute('cx', String(tip.x));
            toolEl.setAttribute('cy', String(tip.y));
            toolEl.setAttribute('r', String(pose.toolRadius));
            toolEl.setAttribute('opacity', String(frame.tool));
        };

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
                    <Man refs={{ torso, legs, working, resting, restHand, tool, broom, pole, head }} />
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
                        <feGaussianBlur stdDeviation='5' />
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
