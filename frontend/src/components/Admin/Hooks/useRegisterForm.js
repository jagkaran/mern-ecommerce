import { useState } from "react";

const initialRegisterFormValues = {
  name: "",
  email: "",
  password: "",
};

export const useRegisterFormControls = () => {
  // We'll update "values" as the form updates

  const [registerFormvalues, setRegisterFormValues] = useState(
    initialRegisterFormValues
  );

  // "errors" is used to check the form for errors
  const [errors, setErrors] = useState({});

  const validateRegisterForm = (registerFieldvalues = registerFormvalues) => {
    // this function will check if the form values are valid
    let temp = { ...errors };

    if ("name" in registerFieldvalues)
      temp.name = registerFieldvalues.name ? "" : "User name is required.";

    if ("email" in registerFieldvalues) {
      temp.email = registerFieldvalues.email ? "" : "Email is required.";
      if (registerFieldvalues.email)
        temp.email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(
          registerFieldvalues.email
        )
          ? ""
          : "Email is not valid.";
    }

    if ("password" in registerFieldvalues) {
      temp.password = registerFieldvalues.password
        ? ""
        : "Password is required.";
      if (registerFieldvalues.password)
        temp.password =
          /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(
            registerFieldvalues.password
          )
            ? ""
            : "Password must be atleast 6-16 digits long, has at least one number and at least one special character.";
    }

    setErrors({
      ...temp,
    });
  };

  const handleRegisterInputValue = (e) => {
    // this function will be triggered by the text field's onBlur and onChange events
    const { name, value } = e.target;
    setRegisterFormValues({
      ...registerFormvalues,
      [name]: value,
    });
    validateRegisterForm({ [name]: value });
  };

  const registerFormIsValid = (registerFieldvalues = registerFormvalues) => {
    // this function will check if the form values and return a boolean value
    const isValid =
      registerFieldvalues.name &&
      registerFieldvalues.email &&
      registerFieldvalues.password &&
      Object.values(errors).every((x) => x === "");

    return isValid;
  };

  return {
    handleRegisterInputValue,
    registerFormIsValid,
    errors,
    registerFormvalues,
  };
};
