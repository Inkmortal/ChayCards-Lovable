/**
 * SaveTemplateDialog Component
 *
 * Smart save dialog that presents appropriate options based on context:
 * - Built-in template: "Save as custom" OR "Create new template"
 * - User template: "Update template" OR "Save as custom" OR "Create variant"
 * - Existing override: "Update custom" OR "Promote to template" OR "Revert"
 *
 * Shows warnings for bulk operations (e.g., "This will affect 47 cards")
 */

import { useState } from 'react';
import { AlertCircle, Sparkles, Copy, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Label } from '@/renderer/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/renderer/components/ui/radio-group';
import { Alert, AlertDescription } from '@/renderer/components/ui/alert';
import type { CardTemplate, Card } from '../types';

export type SaveOption =
  | 'custom'         // Save as per-card override
  | 'update'         // Update existing template (affects all cards)
  | 'create'         // Create new template from scratch
  | 'variant'        // Create variant of existing template
  | 'promote'        // Promote card override to template
  | 'revert';        // Revert override to template

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CardTemplate;
  card: Card;
  cardCount?: number; // How many cards use this template
  onSave: (option: SaveOption, templateName?: string) => void;
}

export default function SaveTemplateDialog({
  open,
  onOpenChange,
  template,
  card,
  cardCount = 0,
  onSave,
}: SaveTemplateDialogProps) {
  const [selectedOption, setSelectedOption] = useState<SaveOption>('custom');
  const [newTemplateName, setNewTemplateName] = useState(`${template.name} Copy`);

  const hasOverrides = !!card.templateOverrides;
  const isBuiltIn = template.isBuiltIn;

  // Determine available options based on context
  const availableOptions = (): SaveOption[] => {
    if (hasOverrides) {
      // Card already has overrides
      return ['custom', 'promote', 'revert'];
    } else if (isBuiltIn) {
      // Editing built-in template
      return ['custom', 'create'];
    } else {
      // Editing user template
      return ['update', 'custom', 'variant'];
    }
  };

  const options = availableOptions();

  const getOptionLabel = (option: SaveOption): string => {
    switch (option) {
      case 'custom':
        return hasOverrides ? 'Update custom styling' : 'Save as custom styling';
      case 'update':
        return 'Update template (all cards)';
      case 'create':
        return 'Create new template';
      case 'variant':
        return 'Create template variant';
      case 'promote':
        return 'Promote to new template';
      case 'revert':
        return 'Revert to template';
      default:
        return '';
    }
  };

  const getOptionDescription = (option: SaveOption): string => {
    switch (option) {
      case 'custom':
        return hasOverrides
          ? 'Update the custom styling for this card only'
          : 'Apply custom styling to this card only (won\'t affect other cards)';
      case 'update':
        return `Update template "${template.name}" for all ${cardCount} cards using it`;
      case 'create':
        return 'Save as a new template that can be reused';
      case 'variant':
        return `Create a variant of "${template.name}" (based on this design)`;
      case 'promote':
        return 'Convert this card\'s custom styling into a reusable template';
      case 'revert':
        return `Remove custom styling and use template "${template.name}"`;
      default:
        return '';
    }
  };

  const getOptionIcon = (option: SaveOption) => {
    switch (option) {
      case 'custom':
        return <Sparkles className="w-4 h-4 text-warning" />;
      case 'update':
        return <Upload className="w-4 h-4 text-primary" />;
      case 'create':
      case 'variant':
      case 'promote':
        return <Copy className="w-4 h-4 text-success" />;
      case 'revert':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const needsTemplateName = ['create', 'variant', 'promote'].includes(selectedOption);
  const isDestructive = selectedOption === 'revert';
  const affectsMultipleCards = selectedOption === 'update' && cardCount > 1;

  const handleSave = () => {
    if (needsTemplateName && !newTemplateName.trim()) {
      return; // Validation: template name required
    }

    onSave(selectedOption, needsTemplateName ? newTemplateName : undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Save Template Changes</DialogTitle>
          <DialogDescription>
            Choose how to save your customizations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Options */}
          <RadioGroup value={selectedOption} onValueChange={(v) => setSelectedOption(v as SaveOption)}>
            {options.map((option) => (
              <div key={option} className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value={option} id={option} className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor={option}
                    className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    {getOptionIcon(option)}
                    {getOptionLabel(option)}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getOptionDescription(option)}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>

          {/* Template name input (conditional) */}
          {needsTemplateName && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="My Custom Template"
              />
            </div>
          )}

          {/* Warnings */}
          {affectsMultipleCards && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will update <strong>{cardCount} cards</strong> using this template.
                Cards with custom styling will not be affected.
              </AlertDescription>
            </Alert>
          )}

          {isDestructive && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will permanently remove custom styling from this card.
                This action cannot be undone.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant={isDestructive ? 'destructive' : 'default'}
            disabled={needsTemplateName && !newTemplateName.trim()}
          >
            {isDestructive ? 'Revert' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
