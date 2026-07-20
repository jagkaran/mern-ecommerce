import "@testing-library/jest-dom";

// Mock react-helmet-async — tests don't need a real HelmetProvider wrapper
// and the runtime needs `window.matchMedia` etc. which jsdom doesn't supply.
vi.mock("react-helmet-async", () => {
  const React = require("react");
  const passthrough = ({ children }) => React.createElement(React.Fragment, null, children);
  return {
    Helmet: () => null,
    HelmetProvider: passthrough,
  };
});
