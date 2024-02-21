import DigitalClock from './DigitalClock/DigitalClock';
import WordClock from './WordClock/WordClock';
import Countdown from './Countdown/Countdown';
import FlipClock from './FlipClock/FlipClock';
import ClockClock24 from './ClockClock24/components/ClockClock24/ClockClock24';

const ClockRegistry = [
    { id: 'wordclock', name: 'Woordklok', Component: WordClock },
    { id: 'digital', name: 'Digitale Klok', Component: DigitalClock },
    { id: 'countdown', name: 'Timer', Component: Countdown },
    { id: 'flipclock', name: 'Flip Clock', Component: FlipClock },
    { id: 'clockClock24', name: 'ClockClock24', Component: ClockClock24 }
];

export default ClockRegistry;