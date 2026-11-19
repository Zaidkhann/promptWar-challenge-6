"use client";

import React from "react";
import {
  SlidersHorizontal,
  Clock,
  MapPin,
  Car,
  Activity,
  HeartPulse,
  RotateCcw,
  Check,
} from "lucide-react";
import { UserPreferences, DEFAULT_USER_PREFERENCES, FamilyMember } from "@/lib/recommendations/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RoutinePreferencesFormProps {
  preferences: UserPreferences;
  onUpdatePreferences: (newPreferences: UserPreferences) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function RoutinePreferencesForm({
  preferences,
  onUpdatePreferences,
  isOpen,
  onToggle,
}: RoutinePreferencesFormProps) {
  const [formData, setFormData] = React.useState<UserPreferences>(preferences);

  // Sync internal form when external props change
  React.useEffect(() => {
    setFormData(preferences);
  }, [preferences]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePreferences(formData);
  };

  const handleReset = () => {
    setFormData(DEFAULT_USER_PREFERENCES);
    onUpdatePreferences(DEFAULT_USER_PREFERENCES);
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 dark:bg-[#111827] shadow-2xs">
      <CardHeader className="cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-400">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Personalize Daily Routine Preferences
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Tailor recommendations to your daily schedule, transit mode, and sensitivity.
              </CardDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            aria-expanded={isOpen}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isOpen ? "Hide Settings" : "Customize Routine"}
          </Button>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 border-t border-slate-100 dark:border-slate-800 mt-2">
          <form onSubmit={handleApply} className="space-y-6 pt-4 text-xs">
            {/* Preferred Activity Time */}
            <div className="space-y-2">
              <label id="pref-time-label" className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-400" aria-hidden="true" />
                <span>Preferred Activity Time of Day:</span>
              </label>
              <div role="radiogroup" aria-labelledby="pref-time-label" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "morning", label: "Morning (06:00 – 10:00)" },
                  { id: "midday", label: "Midday (11:00 – 16:00)" },
                  { id: "evening", label: "Evening (17:00 – 21:00)" },
                  { id: "night", label: "Night (21:00 – 06:00)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={formData.preferredTime === item.id}
                    onClick={() => setFormData({ ...formData, preferredTime: item.id as UserPreferences["preferredTime"] })}
                    className={`rounded-lg border p-2.5 text-left transition-all text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                      formData.preferredTime === item.id
                        ? "border-cyan-600 bg-cyan-50/80 text-cyan-950 dark:border-cyan-500 dark:bg-cyan-950/50 dark:text-cyan-200 font-bold shadow-2xs ring-1 ring-cyan-600 dark:ring-cyan-500"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#1E293B]/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-[#1E293B]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Preference */}
            <div className="space-y-2">
              <label id="pref-env-label" className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-400" aria-hidden="true" />
                <span>Indoor vs. Outdoor Environment Preference:</span>
              </label>
              <div role="radiogroup" aria-labelledby="pref-env-label" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: "balanced", label: "Balanced (Indoor & Outdoor Mix)" },
                  { id: "outdoor_preferred", label: "Outdoor Enthusiast (Running/Parks)" },
                  { id: "indoor_preferred", label: "Indoor Focused (Home/Gym/Office)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={formData.locationType === item.id}
                    onClick={() => setFormData({ ...formData, locationType: item.id as UserPreferences["locationType"] })}
                    className={`rounded-lg border p-2.5 text-left transition-all text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                      formData.locationType === item.id
                        ? "border-cyan-600 bg-cyan-50/80 text-cyan-950 dark:border-cyan-500 dark:bg-cyan-950/50 dark:text-cyan-200 font-bold shadow-2xs ring-1 ring-cyan-600 dark:ring-cyan-500"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#1E293B]/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-[#1E293B]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Commute Modality */}
            <div className="space-y-2">
              <label id="pref-commute-label" className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-400" aria-hidden="true" />
                <span>Typical Commute Modality:</span>
              </label>
              <div role="radiogroup" aria-labelledby="pref-commute-label" className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: "public_transit", label: "Metro / Train / Bus" },
                  { id: "walking", label: "Walking Commute" },
                  { id: "cycling", label: "Bicycle / Cycling" },
                  { id: "two_wheeler", label: "Scooter / Motorcycle" },
                  { id: "car_cab", label: "Car / Taxi / Auto" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={formData.commuteMode === item.id}
                    onClick={() => setFormData({ ...formData, commuteMode: item.id as UserPreferences["commuteMode"] })}
                    className={`rounded-lg border p-2.5 text-left transition-all text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                      formData.commuteMode === item.id
                        ? "border-cyan-600 bg-cyan-50/80 text-cyan-950 dark:border-cyan-500 dark:bg-cyan-950/50 dark:text-cyan-200 font-bold shadow-2xs ring-1 ring-cyan-600 dark:ring-cyan-500"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#1E293B]/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-[#1E293B]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* General Activity Categories */}
            <div className="space-y-2">
              <label id="pref-activity-label" className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-400" aria-hidden="true" />
                <span>Primary Daily Activity Focus:</span>
              </label>
              <div role="radiogroup" aria-labelledby="pref-activity-label" className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: "walking", label: "Daily Stroll & Steps" },
                  { id: "studying_deskwork", label: "Study & Desk Work" },
                  { id: "outdoor_exercise", label: "Cardio & Workouts" },
                  { id: "commuting", label: "Urban Transit" },
                  { id: "general_errands", label: "Errands & Shopping" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={formData.activityType === item.id}
                    onClick={() => setFormData({ ...formData, activityType: item.id as UserPreferences["activityType"] })}
                    className={`rounded-lg border p-2.5 text-left transition-all text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                      formData.activityType === item.id
                        ? "border-cyan-600 bg-cyan-50/80 text-cyan-950 dark:border-cyan-500 dark:bg-cyan-950/50 dark:text-cyan-200 font-bold shadow-2xs ring-1 ring-cyan-600 dark:ring-cyan-500"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#1E293B]/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-[#1E293B]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sensitivity / Household Setting */}
            <div className="space-y-2">
              <label id="pref-sensitivity-label" className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <HeartPulse className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-400" aria-hidden="true" />
                <span>Vulnerability & Sensitivity Profile:</span>
              </label>
              <div role="radiogroup" aria-labelledby="pref-sensitivity-label" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: "standard",
                    title: "Standard Adult",
                    desc: "Standard statutory threshold guidelines.",
                  },
                  {
                    id: "respiratory_sensitivity",
                    title: "Respiratory Sensitivity",
                    desc: "Higher precaution at moderate thresholds.",
                  },
                  {
                    id: "vulnerable_household",
                    title: "Household with Children / Seniors",
                    desc: "Strict pediatric & geriatric avoidance protocols.",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={formData.sensitivity === item.id}
                    onClick={() => setFormData({ ...formData, sensitivity: item.id as UserPreferences["sensitivity"] })}
                    className={`rounded-lg border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                      formData.sensitivity === item.id
                        ? "border-cyan-600 bg-cyan-50/80 text-cyan-950 dark:border-cyan-500 dark:bg-cyan-950/50 dark:text-cyan-200 font-bold shadow-2xs ring-1 ring-cyan-600 dark:ring-cyan-500"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#1E293B]/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-[#1E293B]"
                    }`}
                  >
                    <div className="font-bold text-xs">{item.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                * No medical diagnoses required. Used strictly to apply conservative exposure thresholds.
              </p>
            </div>

            {/* Family & Household Members Selection */}
            <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3.5">
              <label id="pref-family-label" className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Family Members in Household:</span>
                <span className="text-[10px] text-slate-500 font-normal">Select all who reside together</span>
              </label>
              <div role="group" aria-labelledby="pref-family-label" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "school_children", label: "School Children (5-17y)" },
                  { id: "infants_under_5", label: "Infants & Toddlers (<5y)" },
                  { id: "elderly_seniors", label: "Senior Citizens (60+y)" },
                  { id: "pregnant_women", label: "Pregnant Household Member" },
                ].map((member) => {
                  const currentMembers = formData.household?.familyMembers || ["healthy_adults"];
                  const isSelected = currentMembers.includes(member.id as FamilyMember);

                  return (
                    <button
                      key={member.id}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => {
                        const updated = isSelected
                          ? currentMembers.filter((m) => m !== member.id)
                          : [...currentMembers, member.id as FamilyMember];
                        setFormData({
                          ...formData,
                          household: {
                            ...(formData.household || {
                              homeType: "sealed_apartment",
                              hasAirPurifier: false,
                              hasKitchenExhaust: true,
                              cookingFuel: "lpg_gas",
                              neighborhoodType: "residential_suburb",
                            }),
                            familyMembers: updated.length > 0 ? updated : ["healthy_adults"],
                          },
                        });
                      }}
                      className={`rounded-lg border p-2 text-left text-xs transition-all font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                        isSelected
                          ? "border-cyan-600 bg-cyan-100/70 text-cyan-950 dark:border-cyan-500 dark:bg-cyan-950/70 dark:text-cyan-200 font-bold"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{member.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset to Defaults
              </Button>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onToggle}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white font-medium">
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Save & Synthesize Routine
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
