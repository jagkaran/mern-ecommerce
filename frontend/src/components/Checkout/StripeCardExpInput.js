import React, { useRef, useImperativeHandle } from "react";

const StripeCardExpInput = React.forwardRef(
  function StripeCardExpInput({ component: Component, ...props }, ref) {
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

export default StripeCardExpInput;
