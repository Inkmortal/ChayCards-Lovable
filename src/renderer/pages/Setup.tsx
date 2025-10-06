import { Button } from "@/renderer/components/ui/button";
import { Card } from "@/renderer/components/ui/card";
import { BookOpen, Cloud, HardDrive, RefreshCw, Download, ArrowLeft, Check } from "lucide-react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { PluginManager } from "@/shared/plugin-system";
import { isElectron, isWeb } from "@/utils/platform";
import { STORAGE_KEYS } from "@/shared/constants";

const Setup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Get profile data from navigation state (when coming from LocalProfile)
  const profileData = location.state as { profileName?: string; password?: string | null; usePassword?: boolean } | null;

  // Get ThemeSelector from plugin
  const manager = PluginManager.getInstance();
  const ThemeSelector = manager.getComponent('core-theme/ThemeSelector');

  // Platform detection - if we have profile data, we're definitely on desktop
  const platform = profileData
    ? 'desktop'
    : (searchParams.get('platform') || (isElectron() ? 'desktop' : 'web'));

  // Setup options based on platform
  const getSetupOptions = () => {
    if (platform === 'web') {
      return [
        {
          id: 'cloud-login',
          title: 'Sign in to ChayCards',
          description: 'Access your workspace from anywhere with cloud sync',
          icon: Cloud,
          colorClass: 'info',
          disabled: true, // Disabled as requested
          disabledText: 'Coming soon'
        },
        {
          id: 'cloud-signup',
          title: 'Create account',
          description: 'Start fresh with a new ChayCards workspace',
          icon: Cloud,
          colorClass: 'success',
          disabled: true, // Disabled as requested
          disabledText: 'Coming soon'
        },
        {
          id: 'download',
          title: 'Download desktop app',
          description: 'Get the full ChayCards experience with offline access',
          icon: Download,
          colorClass: 'tertiary'
        }
      ];
    }

    // Desktop options
    return [
      {
        id: 'local',
        title: 'Use locally',
        description: 'Keep everything on your device. Perfect for privacy.',
        icon: HardDrive,
        colorClass: 'success'
      },
      {
        id: 'sync',
        title: 'Sync with cloud',
        description: 'Hybrid approach - local storage with cloud backup.',
        icon: RefreshCw,
        colorClass: 'info'
      },
      {
        id: 'cloud',
        title: 'Cloud only',
        description: 'Everything stored in the cloud. Requires internet.',
        icon: Cloud,
        colorClass: 'tertiary'
      }
    ];
  };

  const setupOptions = getSetupOptions();

  const handleOptionSelect = (optionId: string) => {
    const option = setupOptions.find(opt => opt.id === optionId);
    if (option?.disabled) return;

    setSelectedOption(optionId);
  };

  // Password hashing helper
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleContinue = async () => {
    if (!selectedOption) return;

    setIsCreatingProfile(true);

    try {
      // If we have profile data, create the profile with selected storage mode
      if (profileData && isElectron() && window.electronAPI) {
        const storageMode = selectedOption as 'local' | 'sync' | 'cloud';
        const userId = crypto.randomUUID();
        const passwordHash = profileData.usePassword && profileData.password
          ? await hashPassword(profileData.password)
          : null;

        await window.electronAPI.user.create({
          id: userId,
          profileName: profileData.profileName!,
          storageMode,
          hasPassword: profileData.usePassword || false,
          passwordHash
        });

        console.log('[Setup] Created profile:', { userId, profileName: profileData.profileName, storageMode });

        // Set as active profile and navigate to app
        localStorage.setItem(STORAGE_KEYS.LAST_PROFILE_ID, userId);
        navigate('/app');
        return;
      }

      // Legacy flow for when no profile data (coming from initial setup)
      if (selectedOption === 'download') {
        // TODO: Trigger download
        console.log('Triggering download...');
        return;
      }

      // Handle web cloud login/signup
      if (selectedOption === 'cloud-login') {
        navigate('/login');
        return;
      }

      if (selectedOption === 'cloud-signup') {
        navigate('/register');
        return;
      }

      // Handle desktop storage modes (redirect to profile creation)
      if (selectedOption === 'local' || selectedOption === 'sync' || selectedOption === 'cloud') {
        navigate('/profile');
        return;
      }

    } catch (error) {
      console.error('[Setup] Failed to create profile:', error);
      setIsCreatingProfile(false);
    }
  };

  const handleBack = () => {
    if (profileData) {
      navigate('/profile');
    } else {
      navigate('/');
    }
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
              ChayCards Setup
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Theme selector from plugin */}
            {ThemeSelector && <ThemeSelector />}
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      {/* Setup Content */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6" style={{ color: 'hsl(var(--foreground))' }}>
              {platform === 'web' ? 'Get started with ChayCards' : 'How would you like to use ChayCards?'}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {platform === 'web'
                ? 'Choose how you\'d like to access your digital workspace'
                : 'Choose your storage preference. You can always change this later in settings.'
              }
            </p>
          </div>

          {/* Setup Options */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {setupOptions.map((option) => {
              const isSelected = selectedOption === option.id;
              const isDisabled = option.disabled;
              
              const getColorClasses = (colorClass: string) => ({
                bg: `bg-${colorClass}/10`,
                border: `border-${colorClass}/30`,
                selectedBorder: `border-${colorClass}`,
                iconBg: `bg-${colorClass}/20`,
                iconBorder: `border-${colorClass}/40`,
                icon: `text-${colorClass}`,
                indicatorBg: `bg-${colorClass}`
              });
              
              const colors = getColorClasses(option.colorClass);

              return (
                <Card
                  key={option.id}
                  className={`relative p-8 border-2 cursor-pointer transition-all duration-300 rounded-3xl ${
                    isSelected
                      ? `${colors.selectedBorder} shadow-xl scale-105 ${colors.bg}`
                      : `border-transparent hover:${colors.border} hover:shadow-lg hover:scale-102`
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleOptionSelect(option.id)}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center ${colors.indicatorBg}`}>
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  )}

                  {/* Disabled indicator */}
                  {isDisabled && (
                    <div className="absolute top-4 right-4 px-2 py-1 bg-muted rounded-md">
                      <span className="text-xs font-medium text-muted-foreground">
                        {option.disabledText}
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 border-2 ${colors.iconBg} ${colors.iconBorder}`}>
                    <option.icon className={`w-8 h-8 ${colors.icon}`} strokeWidth={2.5} />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-4 text-foreground">
                    {option.title}
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {option.description}
                  </p>
                </Card>
              );
            })}
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedOption || isCreatingProfile}
              className="px-12 py-6 text-lg font-semibold rounded-2xl hover:translate-y-[-5px] active:translate-y-[-2px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{
                background: selectedOption
                  ? 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))'
                  : 'hsl(var(--muted))',
                color: selectedOption ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                boxShadow: selectedOption ? 'var(--shadow-3d-chunky)' : 'var(--shadow-md)'
              }}
            >
              {isCreatingProfile ? 'Creating profile...' : (selectedOption === 'download' ? 'Download ChayCards' : 'Continue')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Setup;