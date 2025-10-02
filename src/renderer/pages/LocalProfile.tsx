import { Button } from "@/renderer/components/ui/button";
import { Card } from "@/renderer/components/ui/card";
import { Input } from "@/renderer/components/ui/input";
import { Label } from "@/renderer/components/ui/label";
import { BookOpen, ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { PluginManager } from "@/shared/plugin-system";

const LocalProfile = () => {
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);

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
      // Create local user record
      const userId = crypto.randomUUID(); // Generate UUID for local user
      const passwordHash = usePassword ? await hashPassword(password) : null;

      // Save user to SQLite via Electron IPC
      if (window.electronAPI) {
        await window.electronAPI.user.create({
          id: userId,
          profileName,
          hasPassword: usePassword,
          passwordHash
        });

        console.log('[LocalProfile] Created local user:', { userId, profileName });

        // Mark setup as complete
        const pluginManager = PluginManager.getInstance();
        const settingsService = pluginManager.getService('core-settings/settingsService');
        if (settingsService) {
          await settingsService.completeSetup('local');
        }

        // Navigate to app
        navigate('/app');
      } else {
        throw new Error('Electron API not available');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple password hashing (should be replaced with proper bcrypt in production)
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleBack = () => {
    navigate('/setup');
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="border-2 hover:translate-y-[-2px] transition-all duration-150"
              style={{
                boxShadow: 'var(--shadow-3d), inset 0 1px 0 hsl(var(--background))',
                background: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))'
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
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
          <div className="w-16" /> {/* Spacer for center alignment */}
        </div>
      </header>

      {/* Profile Creation Form */}
      <section className="py-12 px-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md p-8 border-2 shadow-xl rounded-3xl bg-card">
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
              Create local profile
            </h2>
            <p className="text-muted-foreground">
              Set up your local ChayCards workspace
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

            {/* Create Profile Button */}
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
              {isLoading ? 'Creating profile...' : 'Create profile'}
            </Button>

            {/* Info Note */}
            <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 Your data will be stored locally on this device. You can always enable cloud sync later in settings.
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default LocalProfile;
