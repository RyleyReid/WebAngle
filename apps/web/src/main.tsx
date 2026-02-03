import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.scss";
import faviconUrl from "./assets/favicon.png";

const link = document.createElement("link");
link.rel = "icon";
link.href = faviconUrl;
document.head.prepend(link);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
