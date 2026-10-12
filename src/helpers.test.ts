import { describe, expect, it } from 'vitest';
import { between, formatTime, getErrorMessage, invertHex, lightenDarkenColor, toColor } from './helpers';

describe('between', () => {
    it('includes the lower bound and excludes the upper bound', () => {
        expect(between(5, 5, 10)).toBe(true);
        expect(between(9, 5, 10)).toBe(true);
        expect(between(10, 5, 10)).toBe(false);
        expect(between(4, 5, 10)).toBe(false);
    });
});

describe('getErrorMessage', () => {
    it('returns the message of Error instances', () => {
        expect(getErrorMessage(new Error('boom'))).toBe('boom');
    });

    it('stringifies anything else', () => {
        expect(getErrorMessage('plain')).toBe('plain');
        expect(getErrorMessage(42)).toBe('42');
    });
});

describe('toColor', () => {
    it('keeps valid 7 character hex colors', () => {
        expect(toColor('#ff00aa')).toBe('#ff00aa');
    });

    it('falls back to dark grey for invalid input', () => {
        expect(toColor('#fff')).toBe('#333333');
        expect(toColor('ff00aa1')).toBe('#333333');
        expect(toColor('')).toBe('#333333');
    });
});

describe('invertHex', () => {
    it('inverts colors', () => {
        expect(invertHex('#000000')).toBe('#FFFFFF');
        expect(invertHex('#FFFFFF')).toBe('#000000');
        expect(invertHex('#123456')).toBe('#EDCBA9');
    });

    it('accepts input without a leading hash', () => {
        expect(invertHex('000000')).toBe('#FFFFFF');
    });

    it('returns the input unchanged when it is not a 6 digit color', () => {
        expect(invertHex('#abc')).toBe('#abc');
    });

    it('is its own inverse', () => {
        expect(invertHex(invertHex('#1A2B3C'))).toBe('#1A2B3C');
    });
});

describe('formatTime', () => {
    it('formats seconds with the given format', () => {
        expect(formatTime(0, 'mm:ss')).toBe('00:00');
        expect(formatTime(65, 'mm:ss')).toBe('01:05');
        expect(formatTime(3725, 'HH:mm:ss')).toBe('01:02:05');
    });
});

describe('lightenDarkenColor', () => {
    it('lightens a color and keeps the leading hash', () => {
        expect(lightenDarkenColor('#101010', 16)).toBe('#202020');
    });

    it('clamps channels to the 0-255 range', () => {
        expect(lightenDarkenColor('#fefefe', 50)).toBe('#ffffff');
        expect(lightenDarkenColor('#010101', -50)).toBe('#0');
    });

    it('works without a leading hash', () => {
        expect(lightenDarkenColor('101010', 16)).toBe('202020');
    });

    it('darkens instead when basedOnColor is set and the color is light', () => {
        expect(lightenDarkenColor('#f0f0f0', 16, true)).toBe('#e0e0e0');
    });
});
