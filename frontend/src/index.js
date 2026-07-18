import React from "react";
import ReactDOM from "react-dom";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { Provider } from "react-redux";
import store from "./store";

// Toast rendering lives inside App (see <ToastHost />). No provider needed.

ReactDOM.render(
  <ErrorBoundary>
    <Provider store={store}>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </Provider>
  </ErrorBoundary>,
  document.getElementById("root")
);
