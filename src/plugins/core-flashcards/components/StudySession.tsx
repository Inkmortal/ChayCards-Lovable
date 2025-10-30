/**
 * StudySession Component
 *
 * Complete spaced repetition study session with:
 * - Card rendering with front/back flip
 * - Grading buttons (Again/Hard/Good/Easy)
 * - Progress tracking
 * - Timer per card
 * - Session summary at end
 * - SM-2 algorithm integration
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { PluginManager } from '@/shared/plugin-system';
import { useNavigation } from '@/plugins/core-documents/hooks/useNavigation';
import { useFlashcards } from '../hooks/useFlashcards';
import { ArrowLeft, RotateCcw, Clock, TrendingUp, Flame, Zap, Target, Brain, Settings } from 'lucide-react';
import { StudyModeDropdown } from './StudyModeDropdown';
import { STUDY_MODE_CONFIGS } from '../constants';
import { Button } from '@/renderer/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/renderer/components/ui/card';
import { Progress } from '@/renderer/components/ui/progress';
import CardRenderer from './CardRenderer';
import type { Card as FlashCard, StudySession as SessionType, StudyMode } from '../types';
import type { FlashcardService } from '../services/FlashcardService';
import { GRADE_LABELS, GRADE_COLORS } from '../constants';

interface StudySessionProps {
  deckId?: string; // Provided when embedded
  mode?: StudyMode;
}

export default function StudySession({ deckId: propDeckId, mode: propMode }: StudySessionProps = {}) {
  const { deckId: urlDeckId } = useParams<{ deckId: string }>();
  const navigation = useNavigation();

  const deckId = propDeckId || urlDeckId;
  const mode: StudyMode = propMode || 'spaced-repetition';

  // Get service
  const manager = PluginManager.getInstance();
  const service = manager.getService('chaycards/core-flashcards/flashcardService') as FlashcardService;

  const {
    decks,
    templates,
    getDueCards,
    gradeCard,
    startStudySession,
    endStudySession,
  } = useFlashcards(service);

  // Session state
  const [session, setSession] = useState<SessionType | null>(null);
  const [dueCards, setDueCards] = useState<FlashCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showingBack, setShowingBack] = useState(false);
  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [revealedClozes, setRevealedClozes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Get current deck for stats
  const currentDeck = useMemo(
    () => decks.find(d => d.id === deckId),
    [decks, deckId]
  );

  // Current card
  const currentCard = dueCards[currentCardIndex];
  const currentTemplate = useMemo(
    () => currentCard ? templates.find(t => t.id === currentCard.templateId) : null,
    [currentCard, templates]
  );

  // Progress
  const cardsCompleted = currentCardIndex;
  const totalCards = dueCards.length;
  const progressPercent = totalCards > 0 ? (cardsCompleted / totalCards) * 100 : 0;

  // Initialize/restart session (shared logic for mount and Study Again)
  const initSession = useCallback(async () => {
    // Guard against missing dependencies
    if (!deckId || !startStudySession) {
      console.warn('[StudySession] Cannot initialize: missing dependencies', { deckId, startStudySession: !!startStudySession });
      return;
    }

    setLoading(true);

    try {
      // Get cards based on study mode
      const cards = await service.getCardsForMode(deckId, mode);
      setDueCards(cards);

      // Reset all session state
      setCurrentCardIndex(0);
      setShowingBack(false);
      setCardStartTime(Date.now());
      setRevealedClozes(new Set());
      setSessionComplete(false);

      if (cards.length === 0) {
        setSessionComplete(true);
        setLoading(false);
        return;
      }

      // Start session
      const newSession = await startStudySession(deckId, mode);
      setSession(newSession);
    } catch (error) {
      console.error('[StudySession] Failed to initialize:', error);
    } finally {
      setLoading(false);
    }
  }, [deckId, mode, service, startStudySession]);

  // Load due cards and start session on mount
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Handle card flip
  const handleShowAnswer = () => {
    setShowingBack(true);
  };

  // Handle card click to flip (bi-directional)
  const handleCardClick = () => {
    setShowingBack(prev => !prev);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Spacebar to flip card (bi-directional)
      if (e.code === 'Space') {
        e.preventDefault();
        setShowingBack(prev => !prev);
      }
      // Number keys for grading (only when showing back)
      if (showingBack) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') handleGrade(1);
        if (e.code === 'Digit2' || e.code === 'Numpad2') handleGrade(2);
        if (e.code === 'Digit3' || e.code === 'Numpad3') handleGrade(3);
        if (e.code === 'Digit4' || e.code === 'Numpad4') handleGrade(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showingBack, currentCard]);

  // Handle grade
  const handleGrade = async (grade: 1 | 2 | 3 | 4) => {
    if (!currentCard || !session) return;

    const timeSpent = Date.now() - cardStartTime;

    try {
      // Grade the card (updates CardState via SM-2, only for spaced-repetition mode)
      await service.gradeCard(currentCard.id, grade, timeSpent, mode);

      // Update session stats
      setSession(prev => {
        if (!prev) return prev;

        const updated = {
          ...prev,
          cardsReviewed: [
            ...prev.cardsReviewed,
            {
              cardId: currentCard.id,
              grade,
              timeSpent,
              previousInterval: currentCard.state.interval,
              newInterval: 0, // Will be calculated by service
              previousEase: currentCard.state.easeFactor,
              newEase: 0, // Will be calculated by service
              timestamp: Date.now(),
            },
          ],
          totalCards: prev.totalCards + 1,
          correctCards: prev.correctCards + (grade >= 3 ? 1 : 0),
          againCount: prev.againCount + (grade === 1 ? 1 : 0),
          hardCount: prev.hardCount + (grade === 2 ? 1 : 0),
          goodCount: prev.goodCount + (grade === 3 ? 1 : 0),
          easyCount: prev.easyCount + (grade === 4 ? 1 : 0),
        };

        return updated;
      });

      // Move to next card
      if (currentCardIndex + 1 < totalCards) {
        setCurrentCardIndex(prev => prev + 1);
        setShowingBack(false);
        setCardStartTime(Date.now());
        setRevealedClozes(new Set());
      } else {
        // Session complete
        await handleEndSession();
      }
    } catch (error) {
      console.error('[StudySession] Failed to grade card:', error);
    }
  };

  // Handle cloze reveal
  const handleRevealCloze = (clozeIndex: number) => {
    setRevealedClozes(prev => new Set(prev).add(clozeIndex));
  };

  // Handle session end
  const handleEndSession = async () => {
    if (!session) return;

    try {
      await endStudySession(session);
      setSessionComplete(true);
    } catch (error) {
      console.error('[StudySession] Failed to end session:', error);
    }
  };

  // Handle exit
  const handleExit = () => {
    navigation.push({
      type: 'component',
      component: 'chaycards/core-flashcards/DeckView',
      props: { deckId }
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg font-medium">Loading cards...</div>
            <div className="text-sm text-muted-foreground mt-2">Preparing your study session</div>
          </div>
        </div>
      </div>
    );
  }

  // No due cards - suggest alternative study modes
  if (sessionComplete && dueCards.length === 0) {
    const handleModeSelect = async (newMode: StudyMode) => {
      // Update mode and restart session
      navigation.push({
        type: 'component',
        component: 'chaycards/core-flashcards/StudySession',
        props: { deckId, mode: newMode }
      });
    };

    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'spaced-repetition' ? 'All Caught Up! 🎉' : 'No Cards Available'}
            </CardTitle>
            <CardDescription>
              {mode === 'spaced-repetition'
                ? 'No cards due for spaced repetition right now'
                : `No cards available for ${mode} mode`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">
                {mode === 'spaced-repetition' ? '✅' : '📚'}
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                {mode === 'spaced-repetition'
                  ? 'Great job! Want to study more?'
                  : 'Try a different study mode:'
                }
              </p>

              {/* Alternative study mode suggestions */}
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {mode !== 'cram' && (
                  <Button
                    variant="outline"
                    onClick={() => handleModeSelect('cram')}
                    className="h-auto py-4 flex-col gap-2"
                  >
                    <span className="text-2xl">⚡</span>
                    <span className="font-semibold">Cram All Cards</span>
                    <span className="text-xs text-muted-foreground">Review everything</span>
                  </Button>
                )}
                {mode !== 'cram-seen' && (
                  <Button
                    variant="outline"
                    onClick={() => handleModeSelect('cram-seen')}
                    className="h-auto py-4 flex-col gap-2"
                  >
                    <span className="text-2xl">🔄</span>
                    <span className="font-semibold">Cram Seen Cards</span>
                    <span className="text-xs text-muted-foreground">Review studied cards</span>
                  </Button>
                )}
                {mode !== 'shuffle' && (
                  <Button
                    variant="outline"
                    onClick={() => handleModeSelect('shuffle')}
                    className="h-auto py-4 flex-col gap-2"
                  >
                    <span className="text-2xl">🔀</span>
                    <span className="font-semibold">Shuffle Mode</span>
                    <span className="text-xs text-muted-foreground">Random order</span>
                  </Button>
                )}
                {mode === 'spaced-repetition' && (
                  <Button
                    variant="outline"
                    onClick={() => handleModeSelect('spaced-repetition')}
                    className="h-auto py-4 flex-col gap-2"
                  >
                    <span className="text-2xl">🧠</span>
                    <span className="font-semibold">Spaced Repetition</span>
                    <span className="text-xs text-muted-foreground">Optimal learning</span>
                  </Button>
                )}
              </div>
            </div>

            <Button onClick={handleExit} variant="ghost" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Deck
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session complete
  if (sessionComplete && session) {
    const retention = session.totalCards > 0
      ? ((session.goodCount + session.easyCount) / session.totalCards * 100).toFixed(1)
      : '0';

    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Complete! 🎊</CardTitle>
            <CardDescription>
              Great work on completing your review session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{session.totalCards}</div>
                <div className="text-sm text-muted-foreground">Cards Reviewed</div>
              </div>
              <div className="bg-success/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-success">{retention}%</div>
                <div className="text-sm text-muted-foreground">Retention</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">{session.goodCount + session.easyCount}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold">
                  {Math.round((session.totalTime || 0) / 60000)}m
                </div>
                <div className="text-sm text-muted-foreground">Time</div>
              </div>
            </div>

            {/* Grade Breakdown */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Grade Breakdown:</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Again</span>
                  <span className="text-sm font-medium">{session.againCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hard</span>
                  <span className="text-sm font-medium">{session.hardCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Good</span>
                  <span className="text-sm font-medium">{session.goodCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Easy</span>
                  <span className="text-sm font-medium">{session.easyCount}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleExit} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Deck
              </Button>
              <Button
                variant="outline"
                onClick={initSession}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Study Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active study session
  if (!currentCard || !currentTemplate) {
    return <div>Error: Card not found</div>;
  }

  // Calculate session stats for display
  const sessionAccuracy = session
    ? session.totalCards > 0
      ? Math.round(((session.goodCount + session.easyCount) / session.totalCards) * 100)
      : 0
    : 0;

  const handleMidSessionModeChange = (newMode: StudyMode) => {
    // Navigate to new study session with different mode
    navigation.push({
      type: 'component',
      component: 'chaycards/core-flashcards/StudySession',
      props: { deckId, mode: newMode }
    });
  };

  const currentModeConfig = STUDY_MODE_CONFIGS[mode] || STUDY_MODE_CONFIGS['spaced-repetition'];

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-4">
      {/* Gamified Header with Stats */}
      <div className="flex items-center justify-between gap-4">
        {/* Left side: Exit button + Mode indicator */}
        <div className="flex items-center gap-2">
          <Button
            variant="3d"
            size="sm"
            onClick={handleExit}
            className="bg-gradient-to-r from-tertiary to-accent hover:from-tertiary/90 hover:to-accent/90 text-white border-0 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Complete
          </Button>

          {/* Mode switcher dropdown */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
            <span className="text-lg">{currentModeConfig.icon}</span>
            <span className="text-sm font-medium">{currentModeConfig.name}</span>
            <StudyModeDropdown
              deckId={deckId!}
              onSelectMode={handleMidSessionModeChange}
              variant="ghost"
              size="sm"
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          {/* Fire Streak */}
          {currentDeck && currentDeck.stats.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent/10 to-tertiary/10 border border-accent/20">
              <Flame className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-sm font-bold text-accent">{currentDeck.stats.currentStreak}</span>
              <span className="text-xs text-muted-foreground">day streak</span>
            </div>
          )}

          {/* Accuracy */}
          {session && session.totalCards > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
              <Target className="w-4 h-4 text-success" />
              <span className="text-sm font-bold text-success">{sessionAccuracy}%</span>
            </div>
          )}

          {/* New Cards */}
          {currentDeck && currentDeck.stats.newCards > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-info/10 border border-info/20">
              <Zap className="w-4 h-4 text-info" />
              <span className="text-sm font-bold text-info">{currentDeck.stats.newCards}</span>
              <span className="text-xs text-muted-foreground">new</span>
            </div>
          )}

          {/* Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-sm font-bold text-warning">{Math.round((Date.now() - cardStartTime) / 1000)}s</span>
          </div>

          {/* Progress Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">{cardsCompleted + 1}</span>
            <span className="text-xs text-muted-foreground">/ {totalCards}</span>
          </div>
        </div>
      </div>

      {/* Colorful Progress bar */}
      <div className="relative">
        <Progress
          value={progressPercent}
          className="h-3"
          style={{
            background: 'linear-gradient(to right, hsl(var(--muted)) 0%, hsl(var(--muted)) 100%)'
          }}
        />
        <div
          className="absolute top-0 left-0 h-3 rounded-full transition-all duration-300"
          style={{
            width: `${progressPercent}%`,
            background: 'linear-gradient(to right, hsl(var(--accent)), hsl(var(--primary)), hsl(var(--success)))'
          }}
        />
      </div>

      {/* Flip hint */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {!showingBack ? (
            <span className="animate-pulse">
              Click card or press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Space</kbd> to reveal answer
            </span>
          ) : (
            <span>
              Click again or press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Space</kbd> to flip back
            </span>
          )}
        </p>
      </div>

      {/* Card display with 3D flip animation */}
      <div className="perspective-1000 min-h-[450px] cursor-pointer" onClick={handleCardClick}>
        <div
          className={`flip-card-inner relative w-full h-full transition-transform duration-600 ${
            showingBack ? 'rotate-y-180' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front side */}
          <Card
            className="flip-card-face absolute inset-0 min-h-[450px] flex flex-col backface-hidden border-2 border-border shadow-xl hover:shadow-2xl transition-shadow"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="flex-1 flex items-center justify-center p-8">
              <CardRenderer
                card={currentCard}
                template={currentTemplate}
                side="front"
                onRevealCloze={handleRevealCloze}
                revealedClozes={revealedClozes}
                className="w-full text-2xl"
              />
            </CardContent>
          </Card>

          {/* Back side */}
          <Card
            className="flip-card-face absolute inset-0 min-h-[450px] flex flex-col backface-hidden border-2 border-primary/50 shadow-xl bg-gradient-to-br from-background to-primary/5"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <CardContent className="flex-1 flex items-center justify-center p-8">
              <CardRenderer
                card={currentCard}
                template={currentTemplate}
                side="back"
                onRevealCloze={handleRevealCloze}
                revealedClozes={revealedClozes}
                className="w-full text-2xl"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rating buttons - Always visible */}
      <div className="grid grid-cols-4 gap-3">
        {/* Again */}
        <Button
          variant="outline"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            handleGrade(1);
          }}
          disabled={!showingBack}
          className="flex-col h-auto py-5 border-2 border-destructive/20 hover:border-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <span className="text-3xl font-bold text-destructive mb-1">1</span>
          <span className="text-xs font-semibold uppercase">{GRADE_LABELS[1]}</span>
        </Button>

        {/* Hard */}
        <Button
          variant="outline"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            handleGrade(2);
          }}
          disabled={!showingBack}
          className="flex-col h-auto py-5 border-2 border-warning/20 hover:border-warning hover:bg-warning/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <span className="text-3xl font-bold text-warning mb-1">2</span>
          <span className="text-xs font-semibold uppercase">{GRADE_LABELS[2]}</span>
        </Button>

        {/* Good */}
        <Button
          variant="outline"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            handleGrade(3);
          }}
          disabled={!showingBack}
          className="flex-col h-auto py-5 border-2 border-success/20 hover:border-success hover:bg-success/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <span className="text-3xl font-bold text-success mb-1">3</span>
          <span className="text-xs font-semibold uppercase">{GRADE_LABELS[3]}</span>
        </Button>

        {/* Easy */}
        <Button
          variant="outline"
          size="lg"
          onClick={(e) => {
            e.stopPropagation();
            handleGrade(4);
          }}
          disabled={!showingBack}
          className="flex-col h-auto py-5 border-2 border-primary/20 hover:border-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <span className="text-3xl font-bold text-primary mb-1">4</span>
          <span className="text-xs font-semibold uppercase">{GRADE_LABELS[4]}</span>
        </Button>
      </div>

      {/* Colorful Keyboard shortcuts hint */}
      <div className="text-center text-sm">
        {!showingBack ? (
          <span className="text-muted-foreground">
            Press <kbd className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-mono border border-primary/20">Space</kbd> to flip
          </span>
        ) : (
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <kbd className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-mono border border-destructive/20">1</kbd>
            <span className="text-destructive text-xs">Again</span>
            <span className="text-muted-foreground">·</span>
            <kbd className="px-2 py-1 bg-warning/10 text-warning rounded text-xs font-mono border border-warning/20">2</kbd>
            <span className="text-warning text-xs">Hard</span>
            <span className="text-muted-foreground">·</span>
            <kbd className="px-2 py-1 bg-success/10 text-success rounded text-xs font-mono border border-success/20">3</kbd>
            <span className="text-success text-xs">Good</span>
            <span className="text-muted-foreground">·</span>
            <kbd className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-mono border border-primary/20">4</kbd>
            <span className="text-primary text-xs">Easy</span>
          </div>
        )}
      </div>

      {/* Custom CSS for flip animation */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }

        .rotate-y-180 {
          transform: rotateY(180deg);
        }

        .duration-600 {
          transition-duration: 0.6s;
        }

        .backface-hidden {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
