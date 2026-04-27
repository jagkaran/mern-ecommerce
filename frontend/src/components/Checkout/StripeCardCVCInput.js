import React, { useRef, useImperativeHandle } from "react";

const StripeCardCVCInput = React.forwardRef(
  function StripeCardCVCInput({ component: Component, ...props }, ref) {
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

export default StripeCardCVCInput;
