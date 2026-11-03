import { describe, expect, it } from 'vitest';
import { handAngles, handPath, spiralPath } from './hands';

describe('spiralPath', () => {
    it('starts at the top of the rim and ends near the middle', () => {
        const numbers = [ ...spiralPath().matchAll(/[ML] ([\d.-]+) ([\d.-]+)/g) ].map(match => [ Number(match[ 1 ]), Number(match[ 2 ]) ]);
        expect(numbers[ 0 ][ 0 ]).toBeCloseTo(200, 0);
        expect(numbers[ 0 ][ 1 ]).toBeCloseTo(50, 0);
        const last = numbers[ numbers.length - 1 ];
        expect(Math.hypot(last[ 0 ] - 200, last[ 1 ] - 200)).toBeLessThan(15);
    });
});

describe('handAngles', () => {
    it('moves the hour hand along with the minutes', () => {
        expect(handAngles(new Date(2026, 0, 1, 3, 0))).toEqual({ hour: 90, minute: 0 });
        expect(handAngles(new Date(2026, 0, 1, 15, 30))).toEqual({ hour: 105, minute: 180 });
        expect(handAngles(new Date(2026, 0, 1, 0, 59))).toEqual({ hour: 29.5, minute: 354 });
    });
});

describe('handPath', () => {
    it('is the same for the same seed and differs between seeds', () => {
        expect(handPath(90, 150, 12, 5)).toBe(handPath(90, 150, 12, 5));
        expect(handPath(90, 150, 12, 5)).not.toBe(handPath(90, 150, 12, 6));
    });

    it('is a closed outline that points the right way', () => {
        const path = handPath(0, 150, 12, 1);
        expect(path.startsWith('M ')).toBe(true);
        expect(path.endsWith('Z')).toBe(true);
        const ys = [ ...path.matchAll(/[ML] [\d.-]+ ([\d.-]+)/g) ].map(match => Number(match[ 1 ]));
        expect(Math.min(...ys)).toBeLessThan(60);
    });
});
