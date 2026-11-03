import { HOUR_LENGTH, MINUTE_LENGTH, Point, spiralPoint, tipPoint } from './hands';

export const TIME_SCALE = 1.7;
export const DURATION = 7500 * TIME_SCALE;
export const FLOOR = 400;
// A minifig: stiff, straight arms and blocky legs
export const ARM_LENGTH = 86;
export const UPPER_ARM = 50;
export const FOREARM = 50;
export const TORSO = 96;
export const SHOULDER_HALF = 68;
export const SHOULDER_DROP = 82;
export const LEG = 90;
export const LEG_OFFSET = 27;

// Both tools are extensions of his arm; the hand slides along the handle
export const BROOM_LENGTH = 220;
export const BRUSH_LENGTH = 85;

const HAND_BACK = 25;
const ENTER_X = -130;
// While wiping with the long broom he stays here; for painting he walks along with the brush
const STAND_X = 30;
const PAINT_DISTANCE = 148;
const PAINT_MIN_X = 0;
const PAINT_MAX_X = 300;
const STRIDE = 34;

const scaled = (start: number, end: number) => [ start * TIME_SCALE, end * TIME_SCALE ] as const;

const TIMES = {
    engage: scaled(600, 1500),
    wipe: scaled(1500, 3700),
    toHour: scaled(3700, 4300),
    hour: scaled(4300, 5100),
    toMinute: scaled(5100, 5700),
    minute: scaled(5700, 6500),
    disengage: scaled(6500, 7300),
    walkIn: scaled(0, 1500),
    walkOut: scaled(6500, 7500)
} as const;

type Range = readonly [ number, number ];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;
const progress = (elapsed: number, [ start, end ]: Range) => ease(clamp((elapsed - start) / (end - start)));
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;
const lerp = (from: Point, to: Point, amount: number): Point => ({ x: mix(from.x, to.x, amount), y: mix(from.y, to.y, amount) });
const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const scale = (a: Point, factor: number): Point => ({ x: a.x * factor, y: a.y * factor });
const direction = (a: Point): Point => {
    const length = Math.hypot(a.x, a.y);
    return length > 1e-6 ? scale(a, 1 / length) : { x: 0, y: 1 };
};

export interface HandSegment {
    start: Point,
    tip: Point
}

export const handSegment = (angle: number, length: number): HandSegment => ({
    start: tipPoint(angle, -HAND_BACK),
    tip: tipPoint(angle, length)
});

export interface Frame {
    hand: Point,
    wipe: number,
    hour: number,
    minute: number,
    opacity: number,
    engage: number,
    tool: number,
    // Where he stands (hip, x) and how fast he is walking
    stand: number,
    pace: number
}

type Angles = { hour: number, minute: number };

const handAt = (elapsed: number, angles: Angles): Point => {
    const hour = handSegment(angles.hour, HOUR_LENGTH);
    const minute = handSegment(angles.minute, MINUTE_LENGTH);
    const wipe = progress(elapsed, TIMES.wipe);
    const hourDone = progress(elapsed, TIMES.hour);
    const minuteDone = progress(elapsed, TIMES.minute);

    let hand: Point;
    if (elapsed < TIMES.wipe[ 0 ]) {
        hand = spiralPoint(0);
    } else if (elapsed < TIMES.wipe[ 1 ]) {
        hand = spiralPoint(wipe);
    } else if (elapsed < TIMES.hour[ 0 ]) {
        hand = lerp(spiralPoint(1), hour.start, progress(elapsed, TIMES.toHour));
    } else if (elapsed < TIMES.hour[ 1 ]) {
        hand = lerp(hour.start, hour.tip, hourDone);
    } else if (elapsed < TIMES.minute[ 0 ]) {
        hand = lerp(hour.tip, minute.start, progress(elapsed, TIMES.toMinute));
    } else if (elapsed < TIMES.minute[ 1 ]) {
        hand = lerp(minute.start, minute.tip, minuteDone);
    } else {
        hand = minute.tip;
    }
    return hand;
};

const standAt = (elapsed: number, angles: Angles): number => {
    const paintX = clamp(handAt(elapsed, angles).x - PAINT_DISTANCE, PAINT_MIN_X, PAINT_MAX_X);
    return elapsed < TIMES.walkOut[ 0 ]
        ? mix(mix(ENTER_X, STAND_X, progress(elapsed, TIMES.walkIn)), paintX, progress(elapsed, TIMES.toHour))
        : mix(paintX, ENTER_X, progress(elapsed, TIMES.walkOut));
};

/**
 * Where the man's hand has to be, and how far the wiping and painting have come, at a moment in the animation.
 */
export const frameAt = (elapsed: number, angles: Angles): Frame => ({
    hand: handAt(elapsed, angles),
    wipe: progress(elapsed, TIMES.wipe),
    hour: progress(elapsed, TIMES.hour),
    minute: progress(elapsed, TIMES.minute),
    opacity: clamp(Math.min(elapsed / 800, (DURATION - elapsed) / 800)),
    engage: progress(elapsed, TIMES.engage) * (1 - progress(elapsed, TIMES.disengage)),
    tool: progress(elapsed, TIMES.toHour),
    stand: standAt(elapsed, angles),
    pace: Math.abs(standAt(elapsed + 20, angles) - standAt(elapsed - 20, angles)) / 40
});

export interface Arm {
    shoulder: Point,
    elbow: Point,
    hand: Point
}

// The elbow sits below the straight line shoulder-hand; the closer the hand, the more the arm bends
const armTo = (shoulder: Point, along: Point, reach: number): Arm => {
    const hand = add(shoulder, scale(along, reach));
    const back = reach / 2;
    const height = Math.sqrt(Math.max(0, UPPER_ARM * UPPER_ARM - back * back));
    const elbow = add(shoulder, add(scale(along, back), scale({ x: -along.y, y: along.x }, height)));
    return { shoulder, elbow, hand };
};

const shoulderOf = (hip: Point, side: number): Point => add(hip, { x: side * SHOULDER_HALF, y: -SHOULDER_DROP });

export interface Pose {
    hip: Point,
    feet: [ Point, Point ],
    working: Arm,
    resting: Arm,
    // The end of the broom or brush, which is the point on the dial that is being worked on
    tip: Point
}

/**
 * The whole figure at a moment: walking in, wiping from one spot with the broom, walking along while painting with the brush, walking out.
 */
export const poseAt = (elapsed: number, frame: Frame): Pose => {
    const { engage } = frame;
    const walking = clamp(frame.pace / 0.04);
    // The steps follow the position, so they match the speed over the ground in both directions
    const phase = frame.stand / STRIDE * Math.PI;
    const swing = Math.sin(phase) * walking;
    const hip: Point = { x: frame.stand, y: FLOOR - LEG - Math.abs(Math.sin(phase)) * 5 * walking };

    const hang = (side: number, swingAmount: number): Point => direction({ x: side * 0.12 + swingAmount, y: 1 });
    const rightShoulder = shoulderOf(hip, 1);
    const toTip = sub(frame.hand, rightShoulder);
    const rightDirection = direction(lerp(hang(1, -swing * 0.5), direction(toTip), engage));
    const reach = mix(ARM_LENGTH, clamp(Math.hypot(toTip.x, toTip.y) * 0.6, 40, ARM_LENGTH), engage);

    const feet = ([ -1, 1 ] as const).map(side => ({
        x: hip.x + side * LEG_OFFSET + side * swing * 26,
        y: FLOOR - Math.max(0, -side * Math.sin(phase)) * walking * 14
    })) as [ Point, Point ];

    return {
        hip,
        feet,
        working: armTo(rightShoulder, rightDirection, reach),
        resting: armTo(shoulderOf(hip, -1), hang(-1, swing * 0.5), ARM_LENGTH),
        tip: frame.hand
    };
};