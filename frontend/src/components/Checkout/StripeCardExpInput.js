import React, { useRef, useImperativeHandle } from "react";

function StripeCardExpInput({ component: Component, inputRef, ...props }) {
  const elementRef = useRef();
  useImperativeHandle(inputRef, () => ({
    focus: () => elementRef.current.focus,
  }));
  return (
    <Component
      onReady={(element) => (elementRef.current = element)}
      {...props}
    />
  );
}

export default StripeCardExpInput;
