/**
 * DeckSettings - Settings component for flashcard decks
 * Provides configuration options for deck behavior
 */

import React, { useState, useEffect } from 'react';
import { PluginManager } from '@/shared/plugin-system';

export interface DeckSettingsProps {
  fileId: string;
}

export const DeckSettings: React.FC<DeckSettingsProps> = ({ fileId }) => {
  const manager = PluginManager.getInstance();
  const service = manager.getService('core-flashcards/flashcardService');

  const [deck, setDeck] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get UI components
  const Label = manager.getComponent('core-ui/Label');
  const Input = manager.getComponent('core-ui/Input');
  const Textarea = manager.getComponent('core-ui/Textarea');
  const Button = manager.getComponent('core-ui/Button');

  // Load deck data
  useEffect(() => {
    if (service && fileId) {
      service.getDeck(fileId).then((d: any) => {
        setDeck(d);
        setLoading(false);
      }).catch((err: Error) => {
        console.error('Failed to load deck:', err);
        setLoading(false);
      });
    }
  }, [fileId, service]);

  // Update deck settings
  const updateDeckSettings = async (updates: any) => {
    if (!service || !deck) return;

    setSaving(true);
    try {
      await service.updateDeck(fileId, updates);
      setDeck({ ...deck, ...updates });
    } catch (err) {
      console.error('Failed to update deck settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Loading deck settings...</p>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Deck not found</p>
      </div>
    );
  }

  if (!Label || !Input || !Textarea || !Button) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>UI components not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <Label htmlFor="deck-description">Description</Label>
        <Textarea
          id="deck-description"
          value={deck.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            updateDeckSettings({ description: e.target.value })
          }
          placeholder="Describe this deck..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Add a description to help you remember what this deck is for
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cards-per-session">Cards per Study Session</Label>
        <Input
          id="cards-per-session"
          type="number"
          min={1}
          max={100}
          value={deck.settings?.cardsPerSession || 20}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateDeckSettings({
              settings: {
                ...deck.settings,
                cardsPerSession: parseInt(e.target.value) || 20
              }
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          Maximum number of cards to review in a single study session
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-cards-per-day">New Cards per Day</Label>
        <Input
          id="new-cards-per-day"
          type="number"
          min={0}
          max={100}
          value={deck.settings?.newCardsPerDay || 10}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateDeckSettings({
              settings: {
                ...deck.settings,
                newCardsPerDay: parseInt(e.target.value) || 10
              }
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          Maximum number of new cards to introduce per day
        </p>
      </div>

      <div className="pt-4 border-t">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Cards</p>
            <p className="text-2xl font-bold">{deck.stats?.totalCards || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cards Due Today</p>
            <p className="text-2xl font-bold">{deck.stats?.cardsDueToday || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">New Cards</p>
            <p className="text-2xl font-bold">{deck.stats?.newCards || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Mastered</p>
            <p className="text-2xl font-bold">{deck.stats?.masteredCards || 0}</p>
          </div>
        </div>
      </div>

      {saving && (
        <div className="text-sm text-muted-foreground text-center">
          Saving changes...
        </div>
      )}
    </div>
  );
};

export default DeckSettings;
