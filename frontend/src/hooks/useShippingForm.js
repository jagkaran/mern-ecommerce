import { useState } from "react";
import { validators } from "../utils/validators";

const initialValues = {
  firstName: "",
  lastName: "",
  address: "",
  phone: "",
  country: "",
  state: "",
  city: "",
  zip: "",
};

export const useShippingForm = (savedValues = {}) => {
  const [values, setValues] = useState({ ...initialValues, ...savedValues });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case "firstName": return validators.name(value, "First name");
      case "lastName":  return validators.name(value, "Last name");
      case "address":   return validators.minLength(value, 10, "Address");
      case "phone":     return validators.phone(value);
      case "country":   return validators.required(value, "Country");
      case "city":      return validators.minLength(value, 2, "City");
      case "zip":       return validators.zip(value);
      default:          return "";
    }
  };

  const handleChange = (name, e) => {
    const value = e.target.value;
    setValues((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateAll = () => {
    const requiredFields = Object.keys(initialValues).filter((k) => k !== "state");
    const newErrors = {};
    requiredFields.forEach((key) => {
      newErrors[key] = validateField(key, values[key]);
    });
    setErrors(newErrors);
    setTouched(
      Object.keys(initialValues).reduce((acc, k) => ({ ...acc, [k]: true }), {})
    );
    return Object.values(newErrors).every((e) => e === "");
  };

  const isValid = () =>
    Object.keys(initialValues)
      .filter((k) => k !== "state")
      .every((key) => validateField(key, values[key]) === "");

  return { values, errors, touched, handleChange, validateAll, isValid };
};
