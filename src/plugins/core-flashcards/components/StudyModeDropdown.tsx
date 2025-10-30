import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import { Button } from '@/renderer/components/ui/button';
import { ChevronDown, Loader2 } from 'lucide-react';
import { StudyMode } from '../types';
import { STUDY_MODE_CONFIGS } from '../constants';
import { PluginManager } from '@/shared/plugin-system';

interface StudyModeDropdownProps {
  deckId: string;
  onSelectMode: (mode: StudyMode) => void;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
}

interface ModeCardCount {
  mode: StudyMode;
  count: number;
  disabled: boolean;
}

/**
 * Dropdown menu for selecting study modes with live card counts
 */
export const StudyModeDropdown = ({
  deckId,
  onSelectMode,
  variant = 'ghost',
  size = 'sm',
  disabled = false,
}: StudyModeDropdownProps) => {
  const [modeCounts, setModeCounts] = useState<ModeCardCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModeCounts();
  }, [deckId]);

  const loadModeCounts = async () => {
    setLoading(true);
    try {
      const manager = PluginManager.getInstance();
      const flashcardService = manager.getService<any>('chaycards/core-flashcards/flashcardService');

      // Get counts for each mode
      const counts: ModeCardCount[] = await Promise.all(
        ['spaced-repetition', 'cram', 'cram-seen', 'shuffle'].map(async (mode) => {
          const cards = await flashcardService.getCardsForMode(deckId, mode as StudyMode);
          return {
            mode: mode as StudyMode,
            count: cards.length,
            disabled: cards.length === 0,
          };
        })
      );

      setModeCounts(counts);
    } catch (error) {
      console.error('Failed to load mode counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelect = (mode: StudyMode) => {
    onSelectMode(mode);
  };

  // Primary modes (shown first)
  const primaryModes: StudyMode[] = ['spaced-repetition', 'cram', 'cram-seen', 'shuffle'];

  // Game modes (shown after separator)
  const gameModes: StudyMode[] = ['match', 'type-race', 'memory-grid', 'write'];

  const getModeCount = (mode: StudyMode): ModeCardCount | undefined => {
    return modeCounts.find(m => m.mode === mode);
  };

  const renderModeItem = (mode: StudyMode, showCount: boolean = true) => {
    const config = STUDY_MODE_CONFIGS[mode];
    const modeCount = getModeCount(mode);
    const isDisabled = modeCount?.disabled ?? false;

    return (
      <DropdownMenuItem
        key={mode}
        onClick={() => !isDisabled && handleModeSelect(mode)}
        disabled={isDisabled}
        className="cursor-pointer"
      >
        <span className="mr-2">{config.icon}</span>
        <span className="flex-1">{config.name}</span>
        {showCount && modeCount && (
          <span className="ml-2 text-xs text-muted-foreground">
            ({modeCount.count})
          </span>
        )}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || loading}
          className="h-8 w-8 p-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Primary study modes */}
        {primaryModes.map(mode => renderModeItem(mode, true))}

        <DropdownMenuSeparator />

        {/* Game modes (no card counts) */}
        {gameModes.map(mode => renderModeItem(mode, false))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
