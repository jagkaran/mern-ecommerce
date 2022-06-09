import { useState } from "react";

const initialLoginFormValues = {
  email: "",
  password: "",
};

export const useLoginFormControls = () => {
  // We'll update "values" as the form updates

  const [loginFormvalues, setLoginFormValues] = useState(
    initialLoginFormValues
  );

  // "errors" is used to check the form for errors
  const [errors, setErrors] = useState({});

  const validateLoginForm = (loginFieldvalues = loginFormvalues) => {
    // this function will check if the form values are valid
    let temp = { ...errors };

    if ("email" in loginFieldvalues) {
      temp.email = loginFieldvalues.email ? "" : "Email is required.";
      if (loginFieldvalues.email)
        temp.email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(loginFieldvalues.email)
          ? ""
          : "Email is not valid.";
    }

    if ("password" in loginFieldvalues) {
      temp.password = loginFieldvalues.password ? "" : "Password is required.";
      if (loginFieldvalues.password)
        temp.password =
          /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(
            loginFieldvalues.password
          )
            ? ""
            : "Password must be atleast 6-16 digits long, has at least one number and at least one special character.";
    }

    setErrors({
      ...temp,
    });
  };

  const handleLoginInputValue = (e) => {
    // this function will be triggered by the text field's onBlur and onChange events
    const { name, value } = e.target;
    setLoginFormValues({
      ...loginFormvalues,
      [name]: value,
    });
    validateLoginForm({ [name]: value });
  };

  const loginFormIsValid = (loginFieldvalues = loginFormvalues) => {
    // this function will check if the form values and return a boolean value
    const isValid =
      loginFieldvalues.email &&
      loginFieldvalues.password &&
      Object.values(errors).every((x) => x === "");

    return isValid;
  };

  return {
    handleLoginInputValue,
    loginFormIsValid,
    errors,
    loginFormvalues,
  };
};
