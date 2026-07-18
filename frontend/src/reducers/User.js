import { createReducer } from "@reduxjs/toolkit";

const initialState = { user: {} };

export const userReducer = createReducer(initialState, (builder) => {
  builder
    .addCase("LoginUserRequest", (state) => {
      state.loading = true;
      state.isAuthenticated = false;
    })
    .addCase("LoginUserSuccess", (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
    })
    .addCase("LoginUserFailure", (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    })
    .addCase("RegisterUserRequest", (state) => {
      state.loading = true;
      state.isAuthenticated = false;
    })
    .addCase("RegisterUserSuccess", (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
    })
    .addCase("RegisterUserFailure", (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    })
    .addCase("LoadUserRequest", (state) => {
      state.loading = true;
      state.isAuthenticated = false;
    })
    .addCase("LoadUserSuccess", (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
    })
    .addCase("LoadUserFailure", (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    })
    .addCase("LogoutUserSuccess", (state) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
    })
    .addCase("LogoutUserFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("ClearErrors", (state) => {
      state.error = null;
    });
});

export const profileReducer = createReducer({}, (builder) => {
  builder
    .addCase("UpdateProfileRequest", (state) => {
      state.loading = true;
    })
    .addCase("UpdateProfileSuccess", (state, action) => {
      state.loading = false;
      state.isUpdated = action.payload;
    })
    .addCase("UpdateProfileFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("UpdateProfileReset", (state) => {
      state.isUpdated = false;
    })
    .addCase("UpdatePasswordRequest", (state) => {
      state.loading = true;
    })
    .addCase("UpdatePasswordSuccess", (state, action) => {
      state.loading = false;
      state.isUpdated = action.payload;
    })
    .addCase("UpdatePasswordFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("UpdatePasswordReset", (state) => {
      state.isUpdated = false;
    })
    .addCase("UpdateUserRequest", (state) => {
      state.loading = true;
    })
    .addCase("UpdateUserSuccess", (state, action) => {
      state.loading = false;
      state.isUpdated = action.payload;
    })
    .addCase("UpdateUserFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("UpdateUserReset", (state) => {
      state.isUpdated = false;
    })
    .addCase("DeleteUserRequest", (state) => {
      state.loading = true;
    })
    .addCase("DeleteUserSuccess", (state, action) => {
      state.loading = false;
      state.isDeleted = action.payload.success;
      state.message = action.payload.message;
    })
    .addCase("DeleteUserFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("DeleteUserReset", (state) => {
      state.isDeleted = false;
    })
    .addCase("ClearErrors", (state) => {
      state.error = null;
    });
});

export const forgotPasswordReducer = createReducer({}, (builder) => {
  builder
    .addCase("ForgotPasswordRequest", (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase("ForgotPasswordSuccess", (state, action) => {
      state.loading = false;
      state.message = action.payload;
    })
    .addCase("ForgotPasswordFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("ResetPasswordRequest", (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase("ResetPasswordSuccess", (state, action) => {
      state.loading = false;
      state.success = action.payload;
    })
    .addCase("ResetPasswordFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("ClearErrors", (state) => {
      state.error = null;
    });
});

export const allUsersReducer = createReducer({ users: [] }, (builder) => {
  builder
    .addCase("AllUsersRequest", (state) => {
      state.loading = true;
    })
    .addCase("AllUsersSuccess", (state, action) => {
      state.loading = false;
      state.users = action.payload.users;
      state.usersCount = action.payload.usersCount;
    })
    .addCase("AllUsersFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("ClearErrors", (state) => {
      state.error = null;
    });
});

export const userDetailsReducer = createReducer({ user: {} }, (builder) => {
  builder
    .addCase("UserDetailRequest", (state) => {
      state.loading = true;
    })
    .addCase("UserDetailSuccess", (state, action) => {
      state.loading = false;
      state.user = action.payload;
    })
    .addCase("UserDetailFailure", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("ClearErrors", (state) => {
      state.error = null;
    });
});
