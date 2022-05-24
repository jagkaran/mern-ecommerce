import { createReducer } from "@reduxjs/toolkit";

const initialState = { user: {} };

export const userReducer = createReducer(initialState, {
  LoginUserRequest: (state) => {
    state.loading = true;
    state.isAuthenticated = false;
  },
  LoginUserSuccess: (state, action) => {
    state.loading = false;
    state.isAuthenticated = true;
    state.user = action.payload;
  },
  LoginUserFailure: (state, action) => {
    state.loading = false;
    state.isAuthenticated = false;
    state.user = null;
    state.error = action.payload;
  },
  RegisterUserRequest: (state) => {
    state.loading = true;
    state.isAuthenticated = false;
  },
  RegisterUserSuccess: (state, action) => {
    state.loading = false;
    state.isAuthenticated = true;
    state.user = action.payload;
  },
  RegisterUserFailure: (state, action) => {
    state.loading = false;
    state.isAuthenticated = false;
    state.user = null;
    state.error = action.payload;
  },
  LoadUserRequest: (state) => {
    state.loading = true;
    state.isAuthenticated = false;
  },
  LoadUserSuccess: (state, action) => {
    state.loading = false;
    state.isAuthenticated = true;
    state.user = action.payload;
  },
  LoadUserFailure: (state, action) => {
    state.loading = false;
    state.isAuthenticated = false;
    state.user = null;
    state.error = action.payload;
  },
  LogoutUserSuccess: (state, action) => {
    state.loading = false;
    state.isAuthenticated = false;
    state.user = null;
  },
  LogoutUserFailure: (state, action) => {
    state.loading = false;
    state.error = action.payload;
  },
  ClearErrors: (state) => {
    state.error = null;
  },
});

export const profileReducer = createReducer(
  {},
  {
    UpdateProfileRequest: (state) => {
      state.loading = true;
    },
    UpdateProfileSuccess: (state, action) => {
      state.loading = false;
      state.isUpdated = action.payload;
    },
    UpdateProfileFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    UpdateProfileReset: (state) => {
      state.isUpdated = false;
    },
    UpdatePasswordRequest: (state) => {
      state.loading = true;
    },
    UpdatePasswordSuccess: (state, action) => {
      state.loading = false;
      state.isUpdated = action.payload;
    },
    UpdatePasswordFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    UpdatePasswordReset: (state) => {
      state.isUpdated = false;
    },
    UpdateUserRequest: (state) => {
      state.loading = true;
    },
    UpdateUserSuccess: (state, action) => {
      state.loading = false;
      state.isUpdated = action.payload;
    },
    UpdateUserFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    UpdateUserReset: (state) => {
      state.isUpdated = false;
    },
    DeleteUserRequest: (state) => {
      state.loading = true;
    },
    DeleteUserSuccess: (state, action) => {
      state.loading = false;
      state.isDeleted = action.payload.success;
      state.message = action.payload.message;
    },
    DeleteUserFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    DeleteUserReset: (state) => {
      state.isDeleted = false;
    },
    ClearErrors: (state) => {
      state.error = null;
    },
  }
);

export const forgotPasswordReducer = createReducer(
  {},
  {
    ForgotPasswordRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    ForgotPasswordSuccess: (state, action) => {
      state.loading = false;
      state.message = action.payload;
    },
    ForgotPasswordFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    ResetPasswordRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    ResetPasswordSuccess: (state, action) => {
      state.loading = false;
      state.success = action.payload;
    },
    ResetPasswordFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    ClearErrors: (state) => {
      state.error = null;
    },
  }
);

export const allUsersReducer = createReducer(
  { users: [] },
  {
    AllUsersRequest: (state) => {
      state.loading = true;
    },
    AllUsersSuccess: (state, action) => {
      state.loading = false;
      state.users = action.payload.users;
      state.usersCount = action.payload.usersCount;
    },
    AllUsersFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    ClearErrors: (state) => {
      state.error = null;
    },
  }
);

export const userDetailsReducer = createReducer(
  { user: {} },
  {
    UserDetailRequest: (state) => {
      state.loading = true;
    },
    UserDetailSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload;
    },
    UserDetailFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    ClearErrors: (state) => {
      state.error = null;
    },
  }
);
