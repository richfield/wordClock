import { keyBy } from 'lodash';
import React from 'react';
import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import './App.scss';
import ClockRegistry from './ClockRegistry';
import { defaultSettings } from './Constants';
import Countdown from './Countdown/Countdown';
import SettingsService from './Services/SettingsServices';
import { findActiveSchedule, secondsUntil } from './schedule';
import { Settings, ClockComponentProps, ClockSettings } from './types';
import { useWakeLock } from 'react-screen-wake-lock';
function App(): JSX.Element {
  const [ settings, setSettings ] = useState<Settings>(defaultSettings);
  const [ time, setTime ] = useState(new Date());
  const [ timerIsActive, setTimerIsActive ] = useState<{ isActive: boolean, remaining?: number }>({ isActive: false });

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { request } = useWakeLock();
  useEffect(() => {
    // Use this to lock the screen when the component mounts
    request();
  }, [ request ]);

  const { ForceReload, RefreshRate } = settings;
  const needsRefresh = RefreshRate > 0 && time.getUTCSeconds() % RefreshRate === 0;
  const needsReload = time.getUTCMinutes() % 60 === 0 && time.getSeconds() === 2;

  const needsTimer = (settings: Settings): { isActive: boolean, timer: number } => {
    const found = findActiveSchedule(settings.Schedule, new Date(), item => item.clockType === 'countdown');
    if (found) {
      return ({ isActive: true, timer: secondsUntil(new Date(), found.toTime) });
    } else {
      return ({ isActive: settings.Timer > 0, timer: settings.Timer });
    }
  };

  useEffect(() => {
    if (needsRefresh) {
      SettingsService.getSettings().then(result => {
        const checkResult = needsTimer(result);
        setSettings(result);
        if (checkResult.isActive) {
          if (checkResult.isActive && !timerIsActive.isActive) {
            return setTimerIsActive({ isActive: true, remaining: checkResult.timer });
          }
          if (checkResult.isActive && result.Timer > 0) {
            return setTimerIsActive({ isActive: true, remaining: result.Timer });
          }
        } else {
          return setTimerIsActive({ isActive: false });
        }
      // eslint-disable-next-line no-console
      }).catch(error => console.error('Failed to refresh settings', error));
    }
  }, [ needsRefresh, timerIsActive.isActive ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setSettings(await SettingsService.getSettings());
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to load settings', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (ForceReload && !timerIsActive.isActive) {
      SettingsService.patchSettings({ ForceReload: false })
        // eslint-disable-next-line no-console
        .catch(error => console.error('Failed to reset ForceReload', error))
        .finally(() => document.location.reload());
    }
  }, [ ForceReload, settings, timerIsActive.isActive ]);

  useEffect(() => {
    if (needsReload && !timerIsActive.isActive) {
      document.location.reload();
    }
  }, [ needsReload, timerIsActive.isActive ]);

  const goToSettings = () => {
    document.location.href = `${document.location.href}settings`;
  };

  const timerFinishes = async () => {
    setTimeout(async () => {
      await SettingsService.patchSettings({ Timer: 0 });
      setTimerIsActive({ isActive: false });
    }, 10000);
  };
  return (
    <Container fluid onDoubleClick={goToSettings}>
      {timerIsActive.isActive ? <Countdown time={time} clockSettings={settings.TimerSettings} timer={timerIsActive.remaining} finished={timerFinishes} />
        : <Clock settings={settings} time={time} />
      }

    </Container>
  );
}

const Clock = (props: { settings: Settings; time: Date; }) => {
  const { settings } = props;
  const registry = keyBy(ClockRegistry, 'id');
  let componentProps: ClockComponentProps = {
    ...props,
    clockSettings: getClockSettings(settings, settings.DefaultClock)
  };

  let Component = undefined;
  const active = findActiveSchedule(settings.Schedule, props.time, item => item.clockType in registry);
  if (active) {
    componentProps.clockSettings = active.clockSettings ?? getClockSettings(settings, active.clockType);
    Component = registry[ active.clockType ].Component;
  }
  if (!Component) {
    Component = registry[ settings.DefaultClock ]?.Component ?? registry.wordclock.Component;
  }
  return React.createElement(Component, componentProps);
};

const getClockSettings = (settings: Settings, clockType: string): ClockSettings => {
  switch (clockType) {
    case 'digital':
      return settings.DigitalClockDefaultSettings;
    case 'countdown':
      return settings.TimerSettings;
    case 'flipclock':
      return settings.FlipClockDefaultSettings;
    case 'clockClock24':
      return settings.ClockClock24DefaultSettings;
    case 'wordclock':
    default:
      return settings.WordClockDefaultSettings;
  }
};

export default App;
