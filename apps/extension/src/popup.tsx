import { useState } from "react";

function IndexPopup() {
  const [status, setStatus] = useState("idle");

  const triggerCapture = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    setStatus("capture_requested");
    await chrome.tabs.sendMessage(tab.id, { type: "LANGSYNC_TRIGGER_CAPTURE" });
  };

  return (
    <main style={{ padding: 12, minWidth: 280, fontFamily: "sans-serif" }}>
      <h3>LangSync Pulse</h3>
      <button onClick={triggerCapture}>Capture current response</button>
      <p>Status: {status}</p>
    </main>
  );
}

export default IndexPopup;
