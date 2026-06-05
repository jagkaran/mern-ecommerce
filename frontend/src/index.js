import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { Provider } from "react-redux";
import store from "./store";
import { positions, transitions, Provider as AlertProvider } from "react-alert";
import AlertTemplate from "react-alert-template-basic";

const options = {
  position: positions.BOTTOM_CENTER,
  timeout: 3000,
  transition: transitions.SCALE,
};

// store.dispatch(loadUser());

ReactDOM.render(
  <ErrorBoundary>
    <Provider store={store}>
      <AlertProvider template={AlertTemplate} {...options}>
        <App />
      </AlertProvider>
    </Provider>
  </ErrorBoundary>,
  document.getElementById("root")
);
