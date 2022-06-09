import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import KeyIcon from "@mui/icons-material/Key";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Copyright from "../Copyright";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAlert } from "react-alert";
import { clearErrors, updateUserPassword } from "../../actions/userAction";
import { InputAdornment, IconButton, CircularProgress } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmptyCart from "../EmptyCart";
import Seo from "../Seo";
import { usePassUpdateFormControls } from "../Admin/Hooks/usePassUpdateForm";

function UpdatePassword() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const handleClickShowOldPassword = () => setShowOldPassword(!showOldPassword);
  const handleMouseDownOldPassword = () => setShowOldPassword(!showOldPassword);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const handleClickShowNewPassword = () => setShowNewPassword(!showNewPassword);
  const handleMouseDownNewPassword = () => setShowNewPassword(!showNewPassword);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const handleClickShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);
  const handleMouseDownConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);
  const history = useNavigate();
  const dispatch = useDispatch();
  const alert = useAlert();
  const [oldPass, setOldPass] = useState("");
  // const [newPass, setNewPass] = useState("");
  // const [confirmPass, setConfirmPass] = useState("");
  const { error, isUpdated, loading } = useSelector((state) => state.profile);
  const { isAuthenticated } = useSelector((state) => state.user);
  // const isEnabled =
  //   oldPass.length > 0 && newPass.length > 0 && confirmPass.length > 0;

  const {
    handleUpdatePassInputValue,
    updatePassFormIsValid,
    errors,
    updatePassFormValues,
  } = usePassUpdateFormControls();

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
      alert.error(error);
      dispatch(clearErrors());
    }
    if (isUpdated) {
      alert.success("Password Updated Successfully");
      history("/account", { replace: true });
      dispatch({
        type: "UpdatePasswordReset",
      });
    }
  }, [dispatch, error, alert, history, isUpdated]);

  return (
    <>
      <Seo
        title="Wanna change your password? - Click.it Store"
        description="Wanna change your password? Don't worry, you can easily change to a new one"
        path="/password/update"
      />
      {loading ? (
        <div className="grid place-items-center h-screen">
          <CircularProgress />
        </div>
      ) : (
        <>
          {isAuthenticated ? (
            <div>
              <Container component="main" maxWidth="xs">
                <CssBaseline />
                <Box
                  sx={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
                    <KeyIcon />
                  </Avatar>
                  <Typography component="h1" variant="h5">
                    Change Password
                  </Typography>
                  <Box
                    component="form"
                    noValidate
                    onSubmit={updatePassword}
                    sx={{ mt: 3 }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          required
                          fullWidth
                          name="oldPassword"
                          label="Old Password"
                          type={showOldPassword ? "text" : "password"}
                          id="oldPassword"
                          autoComplete="old-password"
                          value={oldPass}
                          onChange={(e) => setOldPass(e.target.value)}
                          InputProps={{
                            // <-- This is where the toggle button is added.
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={handleClickShowOldPassword}
                                  onMouseDown={handleMouseDownOldPassword}
                                >
                                  {showOldPassword ? (
                                    <VisibilityIcon />
                                  ) : (
                                    <VisibilityOffIcon />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          required
                          fullWidth
                          name="newPassword"
                          label="New Password"
                          type={showNewPassword ? "text" : "password"}
                          id="newPassword"
                          autoComplete="new-password"
                          value={updatePassFormValues.newPassword}
                          onChange={handleUpdatePassInputValue}
                          {...(errors.newPassword && {
                            error: true,
                            helperText: errors.newPassword,
                          })}
                          InputProps={{
                            // <-- This is where the toggle button is added.
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={handleClickShowNewPassword}
                                  onMouseDown={handleMouseDownNewPassword}
                                >
                                  {showNewPassword ? (
                                    <VisibilityIcon />
                                  ) : (
                                    <VisibilityOffIcon />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          required
                          fullWidth
                          name="confirmPassword"
                          label="Confirm Password"
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          autoComplete="confirm-password"
                          value={updatePassFormValues.confirmPassword}
                          onChange={handleUpdatePassInputValue}
                          {...(errors.confirmPassword && {
                            error: true,
                            helperText: errors.confirmPassword,
                          })}
                          InputProps={{
                            // <-- This is where the toggle button is added.
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={handleClickShowConfirmPassword}
                                  onMouseDown={handleMouseDownConfirmPassword}
                                >
                                  {showConfirmPassword ? (
                                    <VisibilityIcon />
                                  ) : (
                                    <VisibilityOffIcon />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2, backgroundColor: "secondary.main" }}
                      disabled={!updatePassFormIsValid()}
                    >
                      Update Password
                    </Button>
                  </Box>
                </Box>
              </Container>
              <Copyright />
            </div>
          ) : (
            <EmptyCart />
          )}
        </>
      )}
    </>
  );
}

export default UpdatePassword;
