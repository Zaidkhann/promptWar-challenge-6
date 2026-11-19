"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  BotMessageSquare,
  ArrowRight,
  Info,
} from "lucide-react";
import { CommuteComparisonMatrix } from "@/lib/commute/types";
import { CommuteActionImpactAdvisory } from "@/lib/commute/recommendations";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ActionImpactBannerProps {
  matrix: CommuteComparisonMatrix;
  advisories: CommuteActionImpactAdvisory[];
}

export function ActionImpactBanner({ matrix, advisories }: ActionImpactBannerProps) {
  const { optimalMode, summaryTakeaway, route } = matrix;

  const assistantQuery = encodeURIComponent(
    `Compare commute options from ${route.origin.name || "Origin"} to ${
      route.destination.name || "Destination"
    } over ${route.distanceKm} km. Recommended mode is ${optimalMode.label} with deposited dose of ${
      optimalMode.dosimetry.depositedDosePM25Ug
    } µg. How can I minimize my exposure?`
  );

  return (
    <Card className="border-cyan-300 dark:border-cyan-900/60 bg-cyan-50/30 dark:bg-cyan-950/20 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-700 dark:text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
              Action Impact Intelligence
            </span>
          </div>
          <Badge variant="good" className="self-start sm:self-auto">
            Recommended Strategy: {optimalMode.label}
          </Badge>
        </div>

        <CardTitle className="text-base sm:text-lg mt-1 text-slate-900 dark:text-slate-100">
          Optimal Choice: {optimalMode.label}
        </CardTitle>
        <CardDescription className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
          {summaryTakeaway}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Ranked Advisories */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {advisories.slice(0, 4).map((adv) => (
            <div
              key={adv.id}
              className="rounded-lg border border-cyan-200/80 dark:border-cyan-900/60 bg-white dark:bg-[#1E293B]/80 p-3 text-xs space-y-1 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">{adv.headline}</span>
                <span className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-400 uppercase">
                  {adv.priority}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                {adv.suggestedAction}
              </p>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{adv.estimatedImpact}</span>
              </div>
            </div>
          ))}
        </div>

        {/* AI Explanation Call to Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-cyan-200/60 dark:border-cyan-900/60 pt-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Info className="h-4 w-4 text-cyan-700 dark:text-cyan-400 shrink-0" />
            <span>
              Want customized advice for your respiratory health or vehicle type?
            </span>
          </div>

          <Link href={`/assistant?q=${assistantQuery}`}>
            <Button size="sm" variant="outline" className="gap-2 border-cyan-400 dark:border-cyan-700 bg-white dark:bg-[#111827] hover:bg-cyan-50 dark:hover:bg-cyan-950/50 text-cyan-900 dark:text-cyan-300">
              <BotMessageSquare className="h-4 w-4 text-cyan-700 dark:text-cyan-400" />
              <span>Ask SaansAI About These Routes</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
