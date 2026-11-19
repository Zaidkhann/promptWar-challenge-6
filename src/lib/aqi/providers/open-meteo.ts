import "server-only";
import { AtmosphericWeather } from "../types";

function degreesToCardinal(deg: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index] || "N";
}

/**
 * Ingests live meteorological vectors and Planetary Boundary Layer (PBL) height from Open-Meteo.
 */
export async function fetchOpenMeteoWeather(
  latitude: number,
  longitude: number
): Promise<AtmosphericWeather> {
  const fallbackWeather: AtmosphericWeather = {
    temperatureC: 22.0,
    relativeHumidityPercent: 65,
    windSpeedKmh: 4.5,
    windDirectionDegrees: 315,
    windDirectionCardinal: "NW",
    boundaryLayerHeightMeters: 450,
    isInversionActive: false,
    inversionRisk: "Medium",
    observedAt: new Date().toISOString(),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    // 1. Fetch current surface meteorology
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&forecast_days=1`;
    // 2. Fetch boundary layer height from Open-Meteo Air Quality
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=boundary_layer_height&forecast_days=1`;

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(weatherUrl, { signal: controller.signal, next: { revalidate: 900 } }),
      fetch(aqiUrl, { signal: controller.signal, next: { revalidate: 900 } }),
    ]);

    clearTimeout(timeoutId);

    let tempC = fallbackWeather.temperatureC;
    let humidity = fallbackWeather.relativeHumidityPercent;
    let windKmh = fallbackWeather.windSpeedKmh;
    let windDeg = fallbackWeather.windDirectionDegrees;
    let boundaryLayerMeters = fallbackWeather.boundaryLayerHeightMeters;

    if (weatherRes.ok) {
      const weatherJson = await weatherRes.json();
      if (weatherJson.current) {
        tempC = Number(weatherJson.current.temperature_2m ?? tempC);
        humidity = Number(weatherJson.current.relative_humidity_2m ?? humidity);
        windKmh = Number(weatherJson.current.wind_speed_10m ?? windKmh);
        windDeg = Number(weatherJson.current.wind_direction_10m ?? windDeg);
      }
    }

    if (aqiRes.ok) {
      const aqiJson = await aqiRes.json();
      const heights: number[] = aqiJson.hourly?.boundary_layer_height;
      if (Array.isArray(heights) && heights.length > 0) {
        // Take current hour's boundary layer height
        const currentHour = new Date().getUTCHours();
        const height = heights[currentHour] ?? heights[0];
        if (Number.isFinite(height) && height > 0) {
          boundaryLayerMeters = Math.round(height);
        }
      }
    }

    const isInversionActive = boundaryLayerMeters < 300 && windKmh < 5.0;
    const inversionRisk: "Low" | "Medium" | "High" =
      boundaryLayerMeters < 250 && windKmh < 4.0
        ? "High"
        : boundaryLayerMeters < 500
        ? "Medium"
        : "Low";

    return {
      temperatureC: Number(tempC.toFixed(1)),
      relativeHumidityPercent: Math.round(humidity),
      windSpeedKmh: Number(windKmh.toFixed(1)),
      windDirectionDegrees: Math.round(windDeg),
      windDirectionCardinal: degreesToCardinal(windDeg),
      boundaryLayerHeightMeters: boundaryLayerMeters,
      isInversionActive,
      inversionRisk,
      observedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("[Open-Meteo Provider] Error fetching weather, returning calibrated fallback:", error);
    return fallbackWeather;
  }
}
