import { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { ClockComponentProps } from '../types';
import WordClockRow from './WordClockRow';
function WordClock(props: ClockComponentProps) {
    const symbols = [ 'H', 'E', 'T', 'K', 'I', 'S', 'A', 'V', 'I', 'J', 'F', 'T', 'I', 'E', 'N', 'A', 'T', 'Z', 'V', 'O', 'O', 'R', 'O', 'V', 'E', 'R', 'M', 'E', 'K', 'W', 'A', 'R', 'T', 'H', 'A', 'L', 'F', 'M', 'S', 'P', 'O', 'V', 'E', 'R', 'V', 'O', 'O', 'R', 'T', 'H', 'G', 'É', 'É', 'N', 'S', 'T', 'W', 'E', 'E', 'A', 'M', 'C', 'D', 'R', 'I', 'E', 'V', 'I', 'E', 'R', 'V', 'I', 'J', 'F', 'Z', 'E', 'S', 'Z', 'E', 'V', 'E', 'N', 'O', 'N', 'E', 'G', 'E', 'N', 'A', 'C', 'H', 'T', 'T', 'I', 'E', 'N', 'E', 'L', 'F', 'T', 'W', 'A', 'A', 'L', 'F', 'P', 'M', 'U', 'U', 'R' ];
    const style = {
        paddingTop: props.clockSettings.topDistance,
        display: 'grid',
        gridTemplateColumns: '10% 10% 10% 10% 10% 10% 10% 10% 10% 10% 10%',
        gridTemplateRows: '10% 10% 10% 10% 10% 10% 10% 10% 10% 10%',
        backGroundColor: 'yellow',
        width: `${props.clockSettings.sizeFactor}vmin`,
        height: `${props.clockSettings.sizeFactor}vmin`
    };

    useEffect(() => {
        document.body.style.backgroundColor = props.clockSettings.backgroundColor;
    }, [ props.clockSettings.backgroundColor ]);

    return (
        <Container fluid style={{ backgroundColor: props.clockSettings.backgroundColor }}>
            <Container style={style} id="worldClock">
                {symbols.map((symbol, index) => (
                    <WordClockRow symbol={symbol} key={index} index={index} time={props.time} settings={props.clockSettings} />
                ))}
            </Container>
        </Container>
    );
}

export default WordClock;