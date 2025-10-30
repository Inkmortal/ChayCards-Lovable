/**
 * useActivityData Hook
 *
 * Fetches and aggregates study session data for activity visualization.
 * Returns sessions from last 365 days with aggregated stats.
 */

import { useState, useEffect } from 'react';
import type { StudySession } from '../types';
import type { FlashcardService } from '../services/FlashcardService';

interface ActivityStats {
  currentStreak: number;
  longestStreak: number;
  totalReviews: number;
  totalStudyTime: number;
  averageReviewsPerDay: number;
}

export function useActivityData(service: FlashcardService | null) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ActivityStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalReviews: 0,
    totalStudyTime: 0,
    averageReviewsPerDay: 0,
  });

  useEffect(() => {
    if (!service) return;

    const fetchActivityData = async () => {
      try {
        setLoading(true);

        console.log('[useActivityData] Fetching sessions...');

        // Get all sessions from last 365 days
        const now = Date.now();
        const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
        const allSessions = await service.getSessions();

        console.log('[useActivityData] Total sessions from storage:', allSessions.length);
        if (allSessions.length > 0) {
          console.log('[useActivityData] First session:', allSessions[0]);
          console.log('[useActivityData] Last session:', allSessions[allSessions.length - 1]);
        }

        const recentSessions = allSessions.filter(
          s => s.startTime >= oneYearAgo
        );

        console.log('[useActivityData] Recent sessions (last 365 days):', recentSessions.length);

        setSessions(recentSessions);

        // Calculate stats
        const newStats = calculateActivityStats(recentSessions);
        console.log('[useActivityData] Calculated stats:', newStats);
        setStats(newStats);
      } catch (error) {
        console.error('[useActivityData] Failed to fetch activity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [service]);

  return { sessions, stats, loading };
}

/**
 * Calculate activity statistics from sessions
 */
function calculateActivityStats(sessions: StudySession[]): ActivityStats {
  if (sessions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalReviews: 0,
      totalStudyTime: 0,
      averageReviewsPerDay: 0,
    };
  }

  // Sort sessions by date
  const sortedSessions = [...sessions].sort((a, b) => a.startTime - b.startTime);

  // Get unique study days
  const studyDays = new Set<string>();
  sortedSessions.forEach(session => {
    const date = new Date(session.startTime);
    date.setHours(0, 0, 0, 0);
    studyDays.add(date.toDateString());
  });

  const uniqueDays = Array.from(studyDays).sort();

  // Calculate current streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateKey = checkDate.toDateString();

    if (uniqueDays.includes(dateKey)) {
      currentStreak++;
    } else {
      // Allow 1-day gap for today (user might not have studied yet)
      if (i === 0) continue;
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const prevDate = new Date(uniqueDays[i - 1]);
    const currDate = new Date(uniqueDays[i]);
    const dayDiff = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (dayDiff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate total reviews and study time
  const totalReviews = sortedSessions.reduce(
    (sum, s) => sum + (s.totalCards || 0),
    0
  );

  const totalStudyTime = sortedSessions.reduce(
    (sum, s) => sum + (s.totalTime || 0),
    0
  );

  // Average reviews per day (only counting days with activity)
  const averageReviewsPerDay =
    uniqueDays.length > 0 ? Math.round(totalReviews / uniqueDays.length) : 0;

  return {
    currentStreak,
    longestStreak,
    totalReviews,
    totalStudyTime,
    averageReviewsPerDay,
  };
}
