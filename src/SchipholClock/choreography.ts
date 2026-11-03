import { CENTER, HOUR_LENGTH, MINUTE_LENGTH, Point, spiralPoint, tipPoint } from './hands';

export const TIME_SCALE = 1.7;
export const DURATION = 7500 * TIME_SCALE;
export const FLOOR = 400;
export const UPPER_ARM = 78;
export const FORE_ARM = 78;
export const ARM_LENGTH = UPPER_ARM + FORE_ARM;
export const TORSO = 120;
export const SHOULDER_HALF = 36;
export const LEG = 150;

const HAND_BACK = 25;
const ENTER_X = -50;
const STAND_X = 110;
const MAX_REACH = ARM_LENGTH * 0.94;
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

/**
 * Two-bone arm of constant length: the elbow bends away from the body (outward and down).
 * The hand is stopped at full stretch when the target is out of reach.
 */
export const solveArm = (shoulder: Point, target: Point, outward: number): Arm => {
    const dx = target.x - shoulder.x;
    const dy = target.y - shoulder.y;
    const distance = Math.hypot(dx, dy);
    const ux = distance > 1e-6 ? dx / distance : 0;
    const uy = distance > 1e-6 ? dy / distance : 1;
    const reach = Math.min(distance, ARM_LENGTH * 0.999);
    const hand = { x: shoulder.x + ux * reach, y: shoulder.y + uy * reach };
    const half = reach / 2;
    const bend = Math.sqrt(Math.max(0, UPPER_ARM * UPPER_ARM - half * half));
    const middle = { x: shoulder.x + ux * half, y: shoulder.y + uy * half };
    const options = [ { x: -uy, y: ux }, { x: uy, y: -ux } ];
    const preferred = { x: outward * 0.6, y: 1 };
    const side = options[ 0 ].x * preferred.x + options[ 0 ].y * preferred.y >= options[ 1 ].x * preferred.x + options[ 1 ].y * preferred.y
        ? options[ 0 ]
        : options[ 1 ];
    return { shoulder, elbow: { x: middle.x + side.x * bend, y: middle.y + side.y * bend }, hand };
};

// Seen from the front the legs look nearly straight; the knee only bows out a little
const kneeOf = (hip: Point, foot: Point, side: number): Point => ({
    x: (hip.x + foot.x) / 2 + side * Math.min(8, Math.max(0, Math.hypot(foot.x - hip.x, foot.y - hip.y) - 120) * 0.3),
    y: (hip.y + foot.y) / 2
});

interface Body {
    hip: Point,
    lean: number
}

const shoulderOf = ({ hip, lean }: Body, side: number): Point =>
    add(hip, rotate({ x: side * SHOULDER_HALF, y: -TORSO }, lean));

/**
 * Where the body stands to reach a target with the working (right) arm: it leans towards the target,
 * rises on its toes or bends its knees, and only steps sideways when the arm alone cannot reach.
 */
export const workingBody = (target: Point): Body => {
    const lean = clamp((target.x - CENTER) / 150, -1, 1) * 12;
    const crouch = clamp((target.y - 220) / 150);
    const rise = clamp((220 - target.y) / 170);
    const body: Body = {
        hip: { x: CENTER + (target.x - CENTER) * 0.55, y: FLOOR - LEG + crouch * 60 - rise * 13 },
        lean
    };
    for (let attempt = 0; attempt < 3; attempt++) {
        const shoulder = shoulderOf(body, 1);
        const distance = Math.hypot(target.x - shoulder.x, target.y - shoulder.y);
        if (distance > MAX_REACH) {
            const factor = (distance - MAX_REACH) / distance;
            body.hip = {
                x: body.hip.x + (target.x - shoulder.x) * factor,
                y: clamp(body.hip.y + (target.y - shoulder.y) * factor, FLOOR - LEG - 15, FLOOR - LEG + 85)
            };
        }
    }
    return body;
};

export interface Pose {
    hip: Point,
    lean: number,
    feet: [ Point, Point ],
    knees: [ Point, Point ],
    working: Arm,
    resting: Arm,
    toolRadius: number
}

const idleXAt = (elapsed: number): number => elapsed < TIMES.walkOut[ 0 ]
    ? mix(ENTER_X, STAND_X, progress(elapsed, TIMES.walkIn))
    : mix(STAND_X, ENTER_X, progress(elapsed, TIMES.walkOut));

// Distance covered so far, so the steps match the speed over the ground
const walkedDistance = (elapsed: number): number => elapsed < TIMES.walkOut[ 0 ]
    ? idleXAt(elapsed) - ENTER_X
    : STAND_X - ENTER_X + STAND_X - idleXAt(elapsed);

/**
 * The whole figure at a moment: walking in and out, then working on the dial.
 */
export const poseAt = (elapsed: number, frame: Frame): Pose => {
    const { engage } = frame;
    const idleX = idleXAt(elapsed);
    const speed = Math.abs(idleXAt(elapsed + 20) - idleXAt(elapsed - 20)) / 40;
    const walking = clamp(speed / 0.04);
    const phase = walkedDistance(elapsed) / STRIDE * Math.PI;
    const idle: Body = { hip: { x: idleX, y: FLOOR - LEG - Math.abs(Math.sin(phase)) * 5 * walking }, lean: 0 };
    const work = workingBody(frame.hand);

    const sway = (Math.sin(elapsed / 900) * 1.2 + Math.sin(elapsed / 370) * 0.5) * engage;
    const body: Body = {
        hip: lerp(idle.hip, work.hip, engage),
        lean: work.lean * engage + sway
    };

    const swing = Math.sin(phase) * walking;
    const relaxed = (shoulder: Point, side: number): Point => ({
        x: shoulder.x + side * 6 - side * swing * 15 + Math.sin(elapsed / 700 + side) * 2,
        y: shoulder.y + 148
    });

    const rightShoulder = shoulderOf(body, 1);
    const leftShoulder = shoulderOf(body, -1);
    const stretch = clamp((body.hip.y - (FLOOR - LEG)) / 60, 0, 1.3);
    const feet = ([ -1, 1 ] as const).map(side => ({
        x: body.hip.x + side * (14 + stretch * 8) + side * swing * 17,
        y: FLOOR - Math.max(0, -side * Math.sin(phase)) * walking * 14
    })) as [ Point, Point ];

    const knees = ([ -1, 1 ] as const).map((side, index) =>
        kneeOf({ x: body.hip.x + side * 9, y: body.hip.y }, feet[ index ], side)) as [ Point, Point ];

    return {
        hip: body.hip,
        lean: body.lean,
        feet,
        knees,
        working: solveArm(rightShoulder, lerp(relaxed(rightShoulder, 1), frame.hand, engage), 1),
        resting: solveArm(leftShoulder, relaxed(leftShoulder, -1), -1),
        toolRadius: mix(24, 11, frame.tool)
    };
};

