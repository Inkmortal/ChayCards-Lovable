/**
 * LandingHeader - Header component for landing page
 */

import { Button } from "@/renderer/components/ui/button";
import { BookOpen, Code } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { PluginManager } from "../../../shared/plugin-system";
import { DevelopmentPanel } from "./DevelopmentPanel";

interface LandingHeaderProps {
  onGetStarted: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({ onGetStarted }) => {
  const navigate = useNavigate();
  const [showDevPanel, setShowDevPanel] = useState(false);

  // Get ThemeSelector component from plugin
  const manager = PluginManager.getInstance();
  const ThemeSelector = manager.getComponent('core-theme/ThemeSelector');

  // Development mode detection
  const isDevelopment = import.meta.env.DEV;

  return (
    <header className="border-b border-border px-6 py-4 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-3xl flex items-center justify-center hover:translate-y-[-4px] active:translate-y-[-2px] transition-all duration-150"
            style={{
              background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
              boxShadow: 'var(--shadow-3d-chunky), inset 0 1px 0 hsl(var(--primary) / 0.3)'
            }}
          >
            <BookOpen className="w-7 h-7" style={{
              color: 'hsl(var(--primary-foreground))',
              filter: 'drop-shadow(0 2px 4px hsl(var(--primary-foreground) / 0.3))',
              strokeWidth: '2.5'
            }} />
          </div>
          <h1 className="text-3xl font-bold" style={{
            color: 'hsl(var(--foreground))',
            textShadow: '0 2px 4px hsl(var(--foreground) / 0.15)'
          }}>ChayCards</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Development panel button - only in development mode */}
          {isDevelopment && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDevPanel(!showDevPanel)}
              className="border-2 font-semibold hover:translate-y-[-4px] active:translate-y-[-2px] transition-all duration-150"
              style={{
                boxShadow: '0 10px 0 color-mix(in oklab, hsl(var(--accent)), black 25%), 0 15px 25px color-mix(in oklab, hsl(var(--accent)), black 50%), inset 0 1px 0 hsl(var(--background))',
                background: 'hsl(var(--background))',
                borderColor: 'hsl(var(--accent))',
                color: 'hsl(var(--accent))'
              }}
            >
              <Code className="w-4 h-4" />
            </Button>
          )}

          {/* Theme selector from plugin */}
          {ThemeSelector && <ThemeSelector variant="3d" />}

          {/* Login button */}
          <Button
            variant="3d-outline"
            size="sm"
            onClick={() => navigate('/login')}
          >
            Log in
          </Button>
          <Button
            size="sm"
            onClick={onGetStarted}
            className="font-semibold hover:translate-y-[-4px] active:translate-y-[-2px] transition-all duration-150"
            style={{
              background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
              color: 'hsl(var(--primary-foreground))',
              boxShadow: '0 10px 0 color-mix(in oklab, hsl(var(--primary)), black 25%), 0 15px 25px color-mix(in oklab, hsl(var(--primary)), black 50%), inset 0 1px 0 hsl(var(--primary) / 0.3)',
              textShadow: '0 1px 2px hsl(var(--primary-foreground) / 0.3)'
            }}
          >
            Get started
          </Button>
        </div>
      </div>

      {/* Development Panel Dropdown */}
      {showDevPanel && isDevelopment && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setShowDevPanel(false)}
          />

          {/* Development dropdown */}
          <div className="absolute top-16 right-20 z-50 min-w-[280px] rounded-lg border border-border bg-popover shadow-lg">
            <div className="p-1">
              <DevelopmentPanel onClose={() => setShowDevPanel(false)} />
            </div>
          </div>
        </>
      )}
    </header>
  );
};
