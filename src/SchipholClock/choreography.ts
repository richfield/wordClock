import { CENTER, HOUR_LENGTH, MINUTE_LENGTH, Point, spiralPoint, tipPoint } from './hands';

export const DURATION = 7000;
export const ARM_LENGTH = 105;

const IDLE: Point = { x: 70, y: 262 };
const HAND_BACK = 25;
const SHOULDER_SIDE = 28;
const SHOULDER_HEIGHT = 18;
const SIDE_RANGE = 120;
const MAX_ARM_ANGLE = 100 * Math.PI / 180;

const TIMES = {
    toSpiral: [ 700, 1300 ],
    wipe: [ 1300, 3500 ],
    toHour: [ 3500, 4100 ],
    hour: [ 4100, 4900 ],
    toMinute: [ 4900, 5500 ],
    minute: [ 5500, 6300 ],
    leave: [ 6300, DURATION ]
} as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const lerp = (from: Point, to: Point, amount: number): Point => ({
    x: from.x + (to.x - from.x) * amount,
    y: from.y + (to.y - from.y) * amount
});
const progress = (elapsed: number, [ start, end ]: readonly [ number, number ]) => ease(clamp((elapsed - start) / (end - start)));

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
    opacity: number
}

/**
 * Where the man's hand is, and how far the wiping and painting have come, at a moment in the animation.
 */
export const frameAt = (elapsed: number, angles: { hour: number, minute: number }): Frame => {
    const hour = handSegment(angles.hour, HOUR_LENGTH);
    const minute = handSegment(angles.minute, MINUTE_LENGTH);
    const wipe = progress(elapsed, TIMES.wipe);
    const hourDone = progress(elapsed, TIMES.hour);
    const minuteDone = progress(elapsed, TIMES.minute);

    let hand: Point;
    if (elapsed < TIMES.wipe[ 0 ]) {
        hand = lerp(IDLE, spiralPoint(0), progress(elapsed, TIMES.toSpiral));
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
        hand = lerp(minute.tip, IDLE, progress(elapsed, TIMES.leave));
    }

    return {
        hand,
        wipe,
        hour: hourDone,
        minute: minuteDone,
        opacity: clamp(Math.min(elapsed / 500, (DURATION - elapsed) / 500))
    };
};

export interface Pose {
    body: Point,
    shoulder: Point,
    hand: Point,
    restArmX: number
}

/**
 * The arm always has the same length: the body moves along so the hand can reach the given point.
 * Coordinates of shoulder and hand are relative to the body.
 */
export const poseFor = (target: Point): Pose => {
    const side = Math.max(-1, Math.min(1, (target.x - CENTER) / SIDE_RANGE));
    const angle = side * MAX_ARM_ANGLE;
    const reach = { x: ARM_LENGTH * Math.sin(angle), y: ARM_LENGTH * Math.cos(angle) };
    const shoulder = { x: SHOULDER_SIDE * side, y: SHOULDER_HEIGHT };
    return {
        body: { x: target.x - reach.x - shoulder.x, y: target.y - reach.y - shoulder.y },
        shoulder,
        hand: { x: shoulder.x + reach.x, y: shoulder.y + reach.y },
        restArmX: -SHOULDER_SIDE * side - 9
    };
};
