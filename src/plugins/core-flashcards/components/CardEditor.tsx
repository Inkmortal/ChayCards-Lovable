/**
 * CardEditor Component
 *
 * Dynamic card editor that adapts to the selected template's field schema.
 * Supports all field types: text, richtext, code, latex, media, cloze.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PluginManager } from '@/shared/plugin-system';
import { useFlashcards } from '../hooks/useFlashcards';
import { useNavigation } from '@/plugins/core-documents/hooks/useNavigation';
import { ArrowLeft, Save, Eye, EyeOff, Repeat } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/renderer/components/ui/card';
import { Input } from '@/renderer/components/ui/input';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Label } from '@/renderer/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/renderer/components/ui/select';
import { useToast } from '@/renderer/hooks/use-toast';
import CardRenderer from './CardRenderer';
import type { CardTemplate, TemplateField, FieldValue } from '../types';
import type { FlashcardService } from '../services/FlashcardService';
import type { Card as FlashcardType } from '../types';

interface CardEditorProps {
  deckId?: string; // Provided when embedded in Documents
  cardId?: string; // Provided when editing existing card
  mode?: 'create' | 'edit';
  defaultTemplateId?: string; // Default template for new cards
}

export default function CardEditor({ deckId: propDeckId, cardId: propCardId, mode: propMode, defaultTemplateId: propDefaultTemplateId }: CardEditorProps = {}) {
  const { deckId: urlDeckId, cardId: urlCardId } = useParams<{ deckId: string; cardId: string }>();
  const navigation = useNavigation();

  // Prefer props (from Documents), fallback to URL params
  const deckId = propDeckId || urlDeckId;
  const cardId = propCardId || urlCardId;
  const mode = propMode || (cardId && cardId !== 'new' ? 'edit' : 'create');

  // Get service from PluginManager
  const manager = PluginManager.getInstance();
  const service = manager.getService('chaycards/core-flashcards/flashcardService') as FlashcardService;

  const {
    templates,
    cards,
    createCard,
    updateCard,
    loadCards,
    uploadMediaFile,
  } = useFlashcards(service);

  const { toast } = useToast();

  // State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(propDefaultTemplateId || null);
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [mediaFiles, setMediaFiles] = useState<Record<string, File>>({});

  // Load existing card if editing
  useEffect(() => {
    if (mode === 'edit' && cardId && deckId && service) {
      // Load cards directly from service to avoid stale closure
      service.getCards(deckId).then((loadedCards) => {
        const card = loadedCards.find(c => c.id === cardId);

        if (card) {
          setSelectedTemplateId(card.templateId);
          setFieldValues(card.fields as Record<string, FieldValue>);
          setTags(card.tags);
        }
      }).catch(err => {
        console.error('Failed to load card for editing:', err);
      });
    }
  }, [mode, cardId, deckId, service]);

  // Get selected template
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Create mock card for preview
  const mockCard = useMemo((): FlashcardType | null => {
    if (!selectedTemplate || !selectedTemplateId) return null;

    return {
      id: 'preview',
      deckId: deckId || 'preview',
      templateId: selectedTemplateId,
      fields: fieldValues,
      state: {
        stage: 'new',
        interval: 0,
        easeFactor: 2.5,
        dueDate: Date.now(),
        reviewCount: 0,
        lapseCount: 0,
        learningStep: 0,
      },
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, [selectedTemplate, selectedTemplateId, fieldValues, tags, deckId]);

  // Handle field value change
  const handleFieldChange = (fieldName: string, value: FieldValue) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
  };

  // Handle media file upload
  const handleMediaUpload = async (fieldName: string, file: File) => {
    setMediaFiles(prev => ({ ...prev, [fieldName]: file }));
  };

  // Validate required fields
  const validateFields = (): boolean => {
    if (!selectedTemplate) return false;

    for (const field of selectedTemplate.fields) {
      if (field.required) {
        const value = fieldValues[field.name];
        if (value === undefined || value === null || value === '') {
          alert(`${field.name} is required`);
          return false;
        }
      }
    }

    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!deckId || !selectedTemplateId) return;
    if (!validateFields()) return;

    setSaving(true);

    try {
      // Upload media files first and get storage keys
      const mediaFileKeys: Record<string, string> = {};

      if (mode === 'create') {
        // For new cards, we'll upload after card is created
        const card = await createCard(deckId, selectedTemplateId, fieldValues, { tags });

        // Upload media files if any
        for (const [fieldName, file] of Object.entries(mediaFiles)) {
          const storageKey = await uploadMediaFile(card.id, fieldName, file);
          mediaFileKeys[fieldName] = storageKey;
        }

        // Update card with media file keys if any were uploaded
        if (Object.keys(mediaFileKeys).length > 0) {
          await updateCard(card.id, { mediaFiles: mediaFileKeys });
        }

        console.log('[CardEditor] Created card:', card.id);

        // Show success toast
        toast({
          title: '✓ Card created',
          description: 'Your flashcard has been saved successfully.',
        });
      } else if (mode === 'edit' && cardId) {
        // Upload any new media files
        for (const [fieldName, file] of Object.entries(mediaFiles)) {
          const storageKey = await uploadMediaFile(cardId, fieldName, file);
          mediaFileKeys[fieldName] = storageKey;
        }

        // Update card with new field values and media files
        await updateCard(cardId, {
          fields: fieldValues as Record<string, FieldValue>,
          tags,
          ...(Object.keys(mediaFileKeys).length > 0 ? { mediaFiles: mediaFileKeys } : {}),
        });

        console.log('[CardEditor] Updated card:', cardId);

        // Show success toast
        toast({
          title: '✓ Card updated',
          description: 'Your changes have been saved.',
        });
      }

      // Navigate back to deck view
      navigation.push({
        type: 'component',
        component: 'chaycards/core-flashcards/DeckView',
        props: { deckId }
      });
    } catch (error) {
      console.error('[CardEditor] Failed to save card:', error);

      toast({
        title: '✗ Save failed',
        description: 'Failed to save card. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigation.push({
      type: 'component',
      component: 'chaycards/core-flashcards/DeckView',
      props: { deckId }
    });
  };

  // Render field input based on field type
  const renderFieldInput = (field: TemplateField) => {
    const value = fieldValues[field.name] || '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value as string}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'richtext':
      case 'cloze':
        return (
          <Textarea
            value={value as string}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={field.type === 'cloze' ? 4 : 6}
            className="font-mono"
          />
        );

      case 'code':
        return (
          <Textarea
            value={value as string}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={10}
            className="font-mono text-sm"
          />
        );

      case 'latex':
        return (
          <div className="space-y-2">
            <Textarea
              value={value as string}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder || 'Enter LaTeX equation (e.g., \\frac{x^2}{2})'}
              rows={3}
              className="font-mono"
            />
            <div className="text-xs text-muted-foreground">
              Use LaTeX syntax. Preview will render using KaTeX.
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-2">
            <Input
              type="file"
              accept={field.accepts?.join(',') || '*/*'}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleMediaUpload(field.name, file);
                  handleFieldChange(field.name, file.name);
                }
              }}
            />
            {mediaFiles[field.name] && (
              <div className="text-sm text-muted-foreground">
                Selected: {mediaFiles[field.name].name}
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            value={value as string}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  // Early return if no service
  if (!service) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">Flashcard service not available</div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deck
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === 'create' ? 'Create Card' : 'Edit Card'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            disabled={!selectedTemplate}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedTemplateId || saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Card'}
          </Button>
        </div>
      </div>

      {/* Template Selection - only show if no template selected */}
      {mode === 'create' && !selectedTemplateId && (
        <Card>
          <CardHeader>
            <CardTitle>Select Template</CardTitle>
            <CardDescription>
              Choose a template that matches your content type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedTemplateId || ''}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span>{template.icon}</span>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {template.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Show selected template with option to change */}
      {mode === 'create' && selectedTemplateId && selectedTemplate && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Using template:</span>
            <div className="flex items-center gap-2">
              <span>{selectedTemplate.icon}</span>
              <span className="font-medium">{selectedTemplate.name}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTemplateId(null)}
          >
            Change Template
          </Button>
        </div>
      )}

      {/* Field Inputs */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Card Content</CardTitle>
            <CardDescription>
              Fill in the fields for your {selectedTemplate.name} card
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTemplate.fields.map(field => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.name}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderFieldInput(field)}
                {field.type === 'cloze' && (
                  <div className="text-xs text-muted-foreground">
                    Use <code className="bg-muted px-1 py-0.5 rounded">{'{{c1::text}}'}</code> syntax for cloze deletions
                  </div>
                )}
              </div>
            ))}

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                value={tags.join(', ')}
                onChange={(e) => setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="e.g., vocab, grammar, chapter-1"
              />
              <div className="text-xs text-muted-foreground">
                Separate tags with commas
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {showPreview && selectedTemplate && mockCard && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  How your card will appear during study
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewSide(prev => prev === 'front' ? 'back' : 'front')}
              >
                <Repeat className="w-4 h-4 mr-2" />
                {previewSide === 'front' ? 'Show Back' : 'Show Front'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-8 bg-card min-h-[200px] flex items-center justify-center">
              <CardRenderer
                card={mockCard}
                template={selectedTemplate}
                side={previewSide}
                className="w-full"
              />
            </div>
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Viewing {previewSide} side • Updates in real-time
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help text */}
      {!selectedTemplateId && mode === 'create' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-sm space-y-2">
              <p className="font-medium">Getting Started:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Select a template that matches your content</li>
                <li>Fill in the required fields</li>
                <li>Add optional tags for organization</li>
                <li>Click "Save Card" when done</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
