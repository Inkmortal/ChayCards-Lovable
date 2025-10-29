/**
 * Color utility functions for folder customization
 * Handles HSL/RGB/HEX conversions and contrast calculations
 */

/**
 * Convert HSL string to object for react-colorful
 * Format: "220 23% 95%" → { h: 220, s: 23, l: 95 }
 */
export const hslStringToObject = (hsl: string): { h: number; s: number; l: number } => {
  const [h, s, l] = hsl.split(' ').map(v => parseInt(v));
  return { h, s, l };
};

/**
 * Convert HSL object to string for storage
 * Format: { h: 220, s: 23, l: 95 } → "220 23% 95%"
 */
export const hslObjectToString = (color: { h: number; s: number; l: number }): string => {
  return `${Math.round(color.h)} ${Math.round(color.s)}% ${Math.round(color.l)}%`;
};

/**
 * Convert HSL string to hex color
 * Format: "220 23% 95%" → "#eff1f5"
 */
export const hslToHex = (hsl: string): string => {
  const [h, s, l] = hsl.split(' ').map(v => parseInt(v));
  const hDecimal = h / 360;
  const sDecimal = s / 100;
  const lDecimal = l / 100;

  let r, g, b;
  if (sDecimal === 0) {
    r = g = b = lDecimal;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
    const p = 2 * lDecimal - q;
    r = hue2rgb(p, q, hDecimal + 1 / 3);
    g = hue2rgb(p, q, hDecimal);
    b = hue2rgb(p, q, hDecimal - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Calculate contrasting text color (black or white) for a given HSL background
 * Uses WCAG relative luminance formula for accessibility
 * Format: "220 23% 95%" → "#000000" or "#ffffff"
 */
export const getContrastColor = (hsl: string): string => {
  const [h, s, l] = hsl.split(' ').map(v => parseInt(v));
  const hDecimal = h / 360;
  const sDecimal = s / 100;
  const lDecimal = l / 100;

  // Convert HSL to RGB
  let r, g, b;
  if (sDecimal === 0) {
    r = g = b = lDecimal;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
    const p = 2 * lDecimal - q;
    r = hue2rgb(p, q, hDecimal + 1 / 3);
    g = hue2rgb(p, q, hDecimal);
    b = hue2rgb(p, q, hDecimal - 1 / 3);
  }

  // Calculate relative luminance (WCAG formula)
  // Weights: R=0.2126, G=0.7152, B=0.0722 (based on human eye sensitivity)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Format timestamp as relative time
 * Examples: "Just now", "5 minutes ago", "2 hours ago", "Yesterday", "3 days ago"
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

/**
 * Generate unique folder name with counter pattern
 * Pattern: "New Folder", "New Folder (1)", "New Folder (2)", etc.
 *
 * Uses case-insensitive matching to find available name in the parent folder.
 * This ensures the name is unique before the backend's duplicate checking validates it.
 */
export const generateUniqueFolderName = async (
  documentsService: any,
  parentId: string | null
): Promise<string> => {
  const folders = await documentsService.listFolders(parentId);
  const baseName = 'New Folder';

  // Check if base name exists (case-insensitive)
  const baseExists = folders.some(
    (f: any) => f.name.toLowerCase() === baseName.toLowerCase()
  );

  if (!baseExists) {
    return baseName;
  }

  // Find the next available counter
  let counter = 1;
  while (true) {
    const candidateName = `${baseName} (${counter})`;
    const exists = folders.some(
      (f: any) => f.name.toLowerCase() === candidateName.toLowerCase()
    );

    if (!exists) {
      return candidateName;
    }
    counter++;
  }
};
