/**
 * FileDisplay - Helper components for displaying files with proper icons and metadata
 *
 * Provides high-level components that combine FileIconRenderer with handler lookup logic:
 * - FileIconDisplay: Shows file icon based on registered handler
 * - FileTypeLabel: Shows file type name from handler or extension fallback
 * - getFileDisplayName: Strips extension from filename for clean display
 */

import React from 'react';
import { FileIconRenderer } from './FileIconRenderer';
import { useFileHandler } from '../hooks/useDocuments';
import type { StoredFile } from '../types';
import { FileText } from 'lucide-react';

interface FileIconDisplayProps {
  file: StoredFile;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * FileIconDisplay - Shows file icon based on registered handler
 *
 * Usage:
 *   <FileIconDisplay file={file} size="large" />
 */
export const FileIconDisplay: React.FC<FileIconDisplayProps> = ({ file, className, size = 'medium' }) => {
  const handler = useFileHandler(file);

  if (!handler) {
    // No handler registered - show default FileText icon
    const sizeClasses = {
      small: 'w-4 h-4',
      medium: 'w-8 h-8',
      large: 'w-16 h-16'
    };
    return <FileText className={`${sizeClasses[size]} text-muted-foreground ${className || ''}`} />;
  }

  return <FileIconRenderer icon={handler.icon} className={className} size={size} />;
};

interface FileTypeLabelProps {
  file: StoredFile;
  className?: string;
}

/**
 * FileTypeLabel - Shows file type name from handler or extension fallback
 *
 * Usage:
 *   <FileTypeLabel file={file} />
 *
 * Examples:
 *   "Flashcard Deck" (from handler.name)
 *   ".md file" (fallback if no handler)
 */
export const FileTypeLabel: React.FC<FileTypeLabelProps> = ({ file, className = '' }) => {
  const handler = useFileHandler(file);

  const label = handler ? handler.name : `${file.extension} file`;

  return (
    <span className={`text-xs text-muted-foreground ${className}`}>
      {label}
    </span>
  );
};

/**
 * getFileDisplayName - Strips extension from filename for clean display
 *
 * Usage:
 *   const displayName = getFileDisplayName(file);
 *
 * Examples:
 *   "New Deck.deck" → "New Deck"
 *   "Document.pdf" → "Document"
 *   "NoExtension" → "NoExtension"
 */
export function getFileDisplayName(file: StoredFile): string {
  if (!file.extension || !file.filename.endsWith(file.extension)) {
    return file.filename;
  }

  return file.filename.slice(0, -file.extension.length);
}
