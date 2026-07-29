import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { clearErrors, updateUserPassword } from "../../actions/userAction";
import { InputAdornment, IconButton, CircularProgress } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Seo from "../Seo";
import { usePassUpdateFormControls } from "../Admin/Hooks/usePassUpdateForm";

function UpdatePassword() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const history = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const [oldPass, setOldPass] = useState("");

  const { error, isUpdated, loading } = useSelector((state) => state.profile);
  const { isAuthenticated } = useSelector((state) => state.user);

  const { handleUpdatePassInputValue, updatePassFormIsValid, errors, updatePassFormValues } =
    usePassUpdateFormControls();

  const updatePassword = (event) => {
    event.preventDefault();
    if (updatePassFormIsValid()) {
      const data = new FormData(event.currentTarget);
      data.set("oldPassword", oldPass);
      data.set("newPassword", updatePassFormValues.newPassword);
      data.set("confirmPassword", updatePassFormValues.confirmPassword);
      dispatch(updateUserPassword(data));
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (isUpdated) {
      toast.success("Password Updated Successfully");
      history("/account", { replace: true });
      dispatch({ type: "UpdatePasswordReset" });
    }
  }, [dispatch, error, toast, history, isUpdated]);

  return (
    <>
      <Seo
        title="Wanna change your password? - Click.it Store"
        description="Wanna change your password? Don't worry, you can easily change to a new one"
        path="/password/update"
      />
      {loading ? (
        <div className="grid place-items-center" style={{ minHeight: "60vh" }}>
          <CircularProgress />
        </div>
      ) : isAuthenticated ? (
        <div style={{ padding: "32px 16px" }}>
          <Box
            sx={{
              maxWidth: "480px",
              margin: "0 auto",
              background: "#fff",
              borderRadius: "var(--t-border-radius-base)",
              padding: { xs: "20px", md: "32px" },
              boxShadow: "var(--t-shadow-sm)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, marginBottom: "24px" }}>
              <Avatar sx={{ bgcolor: "secondary.main", width: 40, height: 40 }}>
                <VisibilityOffIcon />
              </Avatar>
              <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
                Change Password
              </Typography>
            </Box>

            <Box component="form" noValidate onSubmit={updatePassword}>
              <Box sx={{ display: "grid", gap: "16px" }}>
                <PasswordField
                  id="oldPassword"
                  label="Old Password"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  show={showOldPassword}
                  onToggle={() => setShowOldPassword((v) => !v)}
                  autoComplete="old-password"
                />
                <PasswordField
                  id="newPassword"
                  label="New Password"
                  value={updatePassFormValues.newPassword}
                  onChange={handleUpdatePassInputValue}
                  error={errors.newPassword}
                  show={showNewPassword}
                  onToggle={() => setShowNewPassword((v) => !v)}
                  autoComplete="new-password"
                />
                <PasswordField
                  id="confirmPassword"
                  label="Confirm Password"
                  value={updatePassFormValues.confirmPassword}
                  onChange={handleUpdatePassInputValue}
                  error={errors.confirmPassword}
                  show={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((v) => !v)}
                  autoComplete="new-password"
                />
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ marginTop: "24px", padding: "12px", backgroundColor: "secondary.main" }}
                disabled={!updatePassFormIsValid()}
              >
                Update Password
              </Button>
            </Box>
          </Box>
        </div>
      ) : (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 16px",
          }}
        >
          <p
            style={{
              color: "var(--t-neutral-500)",
              fontStyle: "italic",
              fontSize: "1.125rem",
            }}
          >
            No changes to make right now.
          </p>
        </div>
      )}
    </>
  );
}

function PasswordField({ id, label, value, onChange, error, show, onToggle, autoComplete }) {
  return (
    <TextField
      required
      fullWidth
      id={id}
      name={id}
      label={label}
      type={show ? "text" : "password"}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      {...(error && { error: true, helperText: error })}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton aria-label="toggle password visibility" onClick={onToggle}>
              {show ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}

export default UpdatePassword;