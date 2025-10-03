import { Button } from "@/renderer/components/ui/button";
import { Card } from "@/renderer/components/ui/card";
import { BookOpen, Code, ArrowRight, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { PluginManager } from "../../shared/plugin-system";
import { HeroSection, FeaturesSection, DevelopmentPanel } from "@/renderer/components/landing";

const Index = () => {
  const navigate = useNavigate();
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [themes, setThemes] = useState<any[]>([]);
  const [currentTheme, setCurrentTheme] = useState<any>(null);

  // Development mode detection
  const isDevelopment = import.meta.env.DEV;

  // Platform detection
  const isElectron = window.electronAPI !== undefined;
  const isWeb = !isElectron;
  const isMobile = window.innerWidth <= 768; // Simple mobile detection

  // Check for existing profile and auto-login
  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (isElectron) {
        // ONLY run this logic if we're actually on the Index page (Electron-only guard)
        if (window.location.pathname !== '/') {
          return;
        }
        // Electron: Check for existing profiles
        try {
          const lastProfileId = localStorage.getItem('last_profile_id');

          if (lastProfileId) {
            // User has a last-used profile, verify it exists
            const profile = await window.electronAPI.user.get(lastProfileId);
            if (profile) {
              console.log('[Index] Auto-login to last used profile:', profile.profileName);
              navigate('/app');
              return;
            } else {
              // Profile was deleted, clear localStorage
              console.log('[Index] Last profile not found, clearing');
              localStorage.removeItem('last_profile_id');
            }
          }

          // Check if any profiles exist at all
          const profiles = await window.electronAPI.user.list();
          if (profiles.length > 0) {
            // Profiles exist but no last_profile_id - go to profile picker
            console.log('[Index] Profiles exist, showing profile picker');
            navigate('/profile');
            return;
          }

          // No profiles exist - first time setup
          console.log('[Index] No profiles found, showing setup');
          navigate('/setup?platform=desktop');
        } catch (error) {
          console.error('[Index] Failed to check profiles:', error);
          navigate('/setup?platform=desktop');
        }
      } else {
        // Web: Check for cloud auth token
        const token = localStorage.getItem('auth_token');
        if (token) {
          console.log('[Index] Web user has token, redirecting to app');
          navigate('/app');
          return;
        }
        // No token - stay on landing page to show features
      }
    };

    checkProfileAndRedirect();
  }, []); // Run once on mount only - prevents navigation race conditions

  // Handle platform-specific routing
  const handleGetStarted = () => {
    if (isElectron) {
      // Desktop: Show setup screen for local/sync/cloud choice
      navigate('/setup');
    } else if (isWeb) {
      // Web: Direct to registration for cloud-first experience
      navigate('/register');
    }
  };

  const handleDownload = () => {
    // TODO: Implement download logic
    console.log('Download requested for platform:', { isElectron, isWeb, isMobile });
  };

  // Load themes from plugin on mount
  useEffect(() => {
    console.log('[Index] Loading themes from plugin...');
    try {
      const manager = PluginManager.getInstance();
      console.log('[Index] PluginManager instance:', manager);

      const themeService = manager.getService('core-theme/themeService');
      console.log('[Index] ThemeService:', themeService);

      if (themeService) {
        const availableThemes = themeService.getAvailableThemes();
        const current = themeService.getCurrentTheme();

        console.log('[Index] Available themes:', availableThemes);
        console.log('[Index] Current theme:', current);

        setThemes(availableThemes);
        setCurrentTheme(current);

        const unsubscribe = themeService.onThemeChange((theme: any) => {
          console.log('[Index] Theme changed to:', theme);
          setCurrentTheme(theme);
        });

        return unsubscribe;
      } else {
        console.error('[Index] Theme service is null/undefined!');
      }
    } catch (error) {
      console.error('[Index] Error loading theme service:', error);
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
      console.warn('[Index] Failed to set theme:', error);
    }

    setShowThemeDropdown(false);
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
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
                  boxShadow: '0 10px 0 color-mix(in oklab, hsl(var(--accent)), black 25%), 0 15px 25px color-mix(in oklab, hsl(var(--accent)), black 50%), inset 0 1px 0 hsl(var(--background))',
                  background: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--accent))',
                  color: 'hsl(var(--accent))'
                }}
              >
                <Code className="w-4 h-4" />
              </Button>
            )}

            {/* Theme selector button */}
            <Button
              variant="3d-muted"
              size="sm"
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            >
              <Palette className="w-4 h-4" />
            </Button>

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
              onClick={handleGetStarted}
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

        {/* Theme Dropdown */}
        {showThemeDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setShowThemeDropdown(false)}
            />

            {/* Theme dropdown */}
            <div className="absolute top-16 right-6 z-50 min-w-[200px] rounded-lg border border-border bg-popover shadow-lg">
              <div className="p-1">
                {themes.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground">
                    Loading themes...
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Hero Section */}
      <HeroSection onGetStarted={handleGetStarted} />

      {/* Features */}
      <FeaturesSection />

      {/* CTA */}
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
                onClick={handleGetStarted}
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
                onClick={handleDownload}
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