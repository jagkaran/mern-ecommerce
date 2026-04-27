import { useState } from "react";
import { validators } from "../utils/validators";

const initialValues = {
  name: "",
  price: "",
  description: "",
  category: "",
  stock: "",
};

const CATEGORIES = [
  "Electronics",
  "Cameras",
  "Laptops",
  "Accessories",
  "Headphones",
  "Food",
  "Books",
  "Clothes/Shoes",
  "Beauty/Health",
  "Sports",
  "Outdoor",
  "Home",
];

export { CATEGORIES };

export const useProductForm = (savedValues = {}) => {
  const [values, setValues] = useState({ ...initialValues, ...savedValues });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        return validators.minLength(value, 3, "Product name");
      case "price":
        return validators.positiveNumber(value, "Price");
      case "description":
        return validators.minLength(value, 20, "Description");
      case "category":
        return validators.required(value, "Category");
      case "stock":
        return validators.nonNegativeInt(value, "Stock");
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateAll = () => {
    const newErrors = {};
    Object.keys(initialValues).forEach((key) => {
      newErrors[key] = validateField(key, values[key]);
    });
    setErrors(newErrors);
    setTouched(Object.keys(initialValues).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    return Object.values(newErrors).every((e) => e === "");
  };

  const isValid = () =>
    Object.keys(initialValues).every((key) => validateField(key, values[key]) === "");

  const fieldProps = (name) => ({
    error: Boolean(touched[name] && errors[name]),
    helperText: touched[name] && errors[name] ? errors[name] : " ",
    onBlur: handleBlur,
  });

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    isValid,
    fieldProps,
    setValues,
  };
};
