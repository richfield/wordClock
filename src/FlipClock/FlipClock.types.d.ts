export interface AnimatedCardProps {
    animation: string;
    digit: string | number;
    style: React.CSSProperties;
}

export interface StaticCardProps {
    position: string;
    digit: string | number;
    style: React.CSSProperties;
}

export interface FlipUnitContainerProps {
    digit: number;
    shuffle: boolean;
    unit: string;
    style: React.CSSProperties;
}

export interface FlipClockState {
    hours: number;
    hoursShuffle: boolean;
    minutes: number;
    minutesShuffle: boolean;
    seconds: number;
    secondsShuffle: boolean;
}
