/**
 * DeckRow Component
 *
 * List view row for a flashcard deck with two display modes:
 * - Simple: Compact single-line view (icon, name, stats)
 * - Rich: Expanded view with progress bar, description, and detailed stats
 *
 * Supports context menu, hover actions, and active deck starring.
 */

import React from 'react';
import { Clipboard, Star, MoreVertical, Play } from 'lucide-react';
import { Deck, StudyMode } from '../types';
import { ProgressBar } from './ProgressBar';
import { Button } from '@/renderer/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { StudyModeDropdown } from './StudyModeDropdown';

export type ViewMode = 'simple' | 'rich';

interface DeckRowProps {
  /** Deck data */
  deck: Deck;
  /** Display mode */
  viewMode: ViewMode;
  /** Callback when deck is clicked */
  onOpen: (deckId: string) => void;
  /** Callback when study button is clicked */
  onStudy: (deckId: string, mode?: StudyMode) => void;
  /** Callback when active status is toggled */
  onToggleActive: (deckId: string) => void;
  /** Callback when context menu is opened */
  onContextMenu?: (deckId: string, event: React.MouseEvent) => void;
  /** Optional className */
  className?: string;
}

export const DeckRow: React.FC<DeckRowProps> = ({
  deck,
  viewMode,
  onOpen,
  onStudy,
  onToggleActive,
  onContextMenu,
  className = ''
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const { stats } = deck;
  const hasDueCards = stats.dueToday > 0;

  // Format last studied text
  const lastStudiedText = stats.lastStudiedAt
    ? `Studied ${formatDistanceToNow(stats.lastStudiedAt, { addSuffix: true })}`
    : 'Never studied';

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(deck.id, e);
  };

  const handleStudyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStudy(deck.id, 'spaced-repetition');
  };

  const handleModeSelect = (mode: StudyMode) => {
    onStudy(deck.id, mode);
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleActive(deck.id);
  };

  if (viewMode === 'simple') {
    return (
      <div
        className={`group flex items-center gap-3 px-6 py-6 hover:bg-muted/30 cursor-pointer transition-colors border-b border-border ${className}`}
        onClick={() => onOpen(deck.id)}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Actions LEFT of name - Icon buttons only */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Study button - Split button with dropdown */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-primary/10 rounded-r-none"
              onClick={handleStudyClick}
              title="Study now (Spaced Repetition)"
            >
              <Play className="w-5 h-5 fill-primary text-primary" />
            </Button>
            <StudyModeDropdown
              deckId={deck.id}
              onSelectMode={handleModeSelect}
              variant="ghost"
              size="sm"
            />
          </div>

          {/* Star button */}
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${deck.isActive ? 'hover:bg-accent/10' : 'hover:bg-muted'}`}
            onClick={handleStarClick}
            title={deck.isActive ? 'Remove from Focus' : 'Add to Focus'}
          >
            <Star className={`w-5 h-5 ${deck.isActive ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
          </Button>
        </div>

        {/* Name & Stats */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-lg font-bold text-foreground truncate leading-none">
            {deck.name}
          </span>

          {/* Stats badges */}
          {hasDueCards && (
            <span className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0 leading-none">
              {stats.dueToday}
            </span>
          )}

          {/* SR Stats badges using theme variables */}
          {stats.newCards > 0 && (
            <span className="px-2 py-1 rounded-md bg-info/10 text-info text-sm font-semibold flex-shrink-0 leading-none">
              {stats.newCards} new
            </span>
          )}
          {stats.masteredCards > 0 && (
            <span className="px-2 py-1 rounded-md bg-success/10 text-success text-sm font-semibold flex-shrink-0 leading-none">
              {stats.masteredCards} mastered
            </span>
          )}
          {stats.learningCards > 0 && (
            <span className="px-2 py-1 rounded-md bg-warning/10 text-warning text-sm font-semibold flex-shrink-0 leading-none">
              {stats.learningCards} learning
            </span>
          )}

          <span className="text-base text-muted-foreground flex-shrink-0 leading-none">{stats.totalCards} cards</span>
        </div>

        {/* Context menu - Far right */}
        <div className="flex items-center flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
            onClick={handleContextMenu}
            title="More options"
          >
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    );
  }

  // Rich mode
  return (
    <div
      className={`group flex gap-3 px-6 py-6 hover:bg-muted/30 cursor-pointer transition-colors border-b border-border ${className}`}
      onClick={() => onOpen(deck.id)}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Actions LEFT of content - Icon buttons only */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        {/* Study button - Split button with dropdown */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-primary/10 rounded-r-none"
            onClick={handleStudyClick}
            title="Study now (Spaced Repetition)"
          >
            <Play className="w-5 h-5 fill-primary text-primary" />
          </Button>
          <StudyModeDropdown
            deckId={deck.id}
            onSelectMode={handleModeSelect}
            variant="ghost"
            size="sm"
          />
        </div>

        {/* Star button */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${deck.isActive ? 'hover:bg-accent/10' : 'hover:bg-muted'}`}
          onClick={handleStarClick}
          title={deck.isActive ? 'Remove from Focus' : 'Add to Focus'}
        >
          <Star className={`w-5 h-5 ${deck.isActive ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name with active indicator */}
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-foreground truncate leading-none">
            {deck.name}
          </h3>
          {deck.isActive && (
            <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs font-semibold flex-shrink-0 leading-none">
              In Focus
            </span>
          )}
        </div>

        {deck.description && (
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1.5">
            {deck.description}
          </p>
        )}

        {/* Progress bar */}
        <ProgressBar
          mastered={stats.masteredCards}
          total={stats.totalCards}
          className="mt-3"
        />

        {/* Stats row with theme variable badges */}
        <div className="flex items-center gap-2 mt-3 flex-wrap text-sm">
          {hasDueCards && (
            <span className="px-2 py-1 rounded-md bg-primary text-primary-foreground font-semibold leading-none">
              {stats.dueToday} due
            </span>
          )}
          {stats.newCards > 0 && (
            <span className="px-2 py-1 rounded-md bg-info/10 text-info font-semibold leading-none">
              {stats.newCards} new
            </span>
          )}
          {stats.learningCards > 0 && (
            <span className="px-2 py-1 rounded-md bg-warning/10 text-warning font-semibold leading-none">
              {stats.learningCards} learning
            </span>
          )}
          {stats.reviewCards > 0 && (
            <span className="px-2 py-1 rounded-md bg-success/10 text-success font-semibold leading-none">
              {stats.reviewCards} review
            </span>
          )}
          <span className="text-muted-foreground ml-auto leading-none">
            {lastStudiedText}
          </span>
        </div>
      </div>

      {/* Context menu - Far right */}
      <div className="flex items-start flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
          onClick={handleContextMenu}
          title="More options"
        >
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
};
