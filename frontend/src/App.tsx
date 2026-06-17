import { Routes, Route } from "react-router-dom";

import Homepage from "./pages/Homepage";
import DocumentsPage from "./pages/Documentspage";
import DocumentDetailPage from "./pages/Documentdetailpage";
import CheckpointDetailPage from "./pages/Checkpointdetailpage";
import CheckpointFlow from "./pages/Checkpointflow";
import ScanCheckpointPage from "./pages/ScanCheckpointPage";
import CheckpointSignPage from "./pages/CheckpointSignPage";
import QRScannerPage from "./pages/QRscannerpage";
import AppLayout from "./pages/AppLayout";
import UploadPage from "./pages/Uploadpage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />

      <Route element={<AppLayout />}>
        {/* Homepage */}
        <Route path="/" element={<Homepage />} />

        {/* Documents */}
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />
        <Route path="/upload" element={<UploadPage />} />

        {/* Checkpoint */}
        <Route path="/checkpoints/:id" element={<CheckpointDetailPage />} />

        <Route path="/checkpoints/:id/sign" element={<CheckpointSignPage />} />

        {/* Flow */}
        <Route path="/checkpoints/token/:token" element={<CheckpointFlow />} />

        <Route path="/checkpoint/:token" element={<CheckpointFlow />} />

        {/* QR */}
        <Route path="/scan" element={<QRScannerPage />} />

        <Route path="/scan/:token" element={<ScanCheckpointPage />} />
      </Route>
    </Routes>
  );
}

export default App;