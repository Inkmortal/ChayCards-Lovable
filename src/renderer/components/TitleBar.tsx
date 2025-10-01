import { Minus, Square, X, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";

export const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const isElectron = window.electronAPI !== undefined;

  // Don't render title bar if not in Electron
  if (!isElectron) return null;

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electronAPI?.window?.isMaximized) {
        const maximized = await window.electronAPI.window.isMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.window?.minimize();
  };

  const handleMaximize = async () => {
    await window.electronAPI?.window?.maximize();
    const maximized = await window.electronAPI.window.isMaximized();
    setIsMaximized(maximized);
  };

  const handleClose = () => {
    window.electronAPI?.window?.close();
  };

  return (
    <div className="flex items-center justify-between h-8 bg-card border-b border-border select-none">
      {/* Left side - App icon and title */}
      <div className="flex items-center h-full px-3 app-drag-region flex-1">
        <BookOpen className="w-4 h-4 text-primary mr-2" />
        <span className="text-sm font-semibold text-foreground">ChayCards</span>
      </div>

      {/* Right side - Window controls */}
      <div className="flex h-full">
        <button
          onClick={handleMinimize}
          className="flex items-center justify-center w-12 h-full hover:bg-accent/50 transition-colors text-foreground/70 hover:text-foreground"
          aria-label="Minimize"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="flex items-center justify-center w-12 h-full hover:bg-accent/50 transition-colors text-foreground/70 hover:text-foreground"
          aria-label={isMaximized ? "Restore" : "Maximize"}
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-12 h-full hover:bg-destructive hover:text-destructive-foreground transition-colors text-foreground/70"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
