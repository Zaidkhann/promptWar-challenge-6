"use client";

import React from "react";
import {
  Navigation,
  Clock,
  Shield,
  Target,
  Sparkles,
  MapPin,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
} from "lucide-react";
import { MaskType, OptimizationObjective } from "@/lib/commute/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface RoutePlannerProps {
  origin: string;
  setOrigin: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  departureHour: number;
  setDepartureHour: (val: number) => void;
  maskType: MaskType;
  setMaskType: (val: MaskType) => void;
  objective: OptimizationObjective;
  setObjective: (val: OptimizationObjective) => void;
  onSelectCorridor: (origin: string, dest: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export function RoutePlanner({
  origin,
  setOrigin,
  destination,
  setDestination,
  departureHour,
  setDepartureHour,
  maskType,
  setMaskType,
  objective,
  setObjective,
  onSelectCorridor,
  onAnalyze,
  isLoading,
}: RoutePlannerProps) {
  // Atmospheric description for current departure hour
  const getHourContext = (h: number) => {
    if (h >= 5 && h < 9) {
      return {
        label: "Morning Inversion Layer (Hazardous)",
        color: "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/50 dark:border-rose-900/60",
        icon: AlertCircle,
      };
    } else if (h >= 12 && h < 16) {
      return {
        label: "Solar Convective Window (Optimal Dispersion)",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-900/60",
        icon: Sun,
      };
    } else if (h >= 16 && h < 20) {
      return {
        label: "Evening Rush Hour & Boundary Collapse",
        color: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/50 dark:border-amber-900/60",
        icon: AlertCircle,
      };
    } else {
      return {
        label: "Nocturnal Boundary Stagnation",
        color: "text-slate-700 bg-slate-100 border-slate-300 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700",
        icon: Moon,
      };
    }
  };

  const hourCtx = getHourContext(departureHour);
  const HourIcon = hourCtx.icon;

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">
              Environmental Commute Planner
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            Road Network + IDW Telemetry
          </Badge>
        </div>
        <CardDescription className="text-slate-500 dark:text-slate-400">
          Specify your origin, destination, and departure hour to model spatial aerosol dispersion and lung deposition.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Curated Metropolitan Corridors Quick-Pill Selectors */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Popular Metropolitan Transit Corridors:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectCorridor("Anand Vihar, Delhi", "Connaught Place, New Delhi")}
              className="text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:border-cyan-300 dark:hover:border-cyan-700 px-3 py-1 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Anand Vihar ➔ Connaught Place (12.8 km)
            </button>
            <button
              type="button"
              onClick={() => onSelectCorridor("Indirapuram, Ghaziabad", "Noida Sector 62")}
              className="text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:border-cyan-300 dark:hover:border-cyan-700 px-3 py-1 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Indirapuram ➔ Noida Sec 62 (5.6 km)
            </button>
            <button
              type="button"
              onClick={() => onSelectCorridor("DLF Cyber City, Gurgaon", "Hauz Khas / IIT Delhi")}
              className="text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:border-cyan-300 dark:hover:border-cyan-700 px-3 py-1 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Gurgaon Cyber City ➔ Hauz Khas (17.5 km)
            </button>
            <button
              type="button"
              onClick={() => onSelectCorridor("Bandra West, Mumbai", "Nariman Point, Mumbai")}
              className="text-xs rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:border-cyan-300 dark:hover:border-cyan-700 px-3 py-1 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Bandra West ➔ Nariman Point (18.4 km)
            </button>
          </div>
        </div>

        {/* Origin and Destination Inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Origin Location / Station</span>
            </label>
            <Input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Anand Vihar, Delhi"
              className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span>Destination Location</span>
            </label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Connaught Place, New Delhi"
              className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Departure Hour Slider & Diurnal Boundary Layer Context */}
        <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Clock className="h-4 w-4 text-cyan-700 dark:text-cyan-400" />
              <span>Departure Time: {String(departureHour).padStart(2, "0")}:00 IST</span>
            </div>
            <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${hourCtx.color}`}>
              <HourIcon className="h-3 w-3" />
              <span>{hourCtx.label}</span>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max="23"
            value={departureHour}
            onChange={(e) => setDepartureHour(Number(e.target.value))}
            className="w-full accent-cyan-600 dark:accent-cyan-400 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            <span>00:00 (Midnight)</span>
            <span>08:00 (Morning Rush)</span>
            <span>13:00 (Solar Window)</span>
            <span>18:00 (Evening Rush)</span>
            <span>23:00</span>
          </div>
        </div>

        {/* Objective & Mask Controls */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Optimization Goal */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Optimization Objective</span>
            </label>
            <select
              value={objective}
              onChange={(e) => setObjective(e.target.value as OptimizationObjective)}
              className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
            >
              <option value="lowest_exposure">Lowest Inhaled Particulate Burden (Safest for Lungs)</option>
              <option value="lowest_carbon">Lowest Carbon Emissions (Eco-Friendly)</option>
              <option value="fastest">Shortest Travel Duration (Time Sensitive)</option>
              <option value="balanced">Balanced Environmental & Time Tradeoff</option>
            </select>
          </div>

          {/* Mask Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Personal Mask Protection (η)</span>
            </label>
            <select
              value={maskType}
              onChange={(e) => setMaskType(e.target.value as MaskType)}
              className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
            >
              <option value="NONE">No Mask (0% filtration, full airway exposure)</option>
              <option value="CLOTH">Cloth Mask (20% nominal protection, loose weave)</option>
              <option value="SURGICAL">Surgical Mask (45% protection, perimeter leak)</option>
              <option value="N95">N95 / FFP2 Respirator (95% certified tight seal)</option>
            </select>
          </div>
        </div>

        {/* Calculate Button */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={onAnalyze}
            disabled={isLoading || !origin.trim() || !destination.trim()}
            size="lg"
            className="w-full sm:w-auto gap-2"
          >
            {isLoading ? (
              <span>Calculating Route Dosimetry...</span>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Analyze Commute Alternatives</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
