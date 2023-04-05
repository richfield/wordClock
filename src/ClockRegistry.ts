import DigitalClock from './DigitalClock/DigitalClock';
import WordClock from './WordClock/WordClock';
import Countdown from './Countdown/Countdown';
import FlipClock from './FlipClock/FlipClock';

const ClockRegistry = [
    { id: 'wordclock', name: 'Woordklok', Component: WordClock },
    { id: 'digital', name: 'Digitale Klok', Component: DigitalClock },
    { id: 'countdown', name: 'Timer', Component: Countdown },
    { id: 'flipclock', name: 'Flip Clock', Component: FlipClock }
];

export default ClockRegistry;