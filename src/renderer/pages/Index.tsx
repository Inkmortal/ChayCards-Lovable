import { Button } from "@/renderer/components/ui/button";

const Index = () => {
  const isElectron = window.electronAPI !== undefined;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">ChayCards</h1>
      <p className="text-gray-600 mb-8">
        Your all-in-one digital workspace
      </p>
      <div className="text-sm text-gray-500">
        Running in {isElectron ? "Electron" : "Web"} mode
      </div>
    </div>
  );
};

export default Index;