import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import { Provider } from "react-redux";
import store from "./store";

// Toast rendering lives inside App (see <ToastHost />). No provider needed.

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <ErrorBoundary>
    <Provider store={store}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </Provider>
  </ErrorBoundary>
);
