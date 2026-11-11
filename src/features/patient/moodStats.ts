import { recentDays } from "../../lib/date";
import type { MoodLog } from "../../types";

const average = (moods: MoodLog, days: string[]) => {
  const values = days.flatMap((day) => moods[day] ?? []);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
};

/** This week (last 7 days) against the week before: days logged and % change in the average mood. */
export function weeklyMoodStats(moods: MoodLog) {
  const week = recentDays(7);
  const previousWeek = recentDays(7, -7);
  const thisWeek = average(moods, week);
  const lastWeek = average(moods, previousWeek);
  return {
    week,
    previousWeek,
    logged: week.filter((day) => moods[day] !== undefined).length,
    /** Percent change, or null when either week has no entries. */
    change: thisWeek !== null && lastWeek ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null,
  };
}
