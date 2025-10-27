/**
 * FileIconRenderer - Universal icon renderer for FileHandlers
 *
 * Supports three icon types with compile-time type safety:
 * 1. Emoji - Simple unicode emojis (🎴, 📝, 📄)
 * 2. Lucide - Icon names from lucide-react library (Brain, FileText, etc.)
 * 3. Component - Custom icon components from plugin registry
 */

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { FileText } from 'lucide-react';
import { PluginManager } from '@/shared/plugin-system';
import type { FileHandlerIcon } from '../types';
import { cn } from '@/shared/lib/utils';

interface FileIconRendererProps {
  icon: FileHandlerIcon;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const FileIconRenderer: React.FC<FileIconRendererProps> = ({ icon, className, size = 'medium' }) => {
  // Size mappings for different contexts
  const sizeClasses = {
    small: 'w-4 h-4 text-base',      // Tree view icons
    medium: 'w-8 h-8 text-3xl',      // Default/medium contexts
    large: 'w-16 h-16 text-6xl'      // Grid card icons
  };

  const baseClassName = className || sizeClasses[size];

  switch (icon.type) {
    case 'emoji': {
      // Render emoji as text span
      return (
        <span className={cn(baseClassName, 'inline-flex items-center justify-center')}>
          {icon.emoji}
        </span>
      );
    }

    case 'lucide': {
      // Look up Lucide icon component by name
      const IconComponent = (LucideIcons as any)[icon.name] as React.ComponentType<{ className?: string }>;

      if (!IconComponent) {
        console.warn(`[FileIconRenderer] Lucide icon "${icon.name}" not found, falling back to FileText`);
        return <FileText className={cn(baseClassName, 'text-muted-foreground')} />;
      }

      return <IconComponent className={cn(baseClassName, 'text-muted-foreground')} />;
    }

    case 'component': {
      // Look up custom component from plugin registry
      const Component = PluginManager.getInstance().getComponent(icon.name);

      if (!Component) {
        console.warn(`[FileIconRenderer] Component "${icon.name}" not found in plugin registry, falling back to FileText`);
        return <FileText className={cn(baseClassName, 'text-muted-foreground')} />;
      }

      return React.createElement(Component, { className: baseClassName });
    }

    default: {
      // TypeScript ensures exhaustive checking - this should never happen
      const _exhaustive: never = icon;
      console.error('[FileIconRenderer] Invalid icon type:', _exhaustive);
      return <FileText className={cn(baseClassName, 'text-muted-foreground')} />;
    }
  }
};
