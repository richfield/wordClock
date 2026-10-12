const MS_PER_DAY = 24 * 60 * 60 * 1000;

const dayNumber = (year: number, month: number, day: number): number =>
    Math.floor(Date.UTC(year, month, day) / MS_PER_DAY);

const toDayNumber = (date: Date): number =>
    dayNumber(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Day numbers of the four Advent Sundays of a year: the four Sundays before 25 December.
 */
export const adventSundays = (year: number): number[] => {
    const christmas = dayNumber(year, 11, 25);
    const weekday = new Date(year, 11, 25).getDay();
    const fourth = christmas - (weekday === 0 ? 7 : weekday);
    return [ fourth - 21, fourth - 14, fourth - 7, fourth ];
};

/**
 * Number of Advent candles that burn on a date (0 to 4).
 * All four keep burning until the end of the year, and none burn before the first Sunday.
 */
export const litCandles = (date: Date): number =>
    adventSundays(date.getFullYear()).filter(sunday => sunday <= toDayNumber(date)).length;

/**
 * Whole days until the next 25 December. 0 on Christmas Day itself.
 */
export const daysUntilChristmas = (date: Date): number => {
    const today = toDayNumber(date);
    const thisYear = dayNumber(date.getFullYear(), 11, 25);
    const target = today <= thisYear ? thisYear : dayNumber(date.getFullYear() + 1, 11, 25);
    return target - today;
};

export const isChristmas = (date: Date): boolean =>
    date.getMonth() === 11 && (date.getDate() === 25 || date.getDate() === 26);

/**
 * From the first Advent Sunday up to and including 26 December.
 */
export const isAdventSeason = (date: Date): boolean => {
    if (litCandles(date) === 0) {
        return false;
    }
    return date.getMonth() === 10 || (date.getMonth() === 11 && date.getDate() <= 26);
};
