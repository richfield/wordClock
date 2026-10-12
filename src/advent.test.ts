import { describe, expect, it } from 'vitest';
import { adventSundays, daysUntilChristmas, isChristmas, litCandles } from './advent';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const asDate = (dayNumber: number) => new Date(dayNumber * MS_PER_DAY + 12 * 60 * 60 * 1000);

describe('adventSundays', () => {
    it.each([
        [ 2023, [ '2023-12-03', '2023-12-10', '2023-12-17', '2023-12-24' ] ],
        [ 2024, [ '2024-12-01', '2024-12-08', '2024-12-15', '2024-12-22' ] ],
        [ 2025, [ '2025-11-30', '2025-12-07', '2025-12-14', '2025-12-21' ] ],
        [ 2026, [ '2026-11-29', '2026-12-06', '2026-12-13', '2026-12-20' ] ],
        [ 2027, [ '2027-11-28', '2027-12-05', '2027-12-12', '2027-12-19' ] ]
    ])('finds the Sundays in %i', (year, expected) => {
        const found = adventSundays(year).map(day => asDate(day).toISOString().slice(0, 10));
        expect(found).toEqual(expected);
    });

    it('treats a Sunday 25 December as after the fourth Advent Sunday', () => {
        // 25 December 2022 was a Sunday, so the fourth Advent Sunday is 18 December
        const found = adventSundays(2022).map(day => asDate(day).toISOString().slice(0, 10));
        expect(found[ 3 ]).toBe('2022-12-18');
    });
});

describe('litCandles', () => {
    it('has no candles before the first Advent Sunday', () => {
        expect(litCandles(new Date(2026, 10, 28))).toBe(0);
        expect(litCandles(new Date(2026, 5, 1))).toBe(0);
    });

    it('lights one more candle on each Advent Sunday', () => {
        expect(litCandles(new Date(2026, 10, 29))).toBe(1);
        expect(litCandles(new Date(2026, 11, 5))).toBe(1);
        expect(litCandles(new Date(2026, 11, 6))).toBe(2);
        expect(litCandles(new Date(2026, 11, 13))).toBe(3);
        expect(litCandles(new Date(2026, 11, 20))).toBe(4);
    });

    it('keeps all four burning until the end of the year', () => {
        expect(litCandles(new Date(2026, 11, 25))).toBe(4);
        expect(litCandles(new Date(2026, 11, 31, 23, 59))).toBe(4);
        expect(litCandles(new Date(2027, 0, 1))).toBe(0);
    });

    it('ignores the time of day', () => {
        expect(litCandles(new Date(2026, 10, 29, 0, 0, 1))).toBe(1);
        expect(litCandles(new Date(2026, 10, 28, 23, 59, 59))).toBe(0);
    });
});

describe('daysUntilChristmas', () => {
    it('counts the days to 25 December', () => {
        expect(daysUntilChristmas(new Date(2026, 11, 1))).toBe(24);
        expect(daysUntilChristmas(new Date(2026, 11, 24, 23, 59))).toBe(1);
        expect(daysUntilChristmas(new Date(2026, 11, 25))).toBe(0);
    });

    it('counts to next year after Christmas', () => {
        expect(daysUntilChristmas(new Date(2026, 11, 26))).toBe(364);
        expect(daysUntilChristmas(new Date(2027, 0, 1))).toBe(358);
    });

    it('is not thrown off by the clock change in autumn or spring', () => {
        expect(daysUntilChristmas(new Date(2026, 9, 25))).toBe(61);
        expect(daysUntilChristmas(new Date(2026, 2, 29))).toBe(271);
    });
});

describe('isChristmas', () => {
    it('is true on 25 and 26 December only', () => {
        expect(isChristmas(new Date(2026, 11, 24))).toBe(false);
        expect(isChristmas(new Date(2026, 11, 25))).toBe(true);
        expect(isChristmas(new Date(2026, 11, 26))).toBe(true);
        expect(isChristmas(new Date(2026, 11, 27))).toBe(false);
        expect(isChristmas(new Date(2026, 5, 25))).toBe(false);
    });
});
