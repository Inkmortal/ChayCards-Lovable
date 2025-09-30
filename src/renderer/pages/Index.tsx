import { Button } from "@/renderer/components/ui/button";
import { Card } from "@/renderer/components/ui/card";
import { BookOpen, FileText, CheckSquare, Search, ArrowRight, Play, Palette, Code, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { PluginManager } from "../../shared/plugin-system";

const Index = () => {
  const navigate = useNavigate();
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);

  // Development mode detection
  const isDevelopment = import.meta.env.DEV;

  // Platform detection
  const isElectron = window.electronAPI !== undefined;
  const isWeb = !isElectron;
  const isMobile = window.innerWidth <= 768; // Simple mobile detection

  // Check if user has already made setup choices
  useEffect(() => {
    const checkUserSetup = () => {
      try {
        const hasCompletedSetup = localStorage.getItem('chaycards-setup-complete');
        const userChoice = localStorage.getItem('chaycards-user-choice');

        if (hasCompletedSetup && userChoice) {
          // User has already setup, redirect to app
          console.log('User already setup, redirecting to app');
          // TODO: Navigate to main app once we create it
          // navigate('/app');
        }
      } catch (error) {
        console.warn('Could not check user setup:', error);
      }
    };

    checkUserSetup();
  }, [navigate]);

  // Handle platform-specific routing
  const handleGetStarted = () => {
    if (isElectron) {
      // Desktop: Show setup screen for local/sync/cloud choice
      navigate('/setup');
    } else if (isWeb) {
      // Web: Cloud-first with download option
      navigate('/setup?platform=web');
    }
  };

  const handleDownload = () => {
    // TODO: Implement download logic
    console.log('Download requested for platform:', { isElectron, isWeb, isMobile });
  };

  // Simple theme dropdown component
  const ThemeDropdown = ({ onClose }: { onClose: () => void }) => {
    const [themes, setThemes] = useState<any[]>([]);
    const [currentTheme, setCurrentTheme] = useState<any>(null);

    useEffect(() => {
      try {
        const manager = PluginManager.getInstance();
        const themeService = manager.getService('core-theme/themeService');

        if (themeService) {
          setThemes(themeService.getAvailableThemes());
          setCurrentTheme(themeService.getCurrentTheme());

          // Subscribe to theme changes
          const unsubscribe = themeService.onThemeChange((theme: any) => {
            setCurrentTheme(theme);
          });

          return unsubscribe;
        }
      } catch (error) {
        console.warn('Theme service not available:', error);
      }
    }, []);

    const handleThemeSelect = (themeId: string) => {
      try {
        const manager = PluginManager.getInstance();
        const themeService = manager.getService('core-theme/themeService');

        if (themeService) {
          themeService.setTheme(themeId);
        }
      } catch (error) {
        console.warn('Failed to set theme:', error);
      }

      onClose();
    };

    if (!themes.length) {
      return (
        <div className="p-3 text-sm text-muted-foreground">
          Loading themes...
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              theme.id === currentTheme?.id
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{theme.name}</span>
              {theme.id === currentTheme?.id && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
          </button>
        ))}
      </div>
    );
  };

  // Development panel with quick navigation
  const DevelopmentPanel = ({ onClose }: { onClose: () => void }) => {
    const routes = [
      { path: '/setup', label: 'Setup Page (Desktop)', description: 'Local/Sync/Cloud options' },
      { path: '/setup?platform=web', label: 'Setup Page (Web)', description: 'Cloud-first with download option' },
      // Future routes for when they're implemented
      { path: '/app', label: 'Main App', description: 'Coming soon - main workspace' },
      { path: '/documents', label: 'Documents', description: 'Coming soon - document management' },
      { path: '/tasks', label: 'Tasks', description: 'Coming soon - task tracking' },
    ];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-foreground">Development Routes</h3>
          <span className="text-xs text-muted-foreground">Lovable Testing</span>
        </div>
        {routes.map((route) => (
          <button
            key={route.path}
            onClick={() => {
              navigate(route.path);
              onClose();
            }}
            className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-foreground group-hover:text-accent-foreground">
                  {route.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {route.description}
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground" />
            </div>
          </button>
        ))}
        <div className="border-t border-border pt-3 mt-3">
          <div className="text-xs text-muted-foreground text-center">
            Direct page access for prototyping
          </div>
        </div>
      </div>
    );
  };

  const features = [
    {
      title: "Write & organize",
      description: "Rich documents with markdown support",
      icon: FileText,
    },
    {
      title: "Learn & remember",
      description: "AI-generated flashcards from your content",
      icon: BookOpen,
    },
    {
      title: "Track & complete",
      description: "Tasks extracted automatically from documents",
      icon: CheckSquare,
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                  boxShadow: 'var(--shadow-3d-chunky), inset 0 1px 0 hsl(var(--background))',
                  background: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--orange))',
                  color: 'hsl(var(--orange))'
                }}
              >
                <Code className="w-4 h-4" />
              </Button>
            )}

            {/* Theme selector button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowThemeSelector(!showThemeSelector)}
              className="border-2 font-semibold hover:translate-y-[-4px] active:translate-y-[-2px] transition-all duration-150"
              style={{
                boxShadow: 'var(--shadow-3d-chunky), inset 0 1px 0 hsl(var(--background))',
                background: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))'
              }}
            >
              <Palette className="w-4 h-4" />
            </Button>

            {/* Login button - disabled for now as requested */}
            <Button
              variant="outline"
              size="sm"
              disabled
              className="border-2 font-semibold opacity-50 cursor-not-allowed transition-all duration-150"
              style={{
                boxShadow: 'var(--shadow-3d-chunky), inset 0 1px 0 hsl(var(--background))',
                background: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))'
              }}
            >
              Log in
            </Button>
            <Button
              size="sm"
              onClick={handleGetStarted}
              className="font-semibold hover:translate-y-[-4px] active:translate-y-[-2px] transition-all duration-150"
              style={{
                background: 'linear-gradient(145deg, hsl(var(--blue)), hsl(var(--blue) / 0.85))',
                color: 'hsl(var(--blue-foreground))',
                boxShadow: 'var(--shadow-3d-chunky), inset 0 1px 0 hsl(var(--blue) / 0.3)',
                textShadow: '0 1px 2px hsl(var(--blue-foreground) / 0.3)'
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

        {/* Theme Selector Dropdown */}
        {showThemeSelector && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setShowThemeSelector(false)}
            />

            {/* Theme dropdown */}
            <div className="absolute top-16 right-6 z-50 min-w-[200px] rounded-lg border border-border bg-popover shadow-lg">
              <div className="p-1">
                <ThemeDropdown onClose={() => setShowThemeSelector(false)} />
              </div>
            </div>
          </>
        )}
      </header>

      {/* Hero Section */}
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
                onClick={handleGetStarted}
                className="px-12 py-6 text-lg font-semibold rounded-2xl hover:translate-y-[-5px] active:translate-y-[-2px] transition-all duration-150"
                style={{
                  background: 'linear-gradient(145deg, hsl(var(--green)), hsl(var(--green) / 0.85))',
                  color: 'hsl(var(--green-foreground))',
                  boxShadow: 'var(--shadow-3d-chunky), inset 0 2px 0 hsl(var(--green) / 0.3)',
                  textShadow: '0 1px 2px hsl(var(--green-foreground) / 0.3)'
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
                  boxShadow: 'var(--shadow-3d-chunky), inset 0 1px 0 hsl(var(--background))',
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
            <div className="flex items-center justify-center space-x-3 p-4 rounded-2xl shadow-lg border-2 border-transparent hover:scale-105 transition-transform duration-200" style={{ background: 'hsl(var(--green) / 0.1)', borderColor: 'hsl(var(--green) / 0.2)' }}>
              <div className="w-4 h-4 rounded-full" style={{ background: 'hsl(var(--green))' }}></div>
              <span className="text-sm font-medium text-foreground">Free forever</span>
            </div>
            <div className="flex items-center justify-center space-x-3 p-4 rounded-2xl shadow-lg border-2 border-transparent hover:scale-105 transition-transform duration-200" style={{ background: 'hsl(var(--blue) / 0.1)', borderColor: 'hsl(var(--blue) / 0.2)' }}>
              <div className="w-4 h-4 rounded-full" style={{ background: 'hsl(var(--blue))' }}></div>
              <span className="text-sm font-medium text-foreground">Works offline</span>
            </div>
            <div className="flex items-center justify-center space-x-3 p-4 rounded-2xl shadow-lg border-2 border-transparent hover:scale-105 transition-transform duration-200" style={{ background: 'hsl(var(--purple) / 0.1)', borderColor: 'hsl(var(--purple) / 0.2)' }}>
              <div className="w-4 h-4 rounded-full" style={{ background: 'hsl(var(--purple))' }}></div>
              <span className="text-sm font-medium text-foreground">Privacy first</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-bold mb-6" style={{ color: 'hsl(var(--foreground))', textShadow: '0 2px 4px hsl(var(--foreground) / 0.1)' }}>
              Everything works together
            </h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Stop switching between apps. ChayCards brings documents, tasks, and learning into one unified workspace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const colors = [
                { bg: 'hsl(var(--orange))', fg: 'hsl(var(--orange-foreground))', accent: 'hsl(var(--orange) / 0.1)' },
                { bg: 'hsl(var(--blue))', fg: 'hsl(var(--blue-foreground))', accent: 'hsl(var(--blue) / 0.1)' },
                { bg: 'hsl(var(--purple))', fg: 'hsl(var(--purple-foreground))', accent: 'hsl(var(--purple) / 0.1)' }
              ];
              const color = colors[index];
              
              return (
                <Card 
                  key={index} 
                  className="p-8 border-2 border-transparent hover:border-opacity-50 transition-all hover:shadow-xl hover:translate-y-[-4px] duration-300 rounded-3xl"
                  style={{ 
                    background: color.accent,
                    borderColor: color.bg + '40'
                  }}
                >
                  <div 
                    className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
                    style={{ 
                      background: color.accent,
                      border: `2px solid ${color.bg}40`
                    }}
                  >
                    <feature.icon className="w-8 h-8" style={{ 
                      color: color.bg,
                      strokeWidth: '2.5'
                    }} />
                  </div>
                  <h4 className="text-2xl font-bold mb-4" style={{ 
                    color: 'hsl(var(--foreground))', 
                    textShadow: '0 1px 3px hsl(var(--foreground) / 0.15)' 
                  }}>
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-4xl font-bold text-foreground mb-12 text-center">
            How ChayCards works
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, title: "Write documents", desc: "Create notes, research, or any content using our markdown editor.", color: 'hsl(var(--teal))' },
              { step: 2, title: "AI extracts knowledge", desc: "Key concepts become flashcards. Tasks are identified automatically.", color: 'hsl(var(--pink))' },
              { step: 3, title: "Learn & stay organized", desc: "Review with spaced repetition. Track tasks. Search everything.", color: 'hsl(var(--green))' }
            ].map((item, index) => (
              <Card key={index} className="p-6 border-2 border-transparent hover:scale-105 transition-all duration-300 rounded-2xl shadow-lg">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-white font-bold text-lg"
                  style={{ 
                    background: item.color,
                    border: `2px solid ${item.color}40`,
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)' 
                  }}
                >
                  {item.step}
                </div>
                <h4 className="font-bold text-xl mb-3 text-foreground">{item.title}</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center border-2 shadow-xl rounded-3xl bg-gradient-to-br from-card to-background">
            <div 
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
              style={{ 
                background: 'hsl(var(--primary) / 0.1)',
                border: '3px solid hsl(var(--primary))'
              }}
            >
              <BookOpen className="w-10 h-10" style={{ 
                color: 'hsl(var(--primary))', 
                strokeWidth: '2.5'
              }} />
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
                onClick={handleGetStarted}
                className="px-12 py-6 text-lg font-semibold rounded-2xl hover:translate-y-[-5px] active:translate-y-[-2px] transition-all duration-150"
                style={{ background: 'hsl(var(--green))', color: 'hsl(var(--green-foreground))', boxShadow: 'var(--shadow-3d-chunky)' }}
              >
                Start for free
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleDownload}
                className="px-12 py-6 text-lg font-semibold rounded-2xl border-2 hover:translate-y-[-4px] active:translate-y-[-1px] transition-all duration-150"
                style={{ boxShadow: 'var(--shadow-3d-thick)' }}
              >
                Download for {isElectron ? "Desktop" : "Windows"}
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-muted-foreground">
          © 2024 ChayCards. Made for knowledge workers and lifelong learners.
        </div>
      </footer>
    </div>
  );
};

export default Index;