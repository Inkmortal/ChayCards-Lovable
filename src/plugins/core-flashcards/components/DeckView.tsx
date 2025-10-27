/**
 * DeckView Component
 *
 * Individual deck management view showing:
 * - Deck statistics and settings
 * - Card list with filters
 * - Quick actions (study, add card, import/export)
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PluginManager } from '@/shared/plugin-system';
import { useFlashcards } from '../hooks/useFlashcards';
import {
  ArrowLeft,
  Plus,
  Play,
  Edit,
  Trash2,
  Upload,
  Download,
  Settings,
  Search,
  Filter,
  MoreVertical,
  BookMarked,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
  DropdownMenuSeparator,
} from '@/renderer/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/renderer/components/ui/table';
import type { Card as FlashCard } from '../types';
import type { FlashcardService } from '../services/FlashcardService';

type CardFilter = 'all' | 'new' | 'learning' | 'review' | 'mastered' | 'due';
type SortBy = 'created' | 'updated' | 'due' | 'ease' | 'interval';

export default function DeckView() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  // Get service from PluginManager
  const manager = PluginManager.getInstance();
  const service = manager.getService('core-flashcards/flashcardService') as FlashcardService;

  const {
    decks,
    cards,
    templates,
    loading,
    updateDeck,
    deleteCard,
    loadCards,
    getDueCards,
  } = useFlashcards(service);

  const [searchQuery, setSearchQuery] = useState('');
  const [cardFilter, setCardFilter] = useState<CardFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [dueCards, setDueCards] = useState<FlashCard[]>([]);

  // Early return if service not available
  if (!service) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">Flashcard service not available</div>
      </div>
    );
  }

  const deck = decks.find(d => d.id === deckId);
  const deckCards = deckId ? cards[deckId] || [] : [];

  // Load cards for this deck
  useEffect(() => {
    if (deckId) {
      loadCards(deckId);
      getDueCards(deckId).then(setDueCards);
    }
  }, [deckId, loadCards, getDueCards]);

  // Filter cards
  const filteredCards = useMemo(() => {
    let filtered = deckCards;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(card => {
        const template = templates.find(t => t.id === card.templateId);
        return Object.values(card.fields).some(value =>
          String(value).toLowerCase().includes(query)
        ) || template?.name.toLowerCase().includes(query);
      });
    }

    // Apply filter
    switch (cardFilter) {
      case 'new':
        filtered = filtered.filter(c => c.state.stage === 'new');
        break;
      case 'learning':
        filtered = filtered.filter(c =>
          c.state.stage === 'learning' || c.state.stage === 'relearning'
        );
        break;
      case 'review':
        filtered = filtered.filter(c => c.state.stage === 'review');
        break;
      case 'mastered':
        filtered = filtered.filter(c => c.state.interval > 21);
        break;
      case 'due':
        const dueIds = dueCards.map(c => c.id);
        filtered = filtered.filter(c => dueIds.includes(c.id));
        break;
    }

    // Apply sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return b.createdAt - a.createdAt;
        case 'updated':
          return b.updatedAt - a.updatedAt;
        case 'due':
          return a.state.dueDate - b.state.dueDate;
        case 'ease':
          return b.state.easeFactor - a.state.easeFactor;
        case 'interval':
          return b.state.interval - a.state.interval;
        default:
          return 0;
      }
    });

    return filtered;
  }, [deckCards, searchQuery, cardFilter, sortBy, dueCards, templates]);

  const handleDeleteCard = async (cardId: string) => {
    if (confirm('Delete this card? This cannot be undone.')) {
      try {
        await deleteCard(cardId, deckId!);
      } catch (err) {
        console.error('Failed to delete card:', err);
      }
    }
  };

  const handleToggleActive = async () => {
    if (deck) {
      await updateDeck(deck.id, { isActive: !deck.isActive });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading deck...</div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <BookMarked className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Deck not found</p>
        <Button onClick={() => navigate('/flashcards')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Flashcards
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/flashcards')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{deck.name}</h1>
            <p className="text-muted-foreground">{deck.description}</p>
          </div>
          <Badge variant={deck.isActive ? 'default' : 'outline'}>
            {deck.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToggleActive}>
            {deck.isActive ? 'Remove from Focus' : 'Add to Focus'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/app/flashcards/study/${deck.id}`)}
            disabled={dueCards.length === 0}
          >
            <Play className="w-4 h-4 mr-2" />
            Study ({dueCards.length})
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Deck Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Upload className="w-4 h-4 mr-2" />
                Import Cards
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" />
                Export Deck
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deck.stats.totalCards}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {dueCards.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mastered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {deck.stats.masteredCards}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(deck.stats.averageRetention)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={cardFilter} onValueChange={(v) => setCardFilter(v as CardFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cards</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="mastered">Mastered</SelectItem>
            <SelectItem value="due">Due Today</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="due">Due Date</SelectItem>
            <SelectItem value="ease">Ease Factor</SelectItem>
            <SelectItem value="interval">Interval</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => navigate(`/app/flashcards/deck/${deckId}/card/new`)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
      </div>

      {/* Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Cards ({filteredCards.length})
          </CardTitle>
          <CardDescription>
            Manage your flashcards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookMarked className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery || cardFilter !== 'all'
                  ? 'No cards match your filters'
                  : 'No cards in this deck yet'}
              </p>
              {!searchQuery && cardFilter === 'all' && (
                <Button onClick={() => navigate(`/app/flashcards/deck/${deckId}/card/new`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Card
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Reviews</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCards.map(card => {
                  const template = templates.find(t => t.id === card.templateId);
                  const isDue = card.state.dueDate <= Date.now();
                  const daysUntilDue = Math.ceil(
                    (card.state.dueDate - Date.now()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <TableRow key={card.id}>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {Object.values(card.fields)[0] as string}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{template?.name || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            card.state.stage === 'new' ? 'secondary' :
                            card.state.stage === 'review' ? 'default' :
                            'outline'
                          }
                        >
                          {card.state.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="w-3 h-3" />
                          {isDue ? (
                            <span className="text-destructive font-medium">Now</span>
                          ) : daysUntilDue === 0 ? (
                            <span>Today</span>
                          ) : daysUntilDue === 1 ? (
                            <span>Tomorrow</span>
                          ) : (
                            <span>{daysUntilDue}d</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <TrendingUp className="w-3 h-3" />
                          {card.state.reviewCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => navigate(`/app/flashcards/deck/${deckId}/card/${card.id}`)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteCard(card.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
