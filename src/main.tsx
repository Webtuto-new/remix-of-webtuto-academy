import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Always start at the top — disable browser scroll restoration on reload
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

createRoot(document.getElementById("root")!).render(<App />);
