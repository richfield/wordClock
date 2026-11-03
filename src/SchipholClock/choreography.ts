import { HOUR_LENGTH, MINUTE_LENGTH, Point, spiralPoint, tipPoint } from './hands';

export const TIME_SCALE = 1.7;
export const DURATION = 7500 * TIME_SCALE;
export const FLOOR = 400;
// A minifig: stiff, straight arms and blocky legs
export const ARM_LENGTH = 100;
export const UPPER_ARM = 58;
export const FOREARM = 58;
export const TORSO = 96;
export const SHOULDER_HALF = 68;
export const SHOULDER_DROP = 82;
export const LEG = 72;
// Stubby minifig legs while working, so he floats behind the glass instead of having long legs
const LEG_WORK = 62;
export const LEG_OFFSET = 27;

const HAND_BACK = 25;
const ENTER_X = -70;
const STAND_X = 110;
const STRIDE = 34;
const MIN_SHOULDER_X = 60;

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

// Positive angles turn clockwise on screen
const rotate = (vector: Point, degrees: number): Point => {
    const radians = degrees * Math.PI / 180;
    return {
        x: vector.x * Math.cos(radians) - vector.y * Math.sin(radians),
        y: vector.x * Math.sin(radians) + vector.y * Math.cos(radians)
    };
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
    tool: number
}

/**
 * Where the man's hand has to be, and how far the wiping and painting have come, at a moment in the animation.
 */
export const frameAt = (elapsed: number, angles: { hour: number, minute: number }): Frame => {
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

    return {
        hand,
        wipe,
        hour: hourDone,
        minute: minuteDone,
        opacity: clamp(Math.min(elapsed / 800, (DURATION - elapsed) / 800)),
        engage: progress(elapsed, TIMES.engage) * (1 - progress(elapsed, TIMES.disengage)),
        tool: progress(elapsed, TIMES.toHour)
    };
};

export interface Arm {
    shoulder: Point,
    elbow: Point,
    hand: Point
}

// The elbow sits to the side of the straight line shoulder-hand, which is shorter than the arm so it always bends
const armTo = (shoulder: Point, along: Point, bend: number): Arm => {
    const hand = add(shoulder, scale(along, ARM_LENGTH));
    const alongSquare = UPPER_ARM * UPPER_ARM - FOREARM * FOREARM + ARM_LENGTH * ARM_LENGTH;
    const back = alongSquare / (2 * ARM_LENGTH);
    const height = Math.sqrt(Math.max(0, UPPER_ARM * UPPER_ARM - back * back));
    const elbow = add(shoulder, add(scale(along, back), scale({ x: -along.y, y: along.x }, height * bend)));
    return { shoulder, elbow, hand };
};

interface Body {
    hip: Point,
    lean: number
}

const shoulderOf = ({ hip, lean }: Body, side: number): Point =>
    add(hip, rotate({ x: side * SHOULDER_HALF, y: -SHOULDER_DROP }, lean));

const idleXAt = (elapsed: number): number => elapsed < TIMES.walkOut[ 0 ]
    ? mix(ENTER_X, STAND_X, progress(elapsed, TIMES.walkIn))
    : mix(STAND_X, ENTER_X, progress(elapsed, TIMES.walkOut));

// Distance covered so far, so the steps match the speed over the ground
const walkedDistance = (elapsed: number): number => elapsed < TIMES.walkOut[ 0 ]
    ? idleXAt(elapsed) - ENTER_X
    : STAND_X - ENTER_X + STAND_X - idleXAt(elapsed);

/**
 * Where the minifig stands to reach a target with its rigid right arm: upright, to the left of the target,
 * with the arm raised or lowered to the height of the target.
 */
export const workingBody = (target: Point): Body => {
    // Raise the arm further when the target is so far left that the body would leave the dial
    const comfortable = clamp((230 - target.y) / 120, -1, 1) * 60 * Math.PI / 180;
    const angle = Math.max(comfortable, Math.acos(clamp((target.x - MIN_SHOULDER_X) / ARM_LENGTH)));
    const shoulder = {
        x: target.x - ARM_LENGTH * Math.cos(angle),
        y: target.y + ARM_LENGTH * Math.sin(angle)
    };
    return { hip: { x: shoulder.x - SHOULDER_HALF, y: shoulder.y + SHOULDER_DROP }, lean: 0 };
};
export interface Pose {
    hip: Point,
    lean: number,
    feet: [ Point, Point ],
    working: Arm,
    resting: Arm,
    toolRadius: number
}

/**
 * The whole figure at a moment: walking in and out, then working on the dial.
 */
export const poseAt = (elapsed: number, frame: Frame): Pose => {
    const { engage } = frame;
    const idleX = idleXAt(elapsed);
    const speed = Math.abs(idleXAt(elapsed + 20) - idleXAt(elapsed - 20)) / 40;
    const walking = clamp(speed / 0.04);
    const phase = walkedDistance(elapsed) / STRIDE * Math.PI;
    const swing = Math.sin(phase) * walking;
    const idleHip: Point = { x: idleX, y: FLOOR - LEG - Math.abs(Math.sin(phase)) * 5 * walking };
    const work = workingBody(frame.hand);
    const body: Body = { hip: lerp(idleHip, work.hip, engage), lean: work.lean * engage };

    const hang = (side: number, swingAmount: number): Point => direction({ x: side * 0.12 + swingAmount, y: 1 });
    const rightShoulder = shoulderOf(body, 1);
    const leftShoulder = shoulderOf(body, -1);
    const reach = direction(sub(frame.hand, rightShoulder));
    const rightDirection = direction(lerp(hang(1, -swing * 0.5), reach, engage));

    const feet = ([ -1, 1 ] as const).map(side => ({
        x: body.hip.x + side * LEG_OFFSET + side * swing * 26,
        y: mix(FLOOR, body.hip.y + LEG_WORK, engage) - Math.max(0, -side * Math.sin(phase)) * walking * 14
    })) as [ Point, Point ];

    return {
        hip: body.hip,
        lean: body.lean,
        feet,
        working: armTo(rightShoulder, rightDirection, 1),
        resting: armTo(leftShoulder, hang(-1, swing * 0.5), 1),
        toolRadius: mix(24, 12, frame.tool)
    };
};