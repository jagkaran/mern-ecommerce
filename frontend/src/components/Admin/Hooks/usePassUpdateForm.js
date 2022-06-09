import { useState } from "react";

const initialUpdatePassFormValues = {
  newPassword: "",
  confirmPassword: "",
};

export const usePassUpdateFormControls = () => {
  // We'll update "values" as the form updates

  const [updatePassFormValues, setUpdatePassFormValues] = useState(
    initialUpdatePassFormValues
  );

  // "errors" is used to check the form for errors
  const [errors, setErrors] = useState({});

  const validateUpdatePassForm = (
    updatePassFieldValues = updatePassFormValues
  ) => {
    // this function will check if the form values are valid
    let temp = { ...errors };

    if ("newPassword" in updatePassFieldValues) {
      temp.newPassword = updatePassFieldValues.newPassword
        ? ""
        : "New Password is required.";
      if (updatePassFieldValues.newPassword)
        temp.newPassword =
          /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/.test(
            updatePassFieldValues.newPassword
          )
            ? ""
            : "New Password must be atleast 6-16 digits long, has at least one number and at least one special character.";
    }

    if ("confirmPassword" in updatePassFieldValues) {
      temp.confirmPassword = updatePassFieldValues.confirmPassword
        ? ""
        : "Confirm Password is required.";

      if (updatePassFieldValues.confirmPassword)
        temp.confirmPassword =
          updatePassFormValues.newPassword ===
          updatePassFieldValues.confirmPassword
            ? ""
            : "New password and Confirm password must match.";
    }

    setErrors({
      ...temp,
    });
  };

  const handleUpdatePassInputValue = (e) => {
    // this function will be triggered by the text field's onBlur and onChange events
    const { name, value } = e.target;
    setUpdatePassFormValues({
      ...updatePassFormValues,
      [name]: value,
    });
    validateUpdatePassForm({ [name]: value });
  };

  const updatePassFormIsValid = (
    updatePassFieldValues = updatePassFormValues
  ) => {
    // this function will check if the form values and return a boolean value
    const isValid =
      updatePassFieldValues.newPassword &&
      updatePassFieldValues.confirmPassword &&
      Object.values(errors).every((x) => x === "");

    return isValid;
  };

  return {
    handleUpdatePassInputValue,
    updatePassFormIsValid,
    errors,
    updatePassFormValues,
  };
};
