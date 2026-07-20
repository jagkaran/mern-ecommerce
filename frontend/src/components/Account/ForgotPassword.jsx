import {
  Box,
  Container,
  Typography,
  TextField,
  Avatar,
  Button,
  CircularProgress,
  CssBaseline,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { useToast } from "../../hooks/useToast";
import { clearErrors, forgotUserPassword } from "../../actions/userAction";
import LockResetIcon from "@mui/icons-material/LockReset";
import Seo from "../Seo";
import { usePassForgotFormControls } from "../Admin/Hooks/usePasswordForgot";

function ForgotPassword() {
  const dispatch = useDispatch();
  const toast = useToast();

  const { error, message, loading } = useSelector((state) => state.forgotPassword);

  const { handlePassForgotInputValue, passForgotFormIsValid, errors, passForgotFormValues } =
    usePassForgotFormControls();

  const forgotPasswordSubmit = (event) => {
    event.preventDefault();
    if (passForgotFormIsValid()) {
      const data = new FormData(event.currentTarget);
      data.set("email", passForgotFormValues.email);
      dispatch(forgotUserPassword(data));
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (message) {
      toast.success(message);
    }
  }, [dispatch, error, toast, message]);

  return (
    <>
      <Seo
        title="Forgot Password? - Click.it Store"
        description="Forgot Password? Don't worry, you can easily reset to a new one"
        path="/password/forgot"
      />
      {loading ? (
        <div className="grid place-items-center h-screen">
          <CircularProgress />
        </div>
      ) : (
        <>
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
                <LockResetIcon />
              </Avatar>
              <Typography component="h1" variant="h5">
                Forgot Password?
              </Typography>
              <Box component="form" onSubmit={forgotPasswordSubmit} noValidate sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required={true}
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={passForgotFormValues.email}
                  onChange={handlePassForgotInputValue}
                  {...(errors.email && {
                    error: true,
                    helperText: errors.email,
                  })}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, backgroundColor: "secondary.main" }}
                  disabled={!passForgotFormIsValid()}
                >
                  Send Email
                </Button>
              </Box>
            </Box>
          </Container>
        </>
      )}
    </>
  );
}

export default ForgotPassword;
