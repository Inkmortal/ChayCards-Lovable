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

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PluginManager } from '@/shared/plugin-system';
import { useNavigation } from '@/plugins/core-documents/hooks/useNavigation';
import { useFlashcards } from '../hooks/useFlashcards';
import { ArrowLeft, RotateCcw, Clock, TrendingUp } from 'lucide-react';
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
  const service = manager.getService('core-flashcards/flashcardService') as FlashcardService;

  const {
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

  // Load due cards and start session
  useEffect(() => {
    if (!deckId) return;

    const initSession = async () => {
      setLoading(true);

      try {
        // Get due cards
        const cards = await getDueCards(deckId);
        setDueCards(cards);

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
    };

    initSession();
  }, [deckId, mode, getDueCards, startStudySession]);

  // Handle card flip
  const handleShowAnswer = () => {
    setShowingBack(true);
  };

  // Handle grade
  const handleGrade = async (grade: 1 | 2 | 3 | 4) => {
    if (!currentCard || !session) return;

    const timeSpent = Date.now() - cardStartTime;

    try {
      // Grade the card (updates CardState via SM-2)
      await gradeCard(currentCard.id, grade, timeSpent);

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
      component: 'core-flashcards/DeckView',
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

  // No due cards
  if (sessionComplete && dueCards.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>All Caught Up! 🎉</CardTitle>
            <CardDescription>
              No cards due for review right now
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-lg text-muted-foreground">
                Great job! Come back later for more reviews.
              </p>
            </div>
            <Button onClick={handleExit} className="w-full">
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
                onClick={() => window.location.reload()}
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

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={handleExit}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Exit
        </Button>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {Math.round((Date.now() - cardStartTime) / 1000)}s
          </div>
          <div>{cardsCompleted + 1} / {totalCards}</div>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={progressPercent} className="h-2" />

      {/* Card display */}
      <Card className="min-h-[400px] flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center p-8">
          <CardRenderer
            card={currentCard}
            template={currentTemplate}
            side={showingBack ? 'back' : 'front'}
            onRevealCloze={handleRevealCloze}
            revealedClozes={revealedClozes}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Action buttons */}
      {!showingBack ? (
        <Button onClick={handleShowAnswer} size="lg" className="w-full">
          Show Answer
        </Button>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {/* Again */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleGrade(1)}
            className="flex-col h-auto py-4 border-2 hover:border-destructive hover:bg-destructive/10"
          >
            <span className="text-2xl font-bold">1</span>
            <span className="text-xs">{GRADE_LABELS[1]}</span>
          </Button>

          {/* Hard */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleGrade(2)}
            className="flex-col h-auto py-4 border-2 hover:border-orange-500 hover:bg-orange-500/10"
          >
            <span className="text-2xl font-bold">2</span>
            <span className="text-xs">{GRADE_LABELS[2]}</span>
          </Button>

          {/* Good */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleGrade(3)}
            className="flex-col h-auto py-4 border-2 hover:border-success hover:bg-success/10"
          >
            <span className="text-2xl font-bold">3</span>
            <span className="text-xs">{GRADE_LABELS[3]}</span>
          </Button>

          {/* Easy */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleGrade(4)}
            className="flex-col h-auto py-4 border-2 hover:border-primary hover:bg-primary/10"
          >
            <span className="text-2xl font-bold">4</span>
            <span className="text-xs">{GRADE_LABELS[4]}</span>
          </Button>
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      {showingBack && (
        <div className="text-center text-xs text-muted-foreground">
          Keyboard: 1 (Again) · 2 (Hard) · 3 (Good) · 4 (Easy)
        </div>
      )}
    </div>
  );
}
