import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  degToCompass,
  estimateCloudBase,
  fetchWeather,
  weatherCodeInfo,
  type WeatherBundle,
} from '../lib/weather';
import { useAppStore } from '../store/app';

/**
 * Streams real weather for the active location into the app.
 * Refreshes every 60 s; Open-Meteo updates its models continuously.
 */
export function useWeather() {
  const location = useAppStore((s) => s.location);
  return useQuery<WeatherBundle>({
    queryKey: ['weather', location.lat, location.lng],
    queryFn: () => fetchWeather(location.lat, location.lng),
    refetchInterval: 60_000,
    staleTime: 55_000,
  });
}

/**
 * Mount once in the shell: merges live weather into the telemetry store
 * so every screen reads real atmospheric data. Flight dynamics (battery,
 * altitude, speed) remain simulated — clearly a demo aircraft — but the
 * weather it flies through is real.
 */
export function useLiveWeatherBridge() {
  const query = useWeather();
  const data = query.data;

  useEffect(() => {
    if (!data) return;
    const { current, hourly } = data;
    const nowHour = hourly[0];
    useAppStore.getState().setTelemetry((prev) => ({
      ...prev,
      temperature: current.temperature,
      dewPoint: current.dewPoint,
      humidity: current.humidity,
      pressure: current.pressure,
      precipitation: current.precipitation,
      windSpeed: current.windSpeed,
      windGust: current.windGust,
      windDir: degToCompass(current.windDirection),
      windHeading: current.windDirection,
      visibility: nowHour ? nowHour.visibility : prev.visibility,
      uvIndex: nowHour ? nowHour.uv : prev.uvIndex,
      cloudBase: estimateCloudBase(current.temperature, current.dewPoint),
      conditions: weatherCodeInfo(current.weatherCode).label,
    }));
  }, [data]);

  return query;
}
