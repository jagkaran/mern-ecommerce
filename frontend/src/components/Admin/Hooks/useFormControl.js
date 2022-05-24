import { useState } from "react";

const initialFormValues = {
  name: "",
  price: 0,
  description: "",
  category: "",
  stock: 0,
};

export const useFormControls = () => {
  // We'll update "values" as the form updates
  const [values, setValues] = useState(initialFormValues);

  // "errors" is used to check the form for errors
  const [errors, setErrors] = useState({});

  const validate = (fieldValues = values) => {
    // this function will check if the form values are valid
    let temp = { ...errors };
    if ("name" in fieldValues)
      temp.name = fieldValues.name ? "" : "Product name is required.";

    if ("price" in fieldValues)
      temp.price = fieldValues.price ? "" : "Product price is required.";

    if ("description" in fieldValues)
      temp.description = fieldValues.description
        ? ""
        : "Product description is required.";

    if ("category" in fieldValues)
      temp.category =
        fieldValues.category.length !== 0 ? "" : "Please select a category.";
    if ("stock" in fieldValues)
      temp.stock = fieldValues.stock ? "" : "Product stock is required.";

    // if ("email" in fieldValues) {
    //   temp.email = fieldValues.email ? "" : "This field is required.";
    //   if (fieldValues.email)
    //     temp.email = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fieldValues.email)
    //       ? ""
    //       : "Email is not valid.";
    // }

    setErrors({
      ...temp,
    });
  };

  const handleInputValue = (e) => {
    // this function will be triggered by the text field's onBlur and onChange events
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
    validate({ [name]: value });
  };

  const formIsValid = (fieldValues = values) => {
    // this function will check if the form values and return a boolean value
    const isValid =
      fieldValues.name &&
      fieldValues.price &&
      fieldValues.description &&
      fieldValues.category &&
      fieldValues.stock &&
      Object.values(errors).every((x) => x === "");

    return isValid;
  };

  return {
    handleInputValue,
    formIsValid,
    errors,
    values,
    setValues,
  };
};
