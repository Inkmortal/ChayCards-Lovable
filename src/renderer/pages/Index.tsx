import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { HeroSection, FeaturesSection, LandingHeader, CTASection } from "@/renderer/components/landing";
import { isElectron, isWeb } from "@/utils/platform";

const Index = () => {
  const navigate = useNavigate();
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

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <LandingHeader onGetStarted={handleGetStarted} />

      {/* Hero Section */}
      <HeroSection onGetStarted={handleGetStarted} />

      {/* Features */}
      <FeaturesSection />

      {/* CTA */}
      <CTASection
        onGetStarted={handleGetStarted}
        onDownload={handleDownload}
        isElectron={isElectron}
      />

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