// Global type definitions

interface Window {
  electronAPI?: {
    getVersion: () => string;
    saveFile: (data: string, filename: string) => Promise<void>;
    readFile: () => Promise<string | null>;
    // Add more as needed
  };
}

// Declare modules without types
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

// Environment variables
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}