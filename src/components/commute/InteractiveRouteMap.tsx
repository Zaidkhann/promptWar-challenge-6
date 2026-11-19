"use client";

import React, { useState, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Radio,
  Flame,
} from "lucide-react";
import { RoutePoint, SegmentExposurePoint } from "@/lib/commute/types";
import { Badge } from "@/components/ui/badge";

interface InteractiveRouteMapProps {
  geometry: Array<[number, number]>; // [lat, lon]
  segments: SegmentExposurePoint[];
  origin: RoutePoint;
  destination: RoutePoint;
  className?: string;
}

export function InteractiveRouteMap({
  geometry,
  segments,
  origin,
  destination,
  className = "",
}: InteractiveRouteMapProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredSegment, setHoveredSegment] = useState<SegmentExposurePoint | null>(null);

  // SVG canvas dimensions
  const svgWidth = 800;
  const svgHeight = 440;
  const padding = 55;

  // Compute bounding box
  const bounds = useMemo(() => {
    if (!geometry || geometry.length === 0) {
      return {
        minLat: 28.5,
        maxLat: 28.7,
        minLon: 77.1,
        maxLon: 77.4,
      };
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLon = Infinity;
    let maxLon = -Infinity;

    for (const [lat, lon] of geometry) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    }

    // Add margin
    const latSpan = Math.max(0.015, maxLat - minLat);
    const lonSpan = Math.max(0.02, maxLon - minLon);

    return {
      minLat: minLat - latSpan * 0.15,
      maxLat: maxLat + latSpan * 0.15,
      minLon: minLon - lonSpan * 0.15,
      maxLon: maxLon + lonSpan * 0.15,
    };
  }, [geometry]);

  // Coordinate projection from [lat, lon] to SVG (x, y)
  const projectCoord = (lat: number, lon: number): [number, number] => {
    const lonSpan = bounds.maxLon - bounds.minLon;
    const latSpan = bounds.maxLat - bounds.minLat;

    const x = padding + ((lon - bounds.minLon) / lonSpan) * (svgWidth - 2 * padding);
    // Invert latitude for SVG y-axis (higher lat = lower y)
    const y = svgHeight - padding - ((lat - bounds.minLat) / latSpan) * (svgHeight - 2 * padding);

    return [x, y];
  };

  // Color generator based on PM2.5 concentration
  const getPollutionColor = (pm25: number) => {
    if (pm25 <= 30) return "#10B981"; // Good (Emerald)
    if (pm25 <= 60) return "#34D399"; // Satisfactory
    if (pm25 <= 120) return "#FBBF24"; // Moderate (Amber)
    if (pm25 <= 250) return "#F97316"; // Poor (Orange)
    if (pm25 <= 380) return "#EF4444"; // Very Poor (Red)
    return "#881337"; // Severe (Maroon)
  };

  const [originX, originY] = projectCoord(origin.lat, origin.lon);
  const [destX, destY] = projectCoord(destination.lat, destination.lon);

  // Projected polyline points
  const projectedPolyline = useMemo(() => {
    if (!geometry || geometry.length === 0) return "";
    const lonSpan = bounds.maxLon - bounds.minLon;
    const latSpan = bounds.maxLat - bounds.minLat;
    return geometry
      .map(([lat, lon]) => {
        const x = padding + ((lon - bounds.minLon) / lonSpan) * (svgWidth - 2 * padding);
        const y = svgHeight - padding - ((lat - bounds.minLat) / latSpan) * (svgHeight - 2 * padding);
        return `${x},${y}`;
      })
      .join(" ");
  }, [geometry, bounds, padding, svgWidth, svgHeight]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-xs ${className}`}>
      {/* Top Map Header Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Badge variant="outline" className="border-slate-700 bg-slate-950/80 text-cyan-400 font-mono text-[11px] backdrop-blur-xs">
            <Radio className="h-3 w-3 mr-1 text-cyan-400 animate-pulse" />
            <span>IDW Spatial Dispersion Surface</span>
          </Badge>
          <span className="hidden sm:inline-block text-[11px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
            {segments.length} Waypoints Sampled
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-950/85 p-1 rounded-lg border border-slate-800 pointer-events-auto backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Vector Map Container */}
      <div className="w-full overflow-hidden flex items-center justify-center p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[460px] transition-transform duration-300 ease-out select-none"
          style={{ transform: `scale(${zoomLevel})` }}
          aria-label="Interactive Commute Exposure Map"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="road-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="0.75" />
            </pattern>

            {/* Glowing Glow Filter */}
            <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width={svgWidth} height={svgHeight} fill="#0F172A" />
          <rect width={svgWidth} height={svgHeight} fill="url(#road-grid)" />

          {/* Background Ambient Heat Halo */}
          {segments.map((seg, i) => {
            const [x1, y1] = projectCoord(seg.start.lat, seg.start.lon);
            const [x2, y2] = projectCoord(seg.end.lat, seg.end.lon);
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const radius = seg.isHotspot ? 48 : 32;

            return (
              <circle
                key={`halo_${i}`}
                cx={midX}
                cy={midY}
                r={radius}
                fill={getPollutionColor(seg.estimatedPM25)}
                opacity={seg.isHotspot ? 0.18 : 0.08}
              />
            );
          })}

          {/* Base Road Polyline Underlay */}
          {projectedPolyline && (
            <polyline
              points={projectedPolyline}
              fill="none"
              stroke="#042F2E"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Segment-Level Colored Road Overlay */}
          {segments.map((seg, i) => {
            const [x1, y1] = projectCoord(seg.start.lat, seg.start.lon);
            const [x2, y2] = projectCoord(seg.end.lat, seg.end.lon);
            const color = getPollutionColor(seg.estimatedPM25);
            const isHovered = hoveredSegment?.segmentIndex === seg.segmentIndex;

            return (
              <g
                key={`seg_${i}`}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredSegment(seg)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                {/* Hit target for easy hovering */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="transparent"
                  strokeWidth="24"
                  strokeLinecap="round"
                />

                {/* Visible Colored Segment */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth={isHovered ? "8" : "5"}
                  strokeLinecap="round"
                  filter={seg.isHotspot || isHovered ? "url(#route-glow)" : undefined}
                />

                {/* Hotspot Alert Indicator */}
                {seg.isHotspot && (
                  <circle
                    cx={(x1 + x2) / 2}
                    cy={(y1 + y2) / 2}
                    r="4"
                    fill="#F43F5E"
                    className="animate-ping"
                  />
                )}
              </g>
            );
          })}

          {/* Origin Marker (Point A) */}
          <g transform={`translate(${originX}, ${originY})`} className="cursor-pointer">
            <circle r="14" fill="#06B6D4" opacity="0.25" className="animate-pulse" />
            <circle r="8" fill="#0891B2" stroke="#FFFFFF" strokeWidth="2" />
            <text x="0" y="3.5" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
              A
            </text>
            <text
              x="0"
              y="-14"
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="10"
              fontWeight="600"
              className="drop-shadow-md"
            >
              {origin.name?.split(",")[0] || "Origin"}
            </text>
          </g>

          {/* Destination Marker (Point B) */}
          <g transform={`translate(${destX}, ${destY})`} className="cursor-pointer">
            <circle r="14" fill="#F43F5E" opacity="0.25" className="animate-pulse" />
            <circle r="8" fill="#E11D48" stroke="#FFFFFF" strokeWidth="2" />
            <text x="0" y="3.5" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">
              B
            </text>
            <text
              x="0"
              y="-14"
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="10"
              fontWeight="600"
              className="drop-shadow-md"
            >
              {destination.name?.split(",")[0] || "Destination"}
            </text>
          </g>

          {/* Nearby Monitoring Station Indicators */}
          {segments.map((seg, idx) => {
            if (idx % 3 !== 0) return null; // Show sample of stations to prevent crowding
            const [x, y] = projectCoord(seg.start.lat, seg.start.lon);
            const offsetX = idx % 2 === 0 ? 32 : -32;
            const offsetY = idx % 2 === 0 ? -28 : 28;

            return (
              <g key={`station_${idx}`} transform={`translate(${x + offsetX}, ${y + offsetY})`}>
                <line x1={-offsetX} y1={-offsetY} x2={0} y2={0} stroke="#334155" strokeDasharray="2,2" strokeWidth="1" />
                <rect x="-35" y="-10" width="70" height="20" rx="4" fill="#020617" stroke="#334155" strokeWidth="1" />
                <circle cx="-25" cy="0" r="3" fill="#38BDF8" />
                <text x="-16" y="3" fill="#94A3B8" fontSize="8" fontWeight="500">
                  {seg.nearestStationName.split(",")[0].slice(0, 9)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hovered Segment Details Overlay Card */}
      {hoveredSegment && (
        <div className="absolute bottom-14 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-20 rounded-lg border border-slate-700 bg-slate-950/95 p-3 text-xs text-white shadow-xl backdrop-blur-md animate-in fade-in-50">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-semibold text-slate-300">
              Waypoint #{hoveredSegment.segmentIndex + 1}
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{
                backgroundColor: `${getPollutionColor(hoveredSegment.estimatedPM25)}25`,
                color: getPollutionColor(hoveredSegment.estimatedPM25),
              }}
            >
              {hoveredSegment.estimatedPM25} µg/m³ PM2.5
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500 block">Distance</span>
              <span className="font-medium">{hoveredSegment.distanceKm} km</span>
            </div>
            <div>
              <span className="text-slate-500 block">Nearest Monitor</span>
              <span className="font-medium truncate block">{hoveredSegment.nearestStationName.split(",")[0]}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Station Distance</span>
              <span className="font-medium">{hoveredSegment.nearestStationDistanceKm} km</span>
            </div>
            <div>
              <span className="text-slate-500 block">Confidence</span>
              <span className="font-medium">{Math.round(hoveredSegment.confidenceScore * 100)}%</span>
            </div>
          </div>
          {hoveredSegment.measurementType && (
            <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-800 pt-1.5 flex items-center justify-between">
              <span>Data Provenance:</span>
              <span className="font-medium text-cyan-400">
                {hoveredSegment.measurementType === "real_openaq"
                  ? "Real OpenAQ v3"
                  : hoveredSegment.measurementType === "real_cpcb"
                  ? "Real CPCB Monitor"
                  : hoveredSegment.measurementType === "idw_spatial_interpolation"
                  ? "IDW Interpolation"
                  : "Calibrated Baseline"}
              </span>
            </div>
          )}
          {hoveredSegment.isHotspot && (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-900/60 font-semibold">
              <Flame className="h-3 w-3" />
              <span>Pollution Hotspot (Arterial exhaust accumulation)</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Color Scale Legend */}
      <div className="border-t border-slate-800 bg-slate-950/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-300">PM2.5 Heat:</span>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>&lt;60 Good</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>120 Mod</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span>250 Poor</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>380 Very Poor</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-950 border border-rose-600" />
            <span>&gt;380 Severe</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          <span>● A: Origin</span>
          <span>■ B: Destination</span>
        </div>
      </div>
    </div>
  );
}
