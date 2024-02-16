import { keyBy } from 'lodash';
import moment from 'moment';
import React, { useCallback } from 'react';
import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import './App.scss';
import ClockRegistry from './ClockRegistry';
import { defaultSettings } from './Constants';
import Countdown from './Countdown/Countdown';
import SettingsService from './Services/SettingsServices';
import { Settings, ClockComponentProps, ClockSettings } from './types';
import { useWakeLock } from 'react-screen-wake-lock';
function App(): JSX.Element {
  const [ settings, setSettings ] = useState<Settings>(defaultSettings);
  const [ time, setTime ] = useState(new Date());
  const [ timerIsActive, setTimerIsActive ] = useState<{ isActive: boolean, remaining?: number }>({ isActive: false });

  const updateTime = useCallback(() => {
    setTime(new Date());
  }, []);

  setTimeout(updateTime, 1000);
  const { request, release } = useWakeLock();
  useEffect(() => {
    // Use this to lock the screen when the component mounts
    request();

    // Optionally, release the screen lock when the component unmounts
    return () => {
      release();
    };
  }, [ release, request ]);

  const { ForceReload, RefreshRate } = settings;
  const needsRefresh = time.getUTCSeconds() % RefreshRate === 0;
  const needsReload = time.getUTCMinutes() % 60 === 0 && time.getSeconds() === 2;

  const needsTimer = (settings: Settings): { isActive: boolean, timer: number } => {
    const found = settings.Schedule.find(item => moment().isBetween(moment(item.fromTime, 'HH:mm'), moment(item.toTime, 'HH:mm')) && item.clockType === 'countdown');
    if (found) {
      return ({ isActive: true, timer: moment(found.toTime, 'HH:mm').diff(moment(), 'second') });
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
      });
    }
  }, [ needsRefresh, timerIsActive.isActive ]);

  useEffect(() => {
    const fetchData = async () => {
      const newSettings = await SettingsService.getSettings();
      setSettings(newSettings);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (ForceReload && !timerIsActive) {
      SettingsService.updateSettings({ ...settings, ForceReload: false });
      document.location.reload();
    }
  }, [ ForceReload, settings, timerIsActive ]);

  useEffect(() => {
    if (needsReload && !timerIsActive) {
      document.location.reload();
    }
  }, [ needsReload, timerIsActive ]);

  const goToSettings = () => {
    document.location.href = `${document.location.href}settings`;
  };

  const timerFinishes = async () => {
    setTimeout(async () => {
      await SettingsService.updateSettings({ ...settings, Timer: 0 });
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
    clockSettings: getClockSettings(settings)
  };

  let Component = undefined;
  settings.Schedule.forEach(item => {
    if (moment().isBetween(moment(item.fromTime, 'HH:mm'), moment(item.toTime, 'HH:mm'))) {
      componentProps.clockSettings = item.clockSettings;
      Component = registry[ item.clockType ].Component;
    }
  });
  if (!Component) {
    Component = registry[ settings.DefaultClock ].Component;
  }
  return React.createElement(Component, componentProps);
};

const getClockSettings = (settings: Settings): ClockSettings => {
  switch (settings.DefaultClock) {
    case 'digital':
      return settings.DigitalClockDefaultSettings;
    case 'countdown':
      return settings.TimerSettings;
    case 'flipclock':
      return settings.FlipClockDefaultSettings;
    case 'wordClock':
    default:
      return settings.WordClockDefaultSettings;
  }
};

export default App;
