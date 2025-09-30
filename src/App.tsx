import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./renderer/pages/Index";
import Setup from "./renderer/pages/Setup";
import NotFound from "./renderer/pages/NotFound";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;