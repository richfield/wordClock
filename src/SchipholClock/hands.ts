export const CENTER = 200;
export const HOUR_LENGTH = 105;
export const MINUTE_LENGTH = 155;
const SEGMENTS = 8;

export interface Point {
    x: number,
    y: number
}

// Small deterministic generator so a minute always gets the same "hand drawn" hands
const seededRandom = (seed: number) => {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6D2B79F5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

export const handAngles = (time: Date): { hour: number, minute: number } => ({
    hour: (time.getHours() % 12) * 30 + time.getMinutes() * 0.5,
    minute: time.getMinutes() * 6
});

/**
 * Point at the given distance from the middle, in the direction of angle (degrees clockwise from 12 o'clock).
 */
export const tipPoint = (angle: number, length: number): Point => {
    const radians = angle * Math.PI / 180;
    return { x: CENTER + length * Math.sin(radians), y: CENTER - length * Math.cos(radians) };
};

const SPIRAL_START = 150;
const SPIRAL_END = 12;
const SPIRAL_TURNS = 3;

/**
 * Where the cloth is when wiping the dial: a spiral from the top of the rim to the middle (progress 0 to 1).
 */
export const spiralPoint = (progress: number): Point => {
    const radius = SPIRAL_START + (SPIRAL_END - SPIRAL_START) * progress;
    const angle = -Math.PI / 2 + progress * SPIRAL_TURNS * 2 * Math.PI;
    return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) };
};

/**
 * The part of the spiral the cloth has covered so far.
 */
export const spiralPath = (progress = 1, steps = 180): string => {
    const count = Math.max(1, Math.ceil(progress * steps));
    return Array.from({ length: count + 1 }, (_, index) => {
        const { x, y } = spiralPoint(Math.min(progress, index / steps));
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
};

/**
 * Outline of a slightly wobbly, tapered hand pointing at angle (degrees clockwise from 12 o'clock).
 */
export const handPath = (angle: number, length: number, width: number, seed: number): string => {
    const random = seededRandom(seed);
    const radians = (angle + (random() - 0.5) * 3) * Math.PI / 180;
    const dx = Math.sin(radians);
    const dy = -Math.cos(radians);
    const px = Math.cos(radians);
    const py = Math.sin(radians);
    const tail = length * 0.14;

    const side = (sign: 1 | -1) => Array.from({ length: SEGMENTS + 1 }, (_, index) => {
        const progress = index / SEGMENTS;
        const along = -tail + progress * (length + tail);
        const half = (width / 2) * (1 - 0.4 * progress) * (0.82 + random() * 0.36);
        return [ CENTER + dx * along + px * half * sign, CENTER + dy * along + py * half * sign ];
    });

    const points = [ ...side(1), ...side(-1).reverse() ];
    return points
        .map(([ x, y ], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
        .join(' ') + ' Z';
};
