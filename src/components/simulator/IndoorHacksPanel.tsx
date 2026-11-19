"use client";

import React, { useState } from "react";
import {
  Wrench,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PRACTICAL_INDOOR_HACKS, IndoorAirHack } from "@/lib/simulator/indoor-hacks";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function IndoorHacksPanel() {
  const [expandedHackId, setExpandedHackId] = useState<string | null>("hack_wet_mopping");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const filteredHacks = selectedFilter === "all"
    ? PRACTICAL_INDOOR_HACKS
    : PRACTICAL_INDOOR_HACKS.filter((h) => h.category === selectedFilter || (selectedFilter === "zero_cost" && h.estimatedCostINR === 0));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/40 dark:bg-cyan-950/20 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-xs">
                <Wrench className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Practical Indoor Air Quality Hacks for Indian Families
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                  Affordable, evidence-based interventions to slash household PM2.5 without requiring expensive ₹15,000+ air purifiers.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs bg-white dark:bg-[#1E293B] border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300">
              6 Verified Hacks
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 text-xs text-slate-600 dark:text-slate-300">
          <div role="group" aria-label="Filter indoor hacks by category" className="flex flex-wrap gap-2 pt-2 border-t border-cyan-200/60 dark:border-cyan-900/40">
            <button
              type="button"
              aria-pressed={selectedFilter === "all"}
              onClick={() => setSelectedFilter("all")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                selectedFilter === "all"
                  ? "bg-cyan-700 text-white"
                  : "bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
              }`}
            >
              All Hacks (6)
            </button>
            <button
              type="button"
              aria-pressed={selectedFilter === "zero_cost"}
              onClick={() => setSelectedFilter("zero_cost")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                selectedFilter === "zero_cost"
                  ? "bg-cyan-700 text-white"
                  : "bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
              }`}
            >
              Zero Cost (₹0)
            </button>
            <button
              type="button"
              aria-pressed={selectedFilter === "cleaning"}
              onClick={() => setSelectedFilter("cleaning")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                selectedFilter === "cleaning"
                  ? "bg-cyan-700 text-white"
                  : "bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
              }`}
            >
              Cleaning & Dust
            </button>
            <button
              type="button"
              aria-pressed={selectedFilter === "cooking"}
              onClick={() => setSelectedFilter("cooking")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                selectedFilter === "cooking"
                  ? "bg-cyan-700 text-white"
                  : "bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
              }`}
            >
              Kitchen & Tadka
            </button>
            <button
              type="button"
              aria-pressed={selectedFilter === "diy_filtration"}
              onClick={() => setSelectedFilter("diy_filtration")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                selectedFilter === "diy_filtration"
                  ? "bg-cyan-700 text-white"
                  : "bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
              }`}
            >
              DIY Box Fan Air Cleaner
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Practical Hacks */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredHacks.map((hack: IndoorAirHack) => {
          const isExpanded = expandedHackId === hack.id;

          return (
            <Card
              key={hack.id}
              className={`transition-all border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs ${
                isExpanded ? "ring-1 ring-cyan-600 dark:ring-cyan-500" : ""
              }`}
            >
              <CardHeader
                className="pb-3 cursor-pointer"
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-label={`${hack.title}. Click to ${isExpanded ? "collapse" : "expand"} full instructions and scientific explanation.`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedHackId(isExpanded ? null : hack.id);
                  }
                }}
                onClick={() => setExpandedHackId(isExpanded ? null : hack.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      className={`text-[10px] font-bold ${
                        hack.estimatedCostINR === 0
                          ? "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-sky-100 text-sky-950 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                      }`}
                    >
                      {hack.costLabel}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                      -{hack.expectedPM25ReductionPercent}% PM2.5
                    </Badge>
                  </div>
                  <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                    {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                  </div>
                </div>

                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {hack.title}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  {hack.tagline}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-0 text-xs text-slate-600 dark:text-slate-300">
                {/* Metric Summary Badges */}
                <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#1E293B]/60 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Time to drop: <strong>~{hack.timeToImpactMinutes} mins</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Est. Cost: <strong>₹{hack.estimatedCostINR}</strong></span>
                  </div>
                </div>

                {/* Practical Instructions */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                    Step-by-Step Instructions:
                  </span>
                  <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-300">
                    {hack.instructions.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expanded Details: Scientific Mechanism & Provenance */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-[11px] animate-in fade-in-50">
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block">Why it works (Physics & Chemistry):</strong>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">{hack.whyItWorks}</p>
                    </div>

                    <div className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Calculation Methodology:</span>
                        <Badge variant="outline" className="text-[9px] border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                          {hack.provenance}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {hack.calculationMethodology}
                      </p>
                    </div>

                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      <strong>Assumptions & Limitations:</strong> {hack.limitations}
                    </div>

                    <div className="text-[9px] text-slate-400 dark:text-slate-500 italic">
                      * Note: Indoor hack percentage reductions are derived from empirical chamber benchmarks and building mass-balance calculations, not individual home sensor telemetry.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
