/**
 * FlashcardHome Component - Revamped Two-Tab Dashboard
 *
 * Tab 1: Focus
 * - Today's Focus widget (active decks with due cards)
 * - Activity heatmap (52-week GitHub-style)
 * - All Decks list (infinite scroll)
 *
 * Tab 2: Library
 * - Browse by folder (expandable fat row list)
 * - Folder tree with aggregate statistics
 * - Simple/Rich view mode toggle
 *
 * Features:
 * - Persistent state (view mode, sort/filter, active tab)
 * - Folder integration with Documents plugin
 * - Context menus for folders and decks
 * - Hover study buttons
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PluginManager } from '@/shared/plugin-system';
import { useFlashcards } from '../hooks/useFlashcards';
import { usePersistentState, useFolderTree, useDueCards, FocusMode } from '../hooks';
import {
  Plus,
  Upload,
  Download,
  LayoutList,
  LayoutGrid,
  ChevronDown,
  Calendar,
  TrendingUp,
  Clipboard,
  Play
} from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/renderer/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import type { FlashcardService } from '../services/FlashcardService';
import type { DocumentsService } from '@/plugins/core-documents';
import type { ViewMode, FocusMode as FocusModeType } from '../types';
import { DeckRow } from './DeckRow';
import { FolderTreeNode } from './FolderTreeNode';

export default function FlashcardHome() {
  const navigate = useNavigate();

  // Get services from PluginManager
  const manager = PluginManager.getInstance();
  const flashcardService = manager.getService('core-flashcards/flashcardService') as FlashcardService;
  const documentsService = manager.getService('core-documents/documentsService') as DocumentsService;

  // Flashcard data
  const {
    decks,
    loading,
    error,
    createDeck,
    deleteDeck,
    updateDeck,
  } = useFlashcards(flashcardService);

  // Documents integration
  const [folders, setFolders] = useState<any[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Persistent UI state
  const [activeTab, setActiveTab] = usePersistentState<'focus' | 'library'>('flashcards:activeTab', 'focus');
  const [viewMode, setViewMode] = usePersistentState<ViewMode>('flashcards:viewMode', 'simple');
  const [focusMode, setFocusMode] = usePersistentState<FocusModeType>('flashcards:focusMode', 'combined');
  const [expandedFolders, setExpandedFolders] = usePersistentState<Record<string, boolean>>('flashcards:expandedFolders', {});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = usePersistentState<'name' | 'recent' | 'due' | 'active'>('flashcards:sortBy', 'recent');

  // Early return if services not available
  if (!flashcardService || !documentsService) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">Flashcard or Documents service not available</div>
      </div>
    );
  }

  // Load folders from DocumentsService
  useEffect(() => {
    const loadFolders = async () => {
      setLoadingFolders(true);
      try {
        const allFolders = await documentsService.getFolders();
        setFolders(allFolders);
      } catch (err) {
        console.error('[FlashcardHome] Failed to load folders:', err);
      } finally {
        setLoadingFolders(false);
      }
    };

    loadFolders();
  }, [documentsService]);

  // Build enriched folder tree
  const folderTree = useFolderTree({
    folders,
    decks,
    expandedFolders
  });

  // Get due cards for Today's Focus
  const { dueDecks, totalDue } = useDueCards({ decks, focusMode });

  // Filter and sort decks for "All Decks" section
  const filteredDecks = decks
    .filter(deck =>
      !searchQuery ||
      deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return b.updatedAt - a.updatedAt;
        case 'due':
          return b.stats.dueToday - a.stats.dueToday;
        case 'active':
          return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
        default:
          return 0;
      }
    });

  // Handlers
  const handleCreateDeck = async () => {
    try {
      const deck = await createDeck('New Deck', {
        preset: 'balanced',
      });
      navigate(`/app/flashcards/deck/${deck.id}`);
    } catch (err) {
      console.error('[FlashcardHome] Failed to create deck:', err);
    }
  };

  const handleOpenDeck = (deckId: string) => {
    navigate(`/app/flashcards/deck/${deckId}`);
  };

  const handleStudyDeck = (deckId: string) => {
    navigate(`/app/flashcards/study/${deckId}`);
  };

  const handleStudyFolder = (folderId: string) => {
    // TODO: Implement folder study (combined session)
    console.log('[FlashcardHome] Study folder:', folderId);
  };

  const handleToggleDeckActive = async (deckId: string) => {
    const deck = decks.find(d => d.id === deckId);
    if (deck) {
      await updateDeck(deckId, { isActive: !deck.isActive });
    }
  };

  const handleToggleFolderExpand = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleDeckContextMenu = (deckId: string, event: React.MouseEvent) => {
    // TODO: Implement deck context menu
    console.log('[FlashcardHome] Deck context menu:', deckId);
  };

  const handleFolderContextMenu = (folderId: string, event: React.MouseEvent) => {
    // TODO: Implement folder context menu
    console.log('[FlashcardHome] Folder context menu:', folderId);
  };

  if (loading || loadingFolders) {
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
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Simple header with accent */}
      <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Flashcards
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Master anything with spaced repetition
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="3d-outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="3d-outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleCreateDeck} variant="3d-primary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Deck
          </Button>
        </div>
      </div>

      {/* Two-Tab Layout */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'focus' | 'library')} className="flex-1 flex flex-col overflow-hidden">
        {/* Tab List */}
        <div className="px-6 pt-3 border-b border-border">
          <TabsList className="bg-transparent border-0 p-0 h-auto">
            <TabsTrigger
              value="focus"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent pb-3"
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="font-medium">Focus</span>
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent pb-3"
            >
              <LayoutList className="w-4 h-4 mr-2" />
              <span className="font-medium">Library</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Focus Tab */}
        <TabsContent value="focus" className="flex-1 overflow-y-auto px-6 pb-6 space-y-6 mt-4">
          {/* Today's Focus Widget */}
          <div className="rounded-lg border-2 border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Calendar className="w-5 h-5 text-primary" />
                Today's Focus
                {totalDue > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold">
                    {totalDue} due
                  </span>
                )}
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="3d-outline" size="sm">
                    {focusMode === 'combined' && 'Combined'}
                    {focusMode === 'by-deck' && 'By Deck'}
                    {focusMode === 'by-folder' && 'By Folder'}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFocusMode('combined')}>
                    Combined
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFocusMode('by-deck')}>
                    By Deck
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFocusMode('by-folder')}>
                    By Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {dueDecks.length === 0 ? (
              <div className="text-center py-8 px-6 rounded-lg bg-muted/30">
                <p className="text-base font-medium text-foreground">All caught up!</p>
                <p className="text-sm mt-1 text-muted-foreground">Star decks to add them to Today's Focus</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dueDecks.map(deck => {
                  const fullDeck = decks.find(d => d.id === deck.id);
                  if (!fullDeck) return null;
                  return (
                    <div key={deck.id} className="bg-card rounded-lg overflow-hidden">
                      <DeckRow
                        deck={fullDeck}
                        viewMode={viewMode}
                        onOpen={handleOpenDeck}
                        onStudy={handleStudyDeck}
                        onToggleActive={handleToggleDeckActive}
                        onContextMenu={handleDeckContextMenu}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Heatmap - Placeholder */}
          <div className="rounded-lg border-2 border-border bg-card p-4 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">
              <TrendingUp className="w-5 h-5 text-success" />
              Activity Streak
            </h2>
            <div className="text-center py-8 px-6 rounded-lg bg-muted/30">
              <p className="text-4xl mb-2">📊</p>
              <p className="text-base font-medium text-foreground">Activity heatmap coming soon</p>
              <p className="text-sm mt-1 text-muted-foreground">Track your learning journey</p>
            </div>
          </div>

          {/* All Decks Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                All Decks
                <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-medium">
                  {filteredDecks.length}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-muted rounded-md p-1 border border-border">
                  <Button
                    variant={viewMode === 'simple' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('simple')}
                    className={`h-8 ${viewMode === 'simple' ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    <LayoutList className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'rich' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('rich')}
                    className={`h-8 ${viewMode === 'rich' ? 'bg-primary text-primary-foreground' : ''}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="3d-outline" size="sm">
                      Sort: {sortBy === 'name' && 'Name'}
                      {sortBy === 'recent' && 'Recent'}
                      {sortBy === 'due' && 'Due'}
                      {sortBy === 'active' && 'Active'}
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy('name')}>
                      Name
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('recent')}>
                      Recently Updated
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('due')}>
                      Most Due
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('active')}>
                      Active First
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Input
                placeholder="Search decks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Deck List */}
            {filteredDecks.length === 0 ? (
              <div className="text-center py-12 rounded-lg bg-muted/30 border border-dashed border-border">
                <div className="text-5xl mb-3">🎴</div>
                <p className="text-muted-foreground text-base font-medium mb-1">
                  {searchQuery ? 'No decks match your search' : 'No decks yet'}
                </p>
                {!searchQuery && (
                  <>
                    <p className="text-muted-foreground/70 text-sm mb-3">
                      Create your first deck and start learning
                    </p>
                    <Button onClick={handleCreateDeck} variant="3d-primary" size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Deck
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="border-2 border-border rounded-xl divide-y divide-border shadow-lg overflow-hidden bg-card">
                {filteredDecks.map(deck => (
                  <DeckRow
                    key={deck.id}
                    deck={deck}
                    viewMode={viewMode}
                    onOpen={handleOpenDeck}
                    onStudy={handleStudyDeck}
                    onToggleActive={handleToggleDeckActive}
                    onContextMenu={handleDeckContextMenu}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="flex-1 overflow-y-auto px-6 pb-6 space-y-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              Browse by Folder
            </h2>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-muted rounded-md p-1 border border-border">
                <Button
                  variant={viewMode === 'simple' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('simple')}
                  className={`h-8 ${viewMode === 'simple' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'rich' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('rich')}
                  className={`h-8 ${viewMode === 'rich' ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Folder Tree */}
          {folderTree.length === 0 ? (
            <div className="text-center py-12 rounded-lg bg-muted/30 border border-dashed border-border">
              <div className="text-5xl mb-3">📂</div>
              <p className="text-muted-foreground text-base font-medium mb-1">
                No folders with flashcard decks
              </p>
              <p className="text-muted-foreground/70 text-sm">
                Create folders in Documents and place decks inside
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card">
              {folderTree.map(folder => (
                <FolderTreeNode
                  key={folder.id}
                  folder={folder}
                  viewMode={viewMode}
                  onToggleExpand={handleToggleFolderExpand}
                  onOpenDeck={handleOpenDeck}
                  onStudyFolder={handleStudyFolder}
                  onStudyDeck={handleStudyDeck}
                  onToggleDeckActive={handleToggleDeckActive}
                  onFolderContextMenu={handleFolderContextMenu}
                  onDeckContextMenu={handleDeckContextMenu}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
