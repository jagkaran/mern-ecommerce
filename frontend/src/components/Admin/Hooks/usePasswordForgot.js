import { useState } from "react";

const initialPassForgotFormValues = {
  email: "",
};

export const usePassForgotFormControls = () => {
  // We'll update "values" as the form updates

  const [passForgotFormValues, setPassForgotFormValues] = useState(
    initialPassForgotFormValues
  );

  // "errors" is used to check the form for errors
  const [errors, setErrors] = useState({});

  const validatePassForgotForm = (
    passForgotFieldvalues = passForgotFormValues
  ) => {
    // this function will check if the form values are valid
    let temp = { ...errors };

    if ("email" in passForgotFieldvalues) {
      temp.email = passForgotFieldvalues.email ? "" : "Email is required.";
      if (passForgotFieldvalues.email)
        temp.email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(
          passForgotFieldvalues.email
        )
          ? ""
          : "Email is not valid.";
    }

    setErrors({
      ...temp,
    });
  };

  const handlePassForgotInputValue = (e) => {
    // this function will be triggered by the text field's onBlur and onChange events
    const { name, value } = e.target;
    setPassForgotFormValues({
      ...passForgotFormValues,
      [name]: value,
    });
    validatePassForgotForm({ [name]: value });
  };

  const passForgotFormIsValid = (
    passForgotFieldvalues = passForgotFormValues
  ) => {
    // this function will check if the form values and return a boolean value
    const isValid =
      passForgotFieldvalues.email &&
      Object.values(errors).every((x) => x === "");

    return isValid;
  };

  return {
    handlePassForgotInputValue,
    passForgotFormIsValid,
    errors,
    passForgotFormValues,
  };
};
