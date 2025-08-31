import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("🏁 Starting React application...");
console.log("🔧 Environment:", import.meta.env.MODE);
console.log("🔧 Base URL:", import.meta.env.BASE_URL);

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element not found!");
  throw new Error("Root element with id 'root' not found in DOM");
}

console.log("✅ Root element found, creating React root...");

const root = createRoot(rootElement);
console.log("✅ React root created, rendering App...");

root.render(<App />);
console.log("✅ App rendered successfully!");
