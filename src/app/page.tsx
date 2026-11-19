import Link from "next/link";
import type { Metadata } from "next";
import {
  LayoutDashboard,
  CalendarClock,
  Home,
  Navigation,
  BotMessageSquare,
  ShieldCheck,
  Activity,
  ArrowRight,
  Scale,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "SaansAI — Urban Air Quality Companion & Environmental Intelligence",
  description: "GenAI-powered environmental assistant helping families navigate severe winter smog with low-emission routines, indoor air solutions, and sustainable alternatives.",
};

export default function HomePage() {
  return (
    <div className="space-y-10 py-2">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-2xs dark:border-slate-800 dark:bg-[#111827] transition-colors">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800 dark:border-cyan-800/80 dark:bg-cyan-950/60 dark:text-cyan-300">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
            <span>Google Developers Prompt War Challenge 6</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl leading-tight dark:text-white">
            Navigate Winter Smog with <span className="text-cyan-600 dark:text-cyan-400">Actionable Environmental Intelligence</span>
          </h1>

          <p className="text-sm text-slate-600 sm:text-base leading-relaxed dark:text-slate-300">
            SaansAI is a GenAI-powered environmental assistant built to help families and communities navigate severe winter smog and urban air pollution.
            We suggest low-emission daily routines, practical indoor air quality hacks, and sustainable alternatives tailored to your location and lifestyle,
            while clearly explaining the direct impact of your choices.
          </p>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/dashboard">
              <Button size="md" className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium">
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                <span>Check Live AQI at My Location</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>

            <Link href="/routine">
              <Button variant="outline" size="md" className="gap-2">
                <CalendarClock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                <span>Personalize Daily Smog Routine</span>
              </Button>
            </Link>
          </div>

          {/* Provenance Footnote */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-5 border-t border-slate-100 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Statutory CPCB NAQI Engine (8 Pollutants)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
              <span>ICRP 66 Pulmonary Dosimetry</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>ARAI / CEA Verified Carbon Factors</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Location-Based Intelligence */}
      <section aria-labelledby="live-location-heading" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#111827] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 id="live-location-heading" className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Dynamic Hyperlocal Air Intelligence
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time CPCB telemetry, OpenAQ v3 observations, and Open-Meteo reanalysis conditioned dynamically on your live coordinates.
            </p>
          </div>
          <Link href="/dashboard">
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs">
              Detect My Location
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Link href="/dashboard?lat=28.6139&lon=77.2090&city=Delhi+NCR" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 hover:border-cyan-500 transition-all">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Northern Indo-Gangetic</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">Delhi NCR</div>
            <div className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-1">View Live Station →</div>
          </Link>
          <Link href="/dashboard?lat=19.0760&lon=72.8777&city=Mumbai" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 hover:border-cyan-500 transition-all">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Western Coastal</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">Mumbai</div>
            <div className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-1">View Live Station →</div>
          </Link>
          <Link href="/dashboard?lat=12.9716&lon=77.5946&city=Bengaluru" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 hover:border-cyan-500 transition-all">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Deccan Plateau</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">Bengaluru</div>
            <div className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-1">View Live Station →</div>
          </Link>
          <Link href="/dashboard?lat=22.5726&lon=88.3639&city=Kolkata" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 hover:border-cyan-500 transition-all">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Eastern Delta</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">Kolkata</div>
            <div className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-1">View Live Station →</div>
          </Link>
        </div>
      </section>

      {/* Prioritized Feature Architecture */}
      <section aria-labelledby="core-features-heading" className="space-y-4">
        <div>
          <h2 id="core-features-heading" className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Core Environmental Intelligence Architecture
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Engineered for Prompt War Challenge 6: high scientific rigor, zero hallucinations, and actionable community guidance.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 mb-2">
                <LayoutDashboard className="h-4.5 w-4.5" />
              </div>
              <CardTitle className="text-sm">1. AQI Command Center</CardTitle>
              <CardDescription>
                Statutory CPCB NAQI calculation with 16-hour data sufficiency rules and decoupled Hourly Indicative Sub-Index (HISI).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-1.5 p-0 text-cyan-700 font-semibold hover:bg-transparent hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                  <span>Launch Command Center</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 mb-2">
                <CalendarClock className="h-4.5 w-4.5" />
              </div>
              <CardTitle className="text-sm">2. Family & Low-Emission Routine</CardTitle>
              <CardDescription>
                Personalized routines tailored to children, seniors, and daily schedules with quantified direct impact and community actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/routine">
                <Button variant="ghost" size="sm" className="gap-1.5 p-0 text-cyan-700 font-semibold hover:bg-transparent hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                  <span>View Family Daily Routine</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 mb-2">
                <Home className="h-4.5 w-4.5" />
              </div>
              <CardTitle className="text-sm">3. Indoor Sanctuary & Practical Hacks</CardTitle>
              <CardDescription>
                Physical ODE room simulations coupled with 6 low-cost household hacks (wet mopping, cooking lids, DIY box fan filter, window sealing).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/indoor-sanctuary">
                <Button variant="ghost" size="sm" className="gap-1.5 p-0 text-cyan-700 font-semibold hover:bg-transparent hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                  <span>Explore Indoor Hacks & Simulator</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 mb-2">
                <Navigation className="h-4.5 w-4.5" />
              </div>
              <CardTitle className="text-sm">4. Action Impact Commute</CardTitle>
              <CardDescription>
                Real-world road geometry, spatial IDW pollution sampling, and ICRP 66 respiratory dosimetry across 8 transit alternatives.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/commute-optimizer">
                <Button variant="ghost" size="sm" className="gap-1.5 p-0 text-cyan-700 font-semibold hover:bg-transparent hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                  <span>Compare Modal Shift</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 mb-2">
                <BotMessageSquare className="h-4.5 w-4.5" />
              </div>
              <CardTitle className="text-sm">5. Grounded AI Assistant</CardTitle>
              <CardDescription>
                15-tool autonomous conversational copilot with strict anti-hallucination guardrails and real-time SSE tool execution streaming.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/assistant">
                <Button variant="ghost" size="sm" className="gap-1.5 p-0 text-cyan-700 font-semibold hover:bg-transparent hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300">
                  <span>Open Copilot Shell</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Feature 6 */}
          <Card className="border-dashed border-slate-300 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30">
            <CardHeader className="pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 mb-2">
                <Scale className="h-4.5 w-4.5" />
              </div>
              <CardTitle className="text-sm">Scientific Grounding</CardTitle>
              <CardDescription>
                Every equation traceable to peer-reviewed literature (ICRP 66, US EPA, CPCB 2014, ARAI 2021). No simulated black-box guesses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Dose = Inhaled × DF (0.28 ± 0.07)
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
