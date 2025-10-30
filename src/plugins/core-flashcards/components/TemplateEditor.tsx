/**
 * TemplateEditor Component
 *
 * Edit template HTML/CSS with live preview.
 * Two-pane layout: Code editor (left) + Live preview (right)
 *
 * Features:
 * - Edit front/back HTML separately
 * - Edit CSS
 * - Live preview with current card data
 * - Toggle between front/back preview
 * - Smart save options via SaveTemplateDialog
 */

import { useState, useMemo } from 'react';
import { Eye, Code } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/renderer/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/renderer/components/ui/tabs';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Label } from '@/renderer/components/ui/label';
import CardRenderer from './CardRenderer';
import type { Card as FlashcardCard, CardTemplate } from '../types';

interface TemplateEditorProps {
  template: CardTemplate;
  card: FlashcardCard;
  onSave: (updates: { front?: string; back?: string; css?: string }) => void;
  onCancel: () => void;
}

export default function TemplateEditor({
  template,
  card,
  onSave,
  onCancel,
}: TemplateEditorProps) {
  // State for edited template
  const [frontHtml, setFrontHtml] = useState(
    card.templateOverrides?.front || template.front
  );
  const [backHtml, setBackHtml] = useState(
    card.templateOverrides?.back || template.back
  );
  const [css, setCss] = useState(
    card.templateOverrides?.css || template.css
  );

  // Preview state
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [activeTab, setActiveTab] = useState<'front' | 'back' | 'css'>('front');

  // Create temporary template for preview
  const previewTemplate = useMemo(
    (): CardTemplate => ({
      ...template,
      front: frontHtml,
      back: backHtml,
      css: css,
    }),
    [template, frontHtml, backHtml, css]
  );

  const handleSave = () => {
    const updates: { front?: string; back?: string; css?: string } = {};

    // Only include changed fields
    if (frontHtml !== template.front) {
      updates.front = frontHtml;
    }
    if (backHtml !== template.back) {
      updates.back = backHtml;
    }
    if (css !== template.css) {
      updates.css = css;
    }

    onSave(updates);
  };

  const hasChanges =
    frontHtml !== (card.templateOverrides?.front || template.front) ||
    backHtml !== (card.templateOverrides?.back || template.back) ||
    css !== (card.templateOverrides?.css || template.css);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <CardHeader>
        <CardTitle>Customize Template</CardTitle>
        <CardDescription>
          Edit HTML and CSS. Changes will update the card preview in real-time.
        </CardDescription>
      </CardHeader>

      {/* Two-pane layout */}
      <div className="flex-1 grid grid-cols-2 gap-4 px-6 overflow-hidden">
        {/* Left pane: Code editor */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="w-4 h-4" />
                Template Code
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="front">Front HTML</TabsTrigger>
                <TabsTrigger value="back">Back HTML</TabsTrigger>
                <TabsTrigger value="css">CSS</TabsTrigger>
              </TabsList>

              <TabsContent value="front" className="space-y-4">
                <div>
                  <Label htmlFor="front-html">Front Side HTML</Label>
                  <Textarea
                    id="front-html"
                    value={frontHtml}
                    onChange={(e) => setFrontHtml(e.target.value)}
                    placeholder="<div>{{Front}}</div>"
                    className="font-mono text-sm min-h-[400px] mt-2"
                    spellCheck={false}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Use {`{{FieldName}}`} to insert field values
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="back" className="space-y-4">
                <div>
                  <Label htmlFor="back-html">Back Side HTML</Label>
                  <Textarea
                    id="back-html"
                    value={backHtml}
                    onChange={(e) => setBackHtml(e.target.value)}
                    placeholder="<div>{{Back}}</div>"
                    className="font-mono text-sm min-h-[400px] mt-2"
                    spellCheck={false}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Use {`{{FieldName}}`} to insert field values
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="css" className="space-y-4">
                <div>
                  <Label htmlFor="css">Stylesheet</Label>
                  <Textarea
                    id="css"
                    value={css}
                    onChange={(e) => setCss(e.target.value)}
                    placeholder=".card-front { font-size: 20px; }"
                    className="font-mono text-sm min-h-[400px] mt-2"
                    spellCheck={false}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    CSS will be scoped to this card
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right pane: Live preview */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Live Preview
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={previewSide === 'front' ? 'default' : 'outline'}
                  onClick={() => setPreviewSide('front')}
                >
                  Front
                </Button>
                <Button
                  size="sm"
                  variant={previewSide === 'back' ? 'default' : 'outline'}
                  onClick={() => setPreviewSide('back')}
                >
                  Back
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="border-2 border-muted rounded-lg p-6 min-h-[400px] flex items-center justify-center bg-background">
              <CardRenderer
                card={card}
                template={previewTemplate}
                side={previewSide}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer: Action buttons */}
      <div className="flex items-center justify-between px-6 pb-6">
        <div className="text-sm text-muted-foreground">
          {hasChanges && <span className="text-warning">• Unsaved changes</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
