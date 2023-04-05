import { between } from '../helpers';
import { ClockSettings } from '../types';

function WordClockRow(props: { symbol: string, index: number, time: Date, settings: ClockSettings }) {
    const hetis = [ 0, 1, 2, 4, 5 ];
    const heelUur = [ 107, 108, 109 ];
    const vijfVoor = [ 7, 8, 9, 10, 18, 19, 20, 21 ];
    const vijfOver = [ 7, 8, 9, 10, 22, 23, 24, 25 ];
    const tienVoor = [ 11, 12, 13, 14, 18, 19, 20, 21 ];
    const tienOver = [ 11, 12, 13, 14, 22, 23, 24, 25 ];
    const kwartOver = [ 28, 29, 30, 31, 32, 40, 41, 42, 43 ];
    const kwartVoor = [ 28, 29, 30, 31, 32, 44, 45, 46, 47 ];
    const half = [ 33, 34, 35, 36 ];
    const een = [ 51, 52, 53 ];
    const twee = [ 55, 56, 57, 58 ];
    const drie = [ 62, 63, 64, 65 ];
    const vier = [ 66, 67, 68, 69 ];
    const vijf = [ 70, 71, 72, 73 ];
    const zes = [ 74, 75, 76 ];
    const zeven = [ 77, 78, 79, 80, 81 ];
    const acht = [ 88, 89, 90, 91 ];
    const negen = [ 83, 84, 85, 86, 87 ];
    const tien = [ 92, 93, 94, 95 ];
    const elf = [ 96, 97, 98 ];
    const twaalf = [ 99, 100, 101, 102, 103, 104 ];

    const cellStype = {
        fontWeight: 'bolder',
        fontSize: `${props.settings.sizeFactor/10}vmin`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    };

    const determineColor = (index: number, time: Date) => {
        const secondary = props.settings.shadeColor;
        const primary = props.settings.foreGroundColor;
        if (hetis.includes(index)) {
            return primary;
        }
        const minutesSeconds = parseFloat(`${time.getMinutes()}.${time.getSeconds().toString().padStart(2,'0')}`);
        let hours = time.getHours();

        if (between(minutesSeconds,0, 2.3) || minutesSeconds >= 57.3) {
            if (heelUur.includes(index)) {
                return primary;
            }
        }

        if (between(minutesSeconds,2.3, 7.3) || between(minutesSeconds,32.3, 37.3)) {
            if (vijfOver.includes(index)) {
                return primary;
            }
        }

        if (between(minutesSeconds,7.3, 12.3) || between(minutesSeconds,37.3, 42.3)) {
            if (tienOver.includes(index)) {
                return primary;
            }
        }

        if (between(minutesSeconds,12.3, 17.3)) {
            if (kwartOver.includes(index)) {
                return primary;
            }
        }

        if (between(minutesSeconds,42.3, 47.3)) {
            if (kwartVoor.includes(index)) {
                return primary;
            }
        }

        if (between(minutesSeconds,17.3, 22.3) || between(minutesSeconds,47.3, 52.3)) {
            if (tienVoor.includes(index)) {
                return primary;
            }
        }

        if (between(minutesSeconds,52.3, 57.3) || between(minutesSeconds,22.3, 27.3)) {
            if (vijfVoor.includes(index)) {
                return primary;
            }
        }

        if (between(minutesSeconds,17.3, 42.3)) {
            if (half.includes(index)) {
                return primary;
            }
        }

        if (minutesSeconds >= 17.3) {
            hours++;
        }

        if (hours === 1 || hours === 13) {
            if (een.includes(index)) {
                return primary;
            }
        }

        if (hours === 2 || hours === 14) {
            if (twee.includes(index)) {
                return primary;
            }
        }

        if (hours === 3 || hours === 15) {
            if (drie.includes(index)) {
                return primary;
            }
        }

        if (hours === 4 || hours === 16) {
            if (vier.includes(index)) {
                return primary;
            }
        }

        if (hours === 5 || hours === 17) {
            if (vijf.includes(index)) {
                return primary;
            }
        }

        if (hours === 6 || hours === 18) {
            if (zes.includes(index)) {
                return primary;
            }
        }

        if (hours === 7 || hours === 19) {
            if (zeven.includes(index)) {
                return primary;
            }
        }

        if (hours === 8 || hours === 20) {
            if (acht.includes(index)) {
                return primary;
            }
        }

        if (hours === 9 || hours === 21) {
            if (negen.includes(index)) {
                return primary;
            }
        }

        if (hours === 10 || hours === 22) {
            if (tien.includes(index)) {
                return primary;
            }
        }

        if (hours === 11 || hours === 23) {
            if (elf.includes(index)) {
                return primary;
            }
        }

        if (hours === 12 || hours === 24 || hours === 0) {
            if (twaalf.includes(index)) {
                return primary;
            }
        }

        return secondary;
    };
    const color = determineColor(props.index, props.time);
    return (
        <div style={{ ...cellStype, color: color }}>{props.symbol}</div>
    );
}

export default WordClockRow;

