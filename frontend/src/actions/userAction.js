import axios from "axios";

export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({
      type: "LoginUserRequest",
    });

    const config = { headers: { "Content-Type": "application/json" } };

    const { data } = await axios.post(
      `/api/v1/login`,
      { email, password },
      config
    );

    dispatch({
      type: "LoginUserSuccess",
      payload: data.user,
    });
  } catch (error) {
    dispatch({
      type: "LoginUserFailure",
      payload: error.response.data.message,
    });
  }
};

export const register = (userData) => async (dispatch) => {
  try {
    dispatch({
      type: "RegisterUserRequest",
    });

    const config = { headers: { "Content-Type": "application/json" } };

    const { data } = await axios.post(`/api/v1/register`, userData, config);

    dispatch({
      type: "RegisterUserSuccess",
      payload: data.user,
    });
  } catch (error) {
    dispatch({
      type: "RegisterUserFailure",
      payload: error.response.data.message,
    });
  }
};

export const loadUser = () => async (dispatch) => {
  try {
    dispatch({
      type: "LoadUserRequest",
    });

    const { data } = await axios.get(`/api/v1/me`);

    dispatch({
      type: "LoadUserSuccess",
      payload: data.user,
    });
  } catch (error) {
    dispatch({
      type: "LoadUserFailure",
      payload: error.response.data.message,
    });
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    await axios.get(`/api/v1/logout`);

    dispatch({
      type: "LogoutUserSuccess",
    });
  } catch (error) {
    dispatch({
      type: "LogoutUserFailure",
      payload: error.response.data.message,
    });
  }
};

export const updateUserProfile = (userData) => async (dispatch) => {
  try {
    dispatch({
      type: "UpdateProfileRequest",
    });

    const config = { headers: { "Content-Type": "application/json" } };

    const { data } = await axios.put(`/api/v1/me/update`, userData, config);

    dispatch({
      type: "UpdateProfileSuccess",
      payload: data.success,
    });
  } catch (error) {
    dispatch({
      type: "UpdateProfileFailure",
      payload: error.response.data.message,
    });
  }
};

//Update user password
export const updateUserPassword = (password) => async (dispatch) => {
  try {
    dispatch({
      type: "UpdatePasswordRequest",
    });

    const config = { headers: { "Content-Type": "application/json" } };

    const { data } = await axios.put(
      `/api/v1/password/update`,
      password,
      config
    );

    dispatch({
      type: "UpdatePasswordSuccess",
      payload: data.success,
    });
  } catch (error) {
    dispatch({
      type: "UpdatePasswordFailure",
      payload: error.response.data.message,
    });
  }
};

export const forgotUserPassword = (email) => async (dispatch) => {
  try {
    dispatch({
      type: "ForgotPasswordRequest",
    });

    const config = { headers: { "Content-Type": "application/json" } };

    const { data } = await axios.post(`/api/v1/password/forgot`, email, config);

    dispatch({
      type: "ForgotPasswordSuccess",
      payload: data.message,
    });
  } catch (error) {
    dispatch({
      type: "ForgotPasswordFailure",
      payload: error.response.data.message,
    });
  }
};

export const resetUserPassword = (token, password) => async (dispatch) => {
  try {
    dispatch({
      type: "ResetPasswordRequest",
    });

    const config = { headers: { "Content-Type": "application/json" } };

    const { data } = await axios.put(
      `/api/v1/password/reset/${token}`,
      password,
      config
    );

    dispatch({
      type: "ResetPasswordSuccess",
      payload: data.success,
    });
  } catch (error) {
    dispatch({
      type: "ResetPasswordFailure",
      payload: error.response.data.message,
    });
  }
};

// get All Users -- ADMIN ONLY
export const getAllUsers = () => async (dispatch) => {
  try {
    dispatch({ type: "AllUsersRequest" });
    const { data } = await axios.get(`/api/v1/admin/users`);

    dispatch({ type: "AllUsersSuccess", payload: data });
  } catch (error) {
    dispatch({ type: "AllUsersFailure", payload: error.response.data.message });
  }
};

// get  User Details -- ADMIN ONLY
export const getUserDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: "UserDetailRequest" });
    const { data } = await axios.get(`/api/v1/admin/user/${id}`);

    dispatch({ type: "UserDetailSuccess", payload: data.user });
  } catch (error) {
    dispatch({
      type: "UserDetailFailure",
      payload: error.response.data.message,
    });
  }
};

// Update User -- ADMIN ONLY
export const updateUser = (id, userData) => async (dispatch) => {
  try {
    dispatch({ type: "UpdateUserRequest" });

    const config = { headers: { "Content-Type": "application/json" } };

    const { data } = await axios.put(
      `/api/v1/admin/user/${id}`,
      userData,
      config
    );

    dispatch({ type: "UpdateUserSuccess", payload: data.success });
  } catch (error) {
    dispatch({
      type: "UpdateUserFailure",
      payload: error.response.data.message,
    });
  }
};

// Delete User -- ADMIN ONLY
export const deleteUser = (id) => async (dispatch) => {
  try {
    dispatch({ type: "DeleteUserRequest" });

    const { data } = await axios.delete(`/api/v1/admin/user/${id}`);

    dispatch({ type: "DeleteUserSuccess", payload: data });
  } catch (error) {
    dispatch({
      type: "DeleteUserFailure",
      payload: error.response.data.message,
    });
  }
};

// Clearing Errors
export const clearErrors = () => async (dispatch) => {
  dispatch({
    type: "ClearErrors",
  });
};
