import { useState } from "react";

const initialAccountFormValues = {
  name: "",
  email: "",
};

export const useAcountFormControls = () => {
  // We'll update "values" as the form updates

  const [accountFormValues, setAcountFormValues] = useState(
    initialAccountFormValues
  );

  // "errors" is used to check the form for errors
  const [errors, setErrors] = useState({});

  const validateRegisterForm = (accountFieldvalues = accountFormValues) => {
    // this function will check if the form values are valid
    let temp = { ...errors };

    if ("name" in accountFieldvalues)
      temp.name = accountFieldvalues.name ? "" : "User name is required.";

    if ("email" in accountFieldvalues) {
      temp.email = accountFieldvalues.email ? "" : "Email is required.";
      if (accountFieldvalues.email)
        temp.email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(accountFieldvalues.email)
          ? ""
          : "Email is not valid.";
    }

    setErrors({
      ...temp,
    });
  };

  const handleAccountInputValue = (e) => {
    // this function will be triggered by the text field's onBlur and onChange events
    const { name, value } = e.target;
    setAcountFormValues({
      ...accountFormValues,
      [name]: value,
    });
    validateRegisterForm({ [name]: value });
  };

  const accountFormIsValid = (accountFieldvalues = accountFormValues) => {
    // this function will check if the form values and return a boolean value
    const isValid =
      accountFieldvalues.name &&
      accountFieldvalues.email &&
      Object.values(errors).every((x) => x === "");

    return isValid;
  };

  return {
    handleAccountInputValue,
    accountFormIsValid,
    errors,
    setAcountFormValues,
    accountFormValues,
  };
};
