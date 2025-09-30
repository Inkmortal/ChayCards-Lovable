import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./renderer/pages/Index";
import Setup from "./renderer/pages/Setup";
import NotFound from "./renderer/pages/NotFound";
import AppShell from "./renderer/layouts/AppShell";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - outside AppShell */}
        <Route path="/" element={<Index />} />
        <Route path="/setup" element={<Setup />} />

        {/* Main application routes - inside AppShell */}
        <Route path="/app/*" element={<AppShell />} />

        {/* 404 fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;