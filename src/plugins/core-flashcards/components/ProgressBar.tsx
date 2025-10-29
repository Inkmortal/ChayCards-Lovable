/**
 * ProgressBar Component
 *
 * 10-segment progress bar with color-coding by mastery level:
 * - Red: 0-25% mastered
 * - Yellow: 26-75% mastered
 * - Green: 76-100% mastered
 *
 * Used in Rich deck view mode to show visual progress.
 */

import React from 'react';

interface ProgressBarProps {
  /** Number of cards mastered (ease >= 2.5) */
  mastered: number;
  /** Total number of cards */
  total: number;
  /** Optional className for styling */
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ mastered, total, className = '' }) => {
  // Calculate mastery percentage
  const masteryPercent = total > 0 ? (mastered / total) * 100 : 0;

  // Determine gradient and glow based on mastery %
  const getColorClasses = (): { bg: string; glow: string } => {
    if (masteryPercent >= 76) {
      return {
        bg: 'bg-gradient-to-r from-green-400 to-emerald-500',
        glow: 'shadow-sm shadow-green-400/50'
      };
    }
    if (masteryPercent >= 26) {
      return {
        bg: 'bg-gradient-to-r from-yellow-400 to-orange-500',
        glow: 'shadow-sm shadow-yellow-400/50'
      };
    }
    return {
      bg: 'bg-gradient-to-r from-red-400 to-pink-500',
      glow: 'shadow-sm shadow-red-400/50'
    };
  };

  // Calculate how many segments should be filled
  const filledSegments = Math.round((masteryPercent / 100) * 10);

  const { bg, glow } = getColorClasses();

  return (
    <div className={`flex gap-1 ${className}`} role="progressbar" aria-valuenow={masteryPercent} aria-valuemin={0} aria-valuemax={100}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition-all duration-300 ${
            i < filledSegments
              ? `${bg} ${glow} animate-in fade-in slide-in-from-left-1 duration-500`
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
};
