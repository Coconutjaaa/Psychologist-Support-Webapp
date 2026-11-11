import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { appName } from "./config";
import "./index.css";

document.title = appName;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
