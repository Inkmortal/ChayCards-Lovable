/**
 * CTASection - Call-to-action section for landing page
 */

import { Button } from "@/renderer/components/ui/button";
import { Card } from "@/renderer/components/ui/card";
import { BookOpen, ArrowRight } from "lucide-react";

interface CTASectionProps {
  onGetStarted: () => void;
  onDownload: () => void;
  isElectron: boolean;
}

export const CTASection: React.FC<CTASectionProps> = ({
  onGetStarted,
  onDownload,
  isElectron
}) => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <Card className="p-12 text-center border-2 shadow-xl rounded-3xl bg-gradient-to-br from-card to-background">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 bg-primary/10 border-3 border-primary">
            <BookOpen className="w-10 h-10 text-primary" strokeWidth={2.5} />
          </div>

          <h3 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            Ready to build your
            <span className="block text-primary">digital workspace?</span>
          </h3>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of knowledge workers who've already transformed how they learn, organize, and create.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              onClick={onGetStarted}
              className="px-12 py-6 text-lg font-semibold rounded-2xl hover:translate-y-[-5px] active:translate-y-[-2px] transition-all duration-150"
              style={{
                background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
                color: 'hsl(var(--primary-foreground))',
                boxShadow: '0 10px 0 color-mix(in oklab, hsl(var(--primary)), black 25%), 0 15px 30px color-mix(in oklab, hsl(var(--primary)), black 50%), inset 0 2px 0 hsl(var(--primary) / 0.3)',
                textShadow: '0 1px 2px hsl(var(--primary-foreground) / 0.3)'
              }}
            >
              Start for free
              <ArrowRight className="w-6 h-6 ml-3" style={{ strokeWidth: '2.5' }} />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onDownload}
              className="px-12 py-6 text-lg font-semibold rounded-2xl border-2 hover:translate-y-[-4px] active:translate-y-[-1px] transition-all duration-150"
              style={{
                boxShadow: '0 8px 0 hsl(var(--foreground) / 0.15), 0 12px 20px hsl(var(--foreground) / 0.1), inset 0 1px 0 hsl(var(--background))',
                background: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                textShadow: '0 1px 2px hsl(var(--foreground) / 0.2)'
              }}
            >
              Download for {isElectron ? "Desktop" : "Windows"}
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
};
