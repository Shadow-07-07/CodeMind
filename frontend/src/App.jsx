import { useEffect, useState } from "react";
import { checkHealth, resetIndex } from "./api";
import Chat from "./components/Chat";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [lastUpload, setLastUpload] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePrompt, setActivePrompt] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    async function checkSystemHealth() {
      try {
        const health = await checkHealth();
        if (health.has_indexed_documents) {
          setIsReady(true);
        }
      } catch {
        // Backend not yet reachable or starting up
      }
    }
    checkSystemHealth();
  }, []);

  function handleIndexed(result) {
    setLastUpload(result);
    setIsReady(Boolean(result));
  }

  async function handleClearIndex() {
    if (!window.confirm("Are you sure you want to clear the vector index? All indexed chunks will be deleted.")) {
      return;
    }
    setIsClearing(true);
    try {
      await resetIndex();
      setLastUpload(null);
      setIsReady(false);
    } catch (err) {
      alert("Failed to reset vector index: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsClearing(false);
    }
  }

  function handleSelectPrompt(promptText) {
    setActivePrompt(promptText);
    setSidebarOpen(false); // Close sidebar on mobile after selecting prompt
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ink text-slate-100">
      {/* Top Navbar */}
      <Navbar
        isReady={isReady}
        indexedSummary={lastUpload}
        onClearIndex={handleClearIndex}
        onResetChat={() => setActivePrompt("")}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isClearing={isClearing}
      />

      {/* Main 2-Column Split Workspace */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-10 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          isReady={isReady}
          indexedSummary={lastUpload}
          onIndexed={handleIndexed}
          onSelectPrompt={handleSelectPrompt}
          onClearIndex={handleClearIndex}
          isClearing={isClearing}
        />

        {/* Center / Chat Workspace */}
        <Chat
          indexedSummary={lastUpload}
          isReady={isReady}
          activePrompt={activePrompt}
          onPromptConsumed={() => setActivePrompt("")}
        />
      </div>
    </div>
  );
}
