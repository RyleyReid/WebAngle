import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.scss";
import faviconUrl from "./assets/favicon.png";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error("Add VITE_CLERK_PUBLISHABLE_KEY to your .env file");
}

const link = document.createElement("link");
link.rel = "icon";
link.href = faviconUrl;
document.head.prepend(link);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
