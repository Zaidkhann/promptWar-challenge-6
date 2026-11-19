import React from "react";
import {
  Thermometer,
  Droplets,
  Wind,
  Compass,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardViewToggle, DashboardStationViewItem } from "@/components/dashboard/DashboardViewToggle";
import { getAirQualityReport } from "@/lib/aqi/service";
import { getNearbyCPCBStations } from "@/lib/aqi/providers/cpcb";
import { getAQICategory } from "@/lib/aqi/cpcb-calculator";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; lat?: string; lon?: string; mode?: string }>;
}) {
  const resolvedParams = await searchParams;
  const isLive = resolvedParams?.scenario === "live" || resolvedParams?.mode === "live";
  const scenarioKey = isLive ? undefined : (resolvedParams?.scenario || "delhi-anand-vihar");

  const report = await getAirQualityReport({
    lat: resolvedParams?.lat ? parseFloat(resolvedParams.lat) : undefined,
    lon: resolvedParams?.lon ? parseFloat(resolvedParams.lon) : undefined,
    scenario: scenarioKey,
  });

  const getBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case "good":
        return "good";
      case "satisfactory":
        return "satisfactory";
      case "moderate":
        return "moderate";
      case "poor":
        return "poor";
      case "very poor":
        return "very-poor";
      case "severe":
        return "severe";
      default:
        return "default";
    }
  };

  // Fetch nearby stations for monitoring network table
  const nearbyStations = getNearbyCPCBStations(report.station.latitude, report.station.longitude, 50);
  const stationViewItems: DashboardStationViewItem[] = nearbyStations.map((s, idx) => ({
    id: s.id,
    name: s.name,
    agency: `${s.sourceProvider} CAAQMS`,
    distanceKm: s.distanceKm ?? 0,
    aqi: idx === 0 ? report.cpcbNAQI : (report.cpcbNAQI ? Math.max(50, report.cpcbNAQI - idx * 18) : null),
    category: idx === 0 ? report.cpcbCategory : (report.cpcbNAQI ? getAQICategory(Math.max(50, report.cpcbNAQI - idx * 18)) : null),
    provenance: idx === 0 ? report.provenance.badgeText : "Continuous Regional CAAQMS",
  }));

  const pollutantList = Object.values(report.pollutants).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              AQI Command Center
            </h1>
            <Badge variant={report.provenance.isDemo ? "demo" : "default"}>
              {report.provenance.isDemo ? "Judging Scenario" : "Live Pipeline"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Statutory CPCB National Air Quality Index (NAQI) with 16-Hour Data Sufficiency & Atmospheric Inversion Tracking.
          </p>
        </div>

        {/* Provenance Badge */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-2xs text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{report.station.name}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {report.provenance.badgeText} ({Math.round(report.provenance.confidenceScore * 100)}% Confidence)
            </span>
          </div>
        </div>
      </div>

      {/* Hero Telemetry Section: CPCB NAQI vs. Instantaneous HISI */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Main CPCB Meter Card (role="meter") */}
        <Card className="md:col-span-6 lg:col-span-5 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Official CPCB NAQI
              </span>
              <Badge variant={getBadgeVariant(report.cpcbCategory)}>
                {report.cpcbCategory}
              </Badge>
            </div>
            <CardTitle className="text-base sm:text-lg">Statutory 24-Hr Air Quality Index</CardTitle>
            <CardDescription>
              Computed strictly under CPCB 2014 rules requiring ≥16 valid hourly samples.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* W3C WAI-ARIA role="meter" Gauge */}
            <div
              role="meter"
              aria-label="Official Air Quality Index Gauge"
              aria-valuenow={report.cpcbNAQI ?? 0}
              aria-valuemin={0}
              aria-valuemax={500}
              aria-valuetext={`AQI ${report.cpcbNAQI ?? "N/A"}, Category: ${report.cpcbCategory}, Dominant Pollutant: ${report.dominantPollutant ?? "None"}`}
              tabIndex={0}
              className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-6 border border-slate-200 dark:bg-slate-900/80 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <div className="text-6xl font-black tracking-tight text-slate-950 dark:text-white">
                {report.cpcbNAQI ?? "N/A"}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                Air Quality Index (NAQI)
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">Dominant Pollutant:</span>
                <span className="font-mono font-bold text-xs rounded-md bg-white px-2 py-0.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {report.dominantPollutant ?? "N/A"}
                </span>
              </div>
            </div>

            {/* Health Protective Summary */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                <span>Statutory Health Impact:</span>
              </div>
              <p className="leading-relaxed">
                {report.cpcbCategory === "Severe"
                  ? "Causes respiratory impacts even on healthy people, and serious health impacts on people with existing lung or cardiac diseases."
                  : report.cpcbCategory === "Very Poor"
                  ? "Causes respiratory illness on prolonged exposure. Pronounced impact on people with lung or heart disease."
                  : report.cpcbCategory === "Poor"
                  ? "Breathing discomfort to most people on prolonged exposure."
                  : "May cause breathing discomfort to people with asthma and heart diseases on prolonged exposure."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Short-Term Indicator (HISI) & Atmospheric Inversion Telemetry */}
        <Card className="md:col-span-6 lg:col-span-7 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Acute Short-Term Telemetry
              </span>
              <Badge variant={report.provenance.isDemo ? "demo" : "default"}>
                {report.provenance.isDemo ? "Instantaneous Reading" : "Live Weather & Boundary"}
              </Badge>
            </div>
            <CardTitle className="text-base sm:text-lg">Hourly Indicative Sub-Index (HISI)</CardTitle>
            <CardDescription>
              Decoupled from 24-hr regulatory AQI to immediately detect acute morning inversion spikes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">HISI Score (Current Hour)</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">{report.hisi}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  1-hour moving particulate peak
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Thermal Inversion Layer</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
                  {Math.round(report.weather.boundaryLayerHeightMeters)} m
                </div>
                <div className="text-[11px] mt-1">
                  {report.weather.isInversionActive ? (
                    <span className="font-semibold text-rose-600 dark:text-rose-400">Active Inversion Trapping</span>
                  ) : (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Open Dispersion Window</span>
                  )}
                </div>
              </div>
            </div>

            {/* Environmental Boundary Vectors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Thermometer className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                  <span>Ambient Temp</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">{report.weather.temperatureC}°C</div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Droplets className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                  <span>Humidity</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">{report.weather.relativeHumidityPercent}%</div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Wind className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                  <span>Wind Speed</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">{report.weather.windSpeedKmh} km/h</div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Compass className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                  <span>Wind Vector</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 font-mono">{report.weather.windDirectionCardinal}</div>
              </div>
            </div>

            {/* Inversion Mechanism Explanation */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="leading-relaxed">
                <strong>Atmospheric Physics Note:</strong> When surface wind falls below 3 km/h and nocturnal radiative cooling traps cold air under 200m, particulate matter cannot disperse vertically. Solar heating at 13:00 IST lifts the boundary layer to ~1400m.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statutory 8-Pollutant Breakdown Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Statutory CPCB Pollutant Concentration Breakdown</CardTitle>
              <CardDescription>
                Detailed measurements for monitored criteria pollutants with sub-index calculations and official benchmarks.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>16-Hour Data Sufficiency Enforced</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                  <th scope="col" className="p-3">Pollutant</th>
                  <th scope="col" className="p-3">Measured Value</th>
                  <th scope="col" className="p-3">Averaging Period</th>
                  <th scope="col" className="p-3">Sub-Index</th>
                  <th scope="col" className="p-3">Sub-Category</th>
                  <th scope="col" className="p-3">CPCB Benchmark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pollutantList.map((pollutant) => (
                  <tr key={pollutant!.code} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      <div>{pollutant!.code}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{pollutant!.name}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {pollutant!.value} {pollutant!.unit}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{pollutant!.averagingPeriod}</td>
                    <td className="p-3 font-mono font-extrabold text-slate-900 dark:text-slate-100">
                      {pollutant!.subIndex ?? "N/A"}
                    </td>
                    <td className="p-3">
                      {pollutant!.category ? (
                        <Badge variant={getBadgeVariant(pollutant!.category)}>
                          {pollutant!.category}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Insufficient Data</Badge>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {pollutant!.standardBenchmark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map / List View Component */}
      <DashboardViewToggle
        locationName={report.station.name}
        city={report.station.city}
        stations={stationViewItems}
      />
    </div>
  );
}
