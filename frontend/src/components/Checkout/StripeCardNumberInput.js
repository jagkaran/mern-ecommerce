import React, { useRef, useImperativeHandle } from "react";

// MUI's inputComponent prop requires a ref-forwarding component.
// Without forwardRef, MUI can't attach its ref and throws:
// "Expected valid input target. Did you use a custom inputComponent and forget to forward refs?"
const StripeCardNumberInput = React.forwardRef(
  function StripeCardNumberInput({ component: Component, ...props }, ref) {
    const elementRef = useRef();

    useImperativeHandle(ref, () => ({
      focus: () => elementRef.current && elementRef.current.focus(),
    }));

    return (
      <Component
        onReady={(element) => (elementRef.current = element)}
        {...props}
      />
    );
  }
);

export default StripeCardNumberInput;
