import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ExplorerProvider } from "./context/ExplorerContext";
import { AppShell } from "./components/AppShell";
import { ExplorerPage } from "./pages/ExplorerPage";
import { CaseDetailPage } from "./pages/CaseDetailPage";
import { SaffireSpecPage } from "./pages/SaffireSpecPage";
import { PitchDeckPage } from "./pages/PitchDeckPage";

export function App() {
  return (
    <BrowserRouter>
      <ExplorerProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<ExplorerPage />} />
            <Route path="/cases/:caseId" element={<CaseDetailPage />} />
            <Route path="/special-cases/:caseId" element={<SaffireSpecPage />} />
            <Route path="/pitch" element={<PitchDeckPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </ExplorerProvider>
    </BrowserRouter>
  );
}

export default App;
