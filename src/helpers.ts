import moment from 'moment';
import { ColorFormat } from 'react-countdown-circle-timer';

export const between = (value: number, from: number, to: number): boolean => {
    return value >= from && value < to;
};

export const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;
    return String(error);
};

export const toColor = (input: string): ColorFormat => {
    if (input.length !== 7) {
        return '#333333';
    }
    if (!input.startsWith('#')) {
        return '#333333';
    }
    return input as ColorFormat;
};

export const invertHex = (hex: string) => {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }

    if (hex.length !== 6) {
        return '#' + hex;
    }

    hex = hex.toUpperCase();
    const splitNum: any[] = hex.split('');
    let resultNum = '';
    const simpleNum = 'FEDCBA9876'.split('');
    const complexNum: any = {
        A: '5', B: '4', C: '3', D: '2', E: '1', F: '0'
    };

    for (let i = 0; i < 6; i++) {
        if (!isNaN(Number(splitNum[ i ]))) {
            resultNum += simpleNum[ splitNum[ i ] ];
        } else if (complexNum[ splitNum[ i ] ]) {
            resultNum += complexNum[ splitNum[ i ] ];
        } else {
            return '#' + hex;
        }
    }

    return '#' + resultNum;
};

export const formatTime = (time: number, format: string) => {
    return moment.utc(moment.duration(time, 'second').asMilliseconds()).format(format);
};

export const lightenDarkenColor = (col: string, amt: number, basedOnColor?: boolean) => {
    var usePound = false;
    if (col[ 0 ] === '#') {
        col = col.slice(1);
        usePound = true;
    }

    var num = parseInt(col, 16);

    if (basedOnColor && num > 8947848) {
        amt = 0-amt;
    }

    var r = (num >> 16) + amt;

    if (r > 255) r = 255;
    else if (r < 0) r = 0;

    var b = ((num >> 8) & 0x00FF) + amt;

    if (b > 255) b = 255;
    else if (b < 0) b = 0;

    var g = (num & 0x0000FF) + amt;

    if (g > 255) g = 255;
    else if (g < 0) g = 0;

    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16);
};