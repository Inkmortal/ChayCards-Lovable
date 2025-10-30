/**
 * CardRenderer Component
 *
 * Renders flashcard HTML templates with field value interpolation.
 * Supports:
 * - Mustache-style interpolation: {{Field}}
 * - Conditionals: {{#Field}}...{{/Field}}
 * - Cloze deletions: {{c1::text}} → clickable reveals
 * - CSS injection (scoped to card)
 * - Media loading (audio/image from storage)
 */

import { useState, useEffect, useMemo } from 'react';
import type { Card, CardTemplate } from '../types';

interface CardRendererProps {
  card: Card;
  template: CardTemplate;
  side: 'front' | 'back';
  onRevealCloze?: (clozeIndex: number) => void;
  revealedClozes?: Set<number>;
  className?: string;
}

export default function CardRenderer({
  card,
  template,
  side,
  onRevealCloze,
  revealedClozes = new Set(),
  className = '',
}: CardRendererProps) {
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  // Load media files from storage
  useEffect(() => {
    if (!card.mediaFiles) return;

    const loadMedia = async () => {
      const urls: Record<string, string> = {};

      for (const [fieldName, storageKey] of Object.entries(card.mediaFiles!)) {
        // TODO: Load from storage and create blob URL
        // For now, just use placeholder
        urls[fieldName] = `/placeholder-media/${fieldName}`;
      }

      setMediaUrls(urls);
    };

    loadMedia();

    // Cleanup: revoke blob URLs
    return () => {
      Object.values(mediaUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [card.mediaFiles]);

  // Interpolate template with field values
  const interpolatedHtml = useMemo(() => {
    // Check for per-card overrides first, fallback to template
    const templateHtml = side === 'front'
      ? (card.templateOverrides?.front || template.front)
      : (card.templateOverrides?.back || template.back);
    let html = templateHtml;

    // Process conditionals first: {{#Field}}...{{/Field}}
    html = html.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, fieldName, content) => {
      const value = card.fields[fieldName];
      // Show content if field has a truthy value
      if (value !== undefined && value !== null && value !== '' && value !== false) {
        return content;
      }
      return '';
    });

    // Process field interpolation: {{Field}}
    html = html.replace(/\{\{(\w+)\}\}/g, (match, fieldName) => {
      let value = card.fields[fieldName];

      // Replace with media URL if available
      if (mediaUrls[fieldName]) {
        value = mediaUrls[fieldName];
      }

      // Convert value to string
      if (value === undefined || value === null) {
        return '';
      }

      if (Array.isArray(value)) {
        return value.join(', ');
      }

      return String(value);
    });

    return html;
  }, [card.fields, template, side, mediaUrls]);

  // Process cloze deletions
  const processedHtml = useMemo(() => {
    let html = interpolatedHtml;

    // Find all cloze deletions: {{c1::text}}, {{c2::text}}, etc.
    html = html.replace(/\{\{c(\d+)::([^}]+)\}\}/g, (match, clozeNum, text) => {
      const clozeIndex = parseInt(clozeNum, 10);
      const isRevealed = revealedClozes.has(clozeIndex);

      if (side === 'front' && !isRevealed) {
        // Show as clickable blank on front side
        return `<span class="cloze" data-cloze="${clozeIndex}">[...]</span>`;
      } else {
        // Show revealed text (front after click, or back side)
        return `<span class="cloze revealed" data-cloze="${clozeIndex}">${text}</span>`;
      }
    });

    return html;
  }, [interpolatedHtml, side, revealedClozes]);

  // Handle cloze click
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onRevealCloze) return;

    const target = e.target as HTMLElement;
    if (target.classList.contains('cloze') && !target.classList.contains('revealed')) {
      const clozeIndex = parseInt(target.dataset.cloze || '0', 10);
      onRevealCloze(clozeIndex);
    }
  };

  // Merge template CSS with override CSS
  const finalCss = useMemo(() => {
    let css = template.css;
    if (card.templateOverrides?.css) {
      css += '\n/* Per-card overrides */\n' + card.templateOverrides.css;
    }
    return css;
  }, [template.css, card.templateOverrides?.css]);

  return (
    <div className={`card-renderer ${className}`}>
      {/* Inject template CSS + overrides */}
      <style>{finalCss}</style>

      {/* Render card HTML */}
      <div
        className="card-content"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        onClick={handleClick}
      />

      {/* Optional: Execute template JS (future enhancement) */}
      {template.js && (
        <script>{template.js}</script>
      )}
    </div>
  );
}

/**
 * Helper: Parse cloze text to extract cloze deletions
 * Used for cloze card generation (future feature)
 */
export function parseClozeText(text: string): {
  clozes: Array<{ index: number; text: string }>;
  totalClozes: number;
} {
  const clozes: Array<{ index: number; text: string }> = [];
  const regex = /\{\{c(\d+)::([^}]+)\}\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    clozes.push({
      index: parseInt(match[1], 10),
      text: match[2],
    });
  }

  const totalClozes = clozes.length > 0 ? Math.max(...clozes.map(c => c.index)) : 0;

  return { clozes, totalClozes };
}

/**
 * Helper: Generate separate cards for each cloze deletion
 * Anki-style: one card per cloze number
 */
export function generateClozeCards(
  text: string,
  templateId: string,
  deckId: string,
  extraFields: Record<string, string | number | boolean | string[] | null> = {}
): Array<{
  fields: Record<string, string | number | boolean | string[] | null>;
  templateId: string;
  deckId: string;
}> {
  const { totalClozes } = parseClozeText(text);
  const cards = [];

  // Generate one card for each cloze index
  for (let i = 1; i <= totalClozes; i++) {
    // Hide all clozes except current one in the text
    let cardText = text.replace(/\{\{c(\d+)::([^}]+)\}\}/g, (match, clozeNum, clozeText) => {
      const num = parseInt(clozeNum, 10);
      if (num === i) {
        // This is the target cloze - keep as-is
        return match;
      } else {
        // Other clozes - show as plain text
        return clozeText;
      }
    });

    cards.push({
      fields: {
        Text: cardText,
        ...extraFields,
      },
      templateId,
      deckId,
    });
  }

  return cards;
}
