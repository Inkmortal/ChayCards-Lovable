/**
 * HeroSection - Landing page hero with headline, CTA buttons, and feature pills
 */

import { Button } from "@/renderer/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-background via-card to-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-8 mb-16">
          <h2 className="text-7xl font-bold leading-tight" style={{ textShadow: '0 2px 4px hsl(var(--foreground) / 0.1)' }}>
            <span style={{ color: 'hsl(var(--foreground))' }}>Your digital brain</span>
            <span className="block" style={{ color: 'hsl(var(--primary))' }}>for everything</span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{
            color: 'hsl(var(--muted-foreground))',
            textShadow: '0 1px 2px hsl(var(--muted-foreground) / 0.1)'
          }}>
            ChayCards transforms how you work with knowledge. Write documents,
            create flashcards, manage tasks - all connected by AI in one beautiful workspace.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              onClick={onGetStarted}
              className="px-12 py-6 text-lg font-semibold rounded-2xl hover:translate-y-[-5px] active:translate-y-[-2px] transition-all duration-150"
              style={{
                background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
                color: 'hsl(var(--primary-foreground))',
                boxShadow: '0 10px 0 color-mix(in oklab, hsl(var(--primary)), black 25%), 0 15px 25px color-mix(in oklab, hsl(var(--primary)), black 50%), inset 0 2px 0 hsl(var(--primary) / 0.3)',
                textShadow: '0 1px 2px hsl(var(--primary-foreground) / 0.3)'
              }}
            >
              Start building
              <ArrowRight className="w-6 h-6 ml-3" style={{ strokeWidth: '2.5' }} />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-12 py-6 text-lg font-semibold rounded-2xl border-2 hover:translate-y-[-4px] active:translate-y-[-1px] transition-all duration-150"
              style={{
                boxShadow: '0 10px 0 hsl(var(--foreground) / 0.15), 0 15px 25px hsl(var(--foreground) / 0.1), inset 0 1px 0 hsl(var(--background))',
                background: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                textShadow: '0 1px 2px hsl(var(--foreground) / 0.2)'
              }}
            >
              <Play className="w-6 h-6 mr-3" style={{ strokeWidth: '2.5' }} />
              Watch demo
            </Button>
          </div>
        </div>

        {/* Colorful Feature Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-16">
          <div className="flex items-center justify-center space-x-3 p-4 rounded-2xl border-2 hover:scale-105 transition-transform duration-200 bg-success/10 border-success/20 shadow-lg">
            <div className="w-4 h-4 rounded-full bg-success"></div>
            <span className="text-sm font-medium text-foreground">Free forever</span>
          </div>
          <div className="flex items-center justify-center space-x-3 p-4 rounded-2xl border-2 hover:scale-105 transition-transform duration-200 bg-info/10 border-info/20 shadow-lg">
            <div className="w-4 h-4 rounded-full bg-info"></div>
            <span className="text-sm font-medium text-foreground">Works offline</span>
          </div>
          <div className="flex items-center justify-center space-x-3 p-4 rounded-2xl border-2 hover:scale-105 transition-transform duration-200 bg-tertiary/10 border-tertiary/20 shadow-lg">
            <div className="w-4 h-4 rounded-full bg-tertiary"></div>
            <span className="text-sm font-medium text-foreground">Privacy first</span>
          </div>
        </div>
      </div>
    </section>
  );
};
