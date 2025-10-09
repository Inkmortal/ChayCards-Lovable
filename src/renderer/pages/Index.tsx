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
      if (isElectron()) {
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

          // Always go to profile selection page (entry point)
          // Profile page handles both cases: existing profiles or "Add new profile"
          console.log('[Index] Redirecting to profile selection (entry point)');
          navigate('/profile');
        } catch (error) {
          console.error('[Index] Failed to check profiles:', error);
          navigate('/profile'); // Still go to profile page on error
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
    if (isElectron()) {
      // Desktop: Show setup screen for local/sync/cloud choice
      navigate('/setup');
    } else if (isWeb()) {
      // Web: Direct to registration for cloud-first experience
      navigate('/register');
    }
  };

  const handleDownload = () => {
    // TODO: Implement download logic
    console.log('Download requested for platform:', { isElectron: isElectron(), isWeb: isWeb(), isMobile });
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
        isElectron={isElectron()}
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