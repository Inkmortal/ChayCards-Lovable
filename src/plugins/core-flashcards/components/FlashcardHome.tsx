/**
 * FlashcardHome Component
 *
 * Main dashboard for flashcards plugin showing:
 * - All decks with statistics
 * - "Today's Focus" widget for active decks
 * - Quick actions (create deck, import, export)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PluginManager } from '@/shared/plugin-system';
import { useFlashcards } from '../hooks/useFlashcards';
import {
  Plus,
  BookMarked,
  Upload,
  Download,
  Settings,
  Play,
  Calendar,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/renderer/components/ui/card';
import { Badge } from '@/renderer/components/ui/badge';
import { Input } from '@/renderer/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import type { Deck } from '../types';
import type { FlashcardService } from '../services/FlashcardService';

export default function FlashcardHome() {
  const navigate = useNavigate();

  // Get service from PluginManager
  const manager = PluginManager.getInstance();
  const service = manager.getService('core-flashcards/flashcardService') as FlashcardService;

  const {
    decks,
    loading,
    error,
    createDeck,
    deleteDeck,
    getDueCards,
  } = useFlashcards(service);

  const [searchQuery, setSearchQuery] = useState('');
  const [dueCardsCount, setDueCardsCount] = useState<Record<string, number>>({});

  // Early return if service not available
  if (!service) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">Flashcard service not available</div>
      </div>
    );
  }

  // Calculate due cards for each deck
  useEffect(() => {
    const loadDueCounts = async () => {
      const counts: Record<string, number> = {};
      for (const deck of decks) {
        const dueCards = await getDueCards(deck.id);
        counts[deck.id] = dueCards.length;
      }
      setDueCardsCount(counts);
    };

    if (decks.length > 0) {
      loadDueCounts();
    }
  }, [decks, getDueCards]);

  // Filter decks by search query
  const filteredDecks = decks.filter(deck =>
    deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Today's focus: active decks with due cards
  const todaysFocus = decks.filter(deck =>
    deck.isActive && (dueCardsCount[deck.id] || 0) > 0
  );

  const handleCreateDeck = async () => {
    try {
      const deck = await createDeck('New Deck', {
        preset: 'balanced',
      });
      navigate(`/app/flashcards/deck/${deck.id}`);
    } catch (err) {
      console.error('Failed to create deck:', err);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (confirm('Delete this deck and all its cards? This cannot be undone.')) {
      try {
        await deleteDeck(deckId);
      } catch (err) {
        console.error('Failed to delete deck:', err);
      }
    }
  };

  const handleStudy = async (deckId: string) => {
    navigate(`/app/flashcards/study/${deckId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading flashcards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground">
            Spaced repetition learning system
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreateDeck} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Deck
          </Button>
        </div>
      </div>

      {/* Today's Focus */}
      {todaysFocus.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Focus
            </CardTitle>
            <CardDescription>
              Active decks with cards due for review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaysFocus.map(deck => (
                <Card key={deck.id} className="cursor-pointer hover:bg-accent/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{deck.name}</CardTitle>
                    <CardDescription>{deck.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Due today:</span>
                      <Badge variant="default">
                        {dueCardsCount[deck.id] || 0} cards
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleStudy(deck.id)}
                      className="w-full"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Study Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search decks..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <Button variant="ghost" size="sm" onClick={() => navigate('/flashcards/statistics')}>
          <TrendingUp className="w-4 h-4 mr-2" />
          View Statistics
        </Button>
      </div>

      {/* All Decks */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Decks</h2>

        {filteredDecks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookMarked className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No decks match your search' : 'No decks yet'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateDeck}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Deck
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDecks.map(deck => (
              <DeckCard
                key={deck.id}
                deck={deck}
                dueCount={dueCardsCount[deck.id] || 0}
                onStudy={() => handleStudy(deck.id)}
                onView={() => navigate(`/app/flashcards/deck/${deck.id}`)}
                onDelete={() => handleDeleteDeck(deck.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================================================
// DECK CARD COMPONENT
// ==========================================================================

interface DeckCardProps {
  deck: Deck;
  dueCount: number;
  onStudy: () => void;
  onView: () => void;
  onDelete: () => void;
}

function DeckCard({ deck, dueCount, onStudy, onView, onDelete }: DeckCardProps) {
  const stats = deck.stats;

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onView}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{deck.name}</CardTitle>
            {deck.description && (
              <CardDescription className="line-clamp-2">
                {deck.description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStudy(); }}>
                <Play className="w-4 h-4 mr-2" />
                Study
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
                <BookMarked className="w-4 h-4 mr-2" />
                View Deck
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive"
              >
                Delete Deck
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground">Total</div>
            <div className="font-semibold">{stats.totalCards}</div>
          </div>
          <div>
            <div className="text-muted-foreground">New</div>
            <div className="font-semibold text-primary">{stats.newCards}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Learning</div>
            <div className="font-semibold text-warning">{stats.learningCards}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Mastered</div>
            <div className="font-semibold text-success">{stats.masteredCards}</div>
          </div>
        </div>

        {/* Due Today Badge */}
        {dueCount > 0 && (
          <Badge variant="default" className="w-full justify-center">
            <Clock className="w-3 h-3 mr-1" />
            {dueCount} due today
          </Badge>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={(e) => { e.stopPropagation(); onStudy(); }}
          className="w-full"
          size="sm"
          disabled={dueCount === 0}
        >
          <Play className="w-4 h-4 mr-2" />
          {dueCount > 0 ? 'Study Now' : 'No cards due'}
        </Button>
      </CardFooter>
    </Card>
  );
}
