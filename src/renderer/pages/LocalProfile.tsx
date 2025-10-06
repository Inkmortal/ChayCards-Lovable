import { Button } from "@/renderer/components/ui/button";
import { Card } from "@/renderer/components/ui/card";
import { Input } from "@/renderer/components/ui/input";
import { Label } from "@/renderer/components/ui/label";
import { BookOpen, ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { PluginManager } from "@/shared/plugin-system";
import { STORAGE_KEYS } from "@/shared/constants";

// Define profile creation step type
type ProfileCreationStep = 'select' | 'create';

const LocalProfile = () => {
  const navigate = useNavigate();
  const pluginManager = PluginManager.getInstance();

  // Get ThemeSelector from plugin
  const ThemeSelector = pluginManager.getComponent('core-theme/ThemeSelector');

  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<ProfileCreationStep>('select');
  const [profileName, setProfileName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);

  // Load existing profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      if (window.electronAPI) {
        try {
          const existingProfiles = await window.electronAPI.user.list();
          setProfiles(existingProfiles);
          // Always stay on select screen, even if no profiles
        } catch (err) {
          console.error('[LocalProfile] Failed to load profiles:', err);
        }
      }
    };
    loadProfiles();
  }, []);

  // Handle profile selection
  const handleSelectProfile = async (profileId: string) => {
    try {
      // Store selected profile
      localStorage.setItem(STORAGE_KEYS.LAST_PROFILE_ID, profileId);

      // Update last used timestamp
      await window.electronAPI.user.setActive(profileId);

      // Navigate to app
      navigate('/app');
    } catch (err: any) {
      setError('Failed to select profile. Please try again.');
    }
  };

  const handleCreateProfile = async () => {
    setError("");

    // Validation
    if (!profileName) {
      setError("Please enter a profile name");
      return;
    }

    if (usePassword) {
      if (!password || !confirmPassword) {
        setError("Please fill in both password fields");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setIsLoading(true);

    try {
      // Check if profile name already exists
      if (window.electronAPI) {
        const exists = await window.electronAPI.user.exists(profileName);
        if (exists) {
          setError("A profile with this name already exists. Please choose a different name.");
          setIsLoading(false);
          return;
        }
      }

      // Navigate to setup page with profile data for storage mode selection
      navigate('/setup', {
        state: {
          profileName,
          password: usePassword ? password : null,
          usePassword
        }
      });

    } catch (err: any) {
      console.error('[LocalProfile] ERROR in handleCreateProfile:', err);
      console.error('[LocalProfile] Error stack:', err.stack);
      setError(err.message || 'Failed to validate profile. Please try again.');
      setIsLoading(false);
    }
  };


  const handleBackToSelect = () => {
    setCurrentStep('select');
    setError(""); // Clear any errors
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header - No back button, profile selection is entry point */}
      <header className="border-b border-border px-6 py-4 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="w-16" /> {/* Spacer for balance */}
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                boxShadow: 'var(--shadow-3d)'
              }}
            >
              <BookOpen className="w-5 h-5" style={{ color: 'hsl(var(--primary-foreground))' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
              ChayCards
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme selector */}
            {ThemeSelector && <ThemeSelector />}
          </div>
        </div>
      </header>

      {/* Three-step flow: Select → Create → Storage Mode */}
      <section className="py-12 px-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md p-8 border-2 shadow-xl rounded-3xl bg-card">
          {currentStep === 'select' && (
            // Step 1: Profile Selection View (always shown, even with no profiles)
            <>
              <div className="text-center mb-8">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                    boxShadow: 'var(--shadow-3d)'
                  }}
                >
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                  Select profile
                </h2>
                <p className="text-muted-foreground">
                  {profiles.length > 0 ? 'Choose a profile to continue' : 'Create your first profile to get started'}
                </p>
              </div>

              {profiles.length > 0 && (
                <div className="space-y-3 mb-6">
                  {profiles.map((profile) => (
                    <Button
                      key={profile.id}
                      variant="outline"
                      size="lg"
                      onClick={() => handleSelectProfile(profile.id)}
                      className="w-full h-16 text-left justify-start border-2 hover:translate-y-[-2px] transition-all duration-150"
                      style={{
                        boxShadow: 'var(--shadow-3d)',
                        background: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-foreground">{profile.profileName}</div>
                          <div className="text-xs text-muted-foreground">
                            {profile.storageMode === 'local' ? 'Local storage' : profile.storageMode === 'cloud' ? 'Cloud storage' : 'Synced storage'}
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep('create')}
                className="w-full h-12 border-2 hover:translate-y-[-2px] transition-all duration-150"
                style={{
                  boxShadow: 'var(--shadow-3d)',
                  background: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))'
                }}
              >
                + Add new profile
              </Button>

              {error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </>
          )}

          {currentStep === 'create' && (
            // Step 2: Profile Creation View
            <>
              <div className="text-center mb-8">
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: 'linear-gradient(145deg, hsl(var(--success)), hsl(var(--success) / 0.8))',
                    boxShadow: 'var(--shadow-3d)'
                  }}
                >
                  <User className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                  Create profile
                </h2>
                <p className="text-muted-foreground">
                  Set up your ChayCards profile
                </p>
              </div>

          <div className="space-y-6">
            {/* Profile Name Field */}
            <div className="space-y-2">
              <Label htmlFor="profileName" className="text-sm font-medium">
                Profile name
              </Label>
              <Input
                id="profileName"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter your name"
                className="h-12 text-base"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                This is how you'll be identified locally
              </p>
            </div>

            {/* Password Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="usePassword"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="w-4 h-4 rounded border-border"
                disabled={isLoading}
              />
              <Label htmlFor="usePassword" className="text-sm font-medium cursor-pointer">
                Protect with password (optional)
              </Label>
            </div>

            {/* Password Fields (conditional) */}
            {usePassword && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="h-12 text-base"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="h-12 text-base"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateProfile();
                      }
                    }}
                  />
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Continue Button */}
            <Button
              size="lg"
              onClick={handleCreateProfile}
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold rounded-xl hover:translate-y-[-2px] active:translate-y-0 transition-all duration-150"
              style={{
                background: 'linear-gradient(145deg, hsl(var(--success)), hsl(var(--success) / 0.85))',
                color: 'white',
                boxShadow: 'var(--shadow-3d)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
              }}
            >
              {isLoading ? 'Validating...' : 'Continue'}
            </Button>

            {/* Back button - always present, returns to profile selection */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToSelect}
              className="w-full mt-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to profiles
            </Button>
          </div>
          </>
          )}

        </Card>
      </section>
    </div>
  );
};

export default LocalProfile;
