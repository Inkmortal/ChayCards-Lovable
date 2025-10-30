import { Button } from "@/renderer/components/ui/button";
import { Card } from "@/renderer/components/ui/card";
import { Input } from "@/renderer/components/ui/input";
import { Label } from "@/renderer/components/ui/label";
import { BookOpen, ArrowLeft, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { STORAGE_KEYS } from "@/shared/constants";
import { PluginManager } from "@/shared/plugin-system";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get ThemeSelector from plugin
  const manager = PluginManager.getInstance();
  const ThemeSelector = manager.getComponent('chaycards/core-theme/ThemeSelector');

  const handleLogin = async () => {
    setError("");

    // Trim whitespace from inputs
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://api.chaycards.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password: trimmedPassword })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();

      // Store JWT token
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);

      // Navigate to app
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleRegister = () => {
    navigate('/register');
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
          <div className="flex items-center space-x-4">
            {/* Theme selector from plugin */}
            {ThemeSelector && <ThemeSelector />}
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      {/* Login Form */}
      <section className="py-12 px-6 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md p-8 border-2 shadow-xl rounded-3xl bg-card">
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                boxShadow: 'var(--shadow-3d)'
              }}
            >
              <LogIn className="w-8 h-8" style={{ color: 'hsl(var(--primary-foreground))' }} />
            </div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              Log in to access your ChayCards workspace
            </p>
          </div>

          <div className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="h-12 text-base"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-12 text-base"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin();
                  }
                }}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <Button
              size="lg"
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold rounded-xl hover:translate-y-[-2px] active:translate-y-0 transition-all duration-150"
              style={{
                background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
                color: 'hsl(var(--primary-foreground))',
                boxShadow: 'var(--shadow-3d)',
                textShadow: '0 1px 2px hsl(var(--primary-foreground) / 0.3)'
              }}
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </Button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={handleRegister}
                  className="text-primary font-medium hover:underline"
                  disabled={isLoading}
                >
                  Register now
                </button>
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default Login;
