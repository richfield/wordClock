interface User {
    user_id: number,
    username: string,
    Username: string,
    iat: number,
    exp: number
}

interface DbUser {
    Id: number,
    username: string,
    Username: string,
    Password: string,
    Token: string
    Salt: string,
    iat: number,
    exp: number,
    Settings: Settings
}

interface DbError {
    message: string
}

interface ScheduleEntry {
    fromTime: string,
    toTime: string,
    clockType: string,
    clockSettings: ClockSettings
}

interface Settings {
    Schedule: ScheduleEntry[],
    ForceReload: boolean,
    RefreshRate: number,
    DefaultClock: string,
    WordClockDefaultSettings: ClockSettings,
    DigitalClockDefaultSettings: ClockSettings,
    TimerSettings: ClockSettings,
    FlipClockDefaultSettings: ClockSettings,
    ClockClock24DefaultSettings: ClockSettings,
    Timer: number

}

interface ClockSettings {
    backgroundColor: string,
    foreGroundColor: string,
    shadeColor: string,
    topDistance: Property.PaddingTop<TLength>,
    sizeFactor: number,
    showSeconds?: boolean
}

interface ClockComponentProps {
    time: Date,
    clockSettings: ClockSettings,
    timer?: number,
    finished?: () => void
}


export type Rotation = number;
export type Clock = {
    hours: Rotation;
    minutes: Rotation;
    animationTime?: number;
    animationDelay?: number;
    animationType?: AnimationType;
};
export type Line = [ Clock, Clock ];
export type Number = [ Line, Line, Line ];
export type Timer = [ Number, Number, Number, Number ];

export type AnimationType = 'start' | 'end';

export {
    User,
    DbUser,
    DbError,
    Settings,
    ClockComponentProps,
    ClockSettings
};