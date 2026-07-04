/**
 * Live weather data layer — Open-Meteo (https://open-meteo.com).
 * Free, keyless, CORS-enabled. All wind speeds normalized to km/h,
 * visibility to km, temperatures to °C.
 */

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  dewPoint: number;
  precipitation: number;
  weatherCode: number;
  cloudCover: number;
  pressure: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  isDay: boolean;
}

export interface HourlyPoint {
  time: string;   // ISO local time
  hour: string;   // "14:00"
  temp: number;
  dewPoint: number;
  precipProb: number;
  precip: number;
  code: number;
  cloudCover: number;
  visibility: number;  // km
  windSpeed: number;   // km/h
  windGust: number;    // km/h
  windDir: number;     // degrees
  uv: number;
  pressure: number;    // hPa
}

export interface DailyInfo {
  sunrise: string;
  sunset: string;
  tempMax: number;
  tempMin: number;
  precipSum: number;
  windMax: number;
}

export interface WeatherBundle {
  current: CurrentWeather;
  hourly: HourlyPoint[];   // next 48 hours from now
  today: DailyInfo;
  timezone: string;
  elevation: number;
}

export interface GeoResult {
  name: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  elevation?: number;
}

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

/** WMO weather interpretation codes → human label + sky kind for icons. */
export function weatherCodeInfo(code: number): { label: string; sky: 'sun' | 'partly' | 'cloud' | 'rain' | 'snow' | 'storm' | 'fog' } {
  if (code === 0) return { label: 'Clear sky', sky: 'sun' };
  if (code === 1) return { label: 'Mainly clear', sky: 'sun' };
  if (code === 2) return { label: 'Partly cloudy', sky: 'partly' };
  if (code === 3) return { label: 'Overcast', sky: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Fog', sky: 'fog' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', sky: 'rain' };
  if (code >= 61 && code <= 67) return { label: 'Rain', sky: 'rain' };
  if (code >= 71 && code <= 77) return { label: 'Snow', sky: 'snow' };
  if (code >= 80 && code <= 82) return { label: 'Rain showers', sky: 'rain' };
  if (code === 85 || code === 86) return { label: 'Snow showers', sky: 'snow' };
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', sky: 'storm' };
  return { label: 'Unknown', sky: 'partly' };
}

const COMPASS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
export function degToCompass(deg: number): string {
  return COMPASS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];
}

/**
 * Estimated cloud base (m AGL) from the surface temperature/dew-point
 * spread — the classic lifted condensation level approximation:
 * LCL ≈ 125 m per °C of spread.
 */
export function estimateCloudBase(tempC: number, dewPointC: number): number {
  return Math.max(0, Math.round(125 * (tempC - dewPointC)));
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherBundle> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'dew_point_2m', 'precipitation', 'weather_code', 'cloud_cover',
      'pressure_msl', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'is_day',
    ].join(','),
    hourly: [
      'temperature_2m', 'dew_point_2m', 'precipitation_probability', 'precipitation',
      'weather_code', 'cloud_cover', 'visibility', 'wind_speed_10m', 'wind_gusts_10m',
      'wind_direction_10m', 'uv_index', 'pressure_msl',
    ].join(','),
    daily: 'sunrise,sunset,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    timezone: 'auto',
    wind_speed_unit: 'kmh',
    forecast_days: '3',
  });

  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  const data = await res.json();

  const c = data.current;
  const current: CurrentWeather = {
    temperature: c.temperature_2m,
    apparentTemperature: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    dewPoint: c.dew_point_2m,
    precipitation: c.precipitation,
    weatherCode: c.weather_code,
    cloudCover: c.cloud_cover,
    pressure: c.pressure_msl,
    windSpeed: c.wind_speed_10m,
    windGust: c.wind_gusts_10m,
    windDirection: c.wind_direction_10m,
    isDay: c.is_day === 1,
  };

  const h = data.hourly;
  const nowIdx = Math.max(0, (h.time as string[]).findIndex((t) => t >= (data.current.time as string)));
  const hourly: HourlyPoint[] = (h.time as string[])
    .map((time: string, i: number): HourlyPoint => ({
      time,
      hour: time.slice(11, 16),
      temp: h.temperature_2m[i],
      dewPoint: h.dew_point_2m[i],
      precipProb: h.precipitation_probability?.[i] ?? 0,
      precip: h.precipitation[i],
      code: h.weather_code[i],
      cloudCover: h.cloud_cover[i],
      visibility: (h.visibility?.[i] ?? 10000) / 1000,
      windSpeed: h.wind_speed_10m[i],
      windGust: h.wind_gusts_10m[i],
      windDir: h.wind_direction_10m[i],
      uv: h.uv_index?.[i] ?? 0,
      pressure: h.pressure_msl?.[i] ?? current.pressure,
    }))
    .slice(nowIdx, nowIdx + 48);

  const d = data.daily;
  const today: DailyInfo = {
    sunrise: d.sunrise[0],
    sunset: d.sunset[0],
    tempMax: d.temperature_2m_max[0],
    tempMin: d.temperature_2m_min[0],
    precipSum: d.precipitation_sum[0],
    windMax: d.wind_speed_10m_max[0],
  };

  return { current, hourly, today, timezone: data.timezone, elevation: data.elevation };
}

export async function searchLocations(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({ name: query.trim(), count: '6', language: 'en', format: 'json' });
  const res = await fetch(`${GEOCODE_URL}?${params}`);
  if (!res.ok) throw new Error(`Geocoding responded ${res.status}`);
  const data = await res.json();
  interface RawGeo { name: string; admin1?: string; country?: string; latitude: number; longitude: number; elevation?: number }
  return ((data.results ?? []) as RawGeo[]).map((r) => ({
    name: r.name,
    region: [r.admin1, r.country].filter(Boolean).join(', '),
    country: r.country ?? '',
    lat: r.latitude,
    lng: r.longitude,
    elevation: r.elevation,
  }));
}
