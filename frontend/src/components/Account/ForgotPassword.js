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
import { useEffect, useState } from "react";
import { useAlert } from "react-alert";
import { clearErrors, forgotUserPassword } from "../../actions/userAction";
import LockResetIcon from "@mui/icons-material/LockReset";
import Copyright from "../Copyright";
import Seo from "../Seo";

function ForgotPassword() {
  const dispatch = useDispatch();
  const alert = useAlert();

  const { error, message, loading } = useSelector(
    (state) => state.forgotPassword
  );

  const [email, setEmail] = useState("");

  const forgotPasswordSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("email", email);
    dispatch(forgotUserPassword(data));
  };

  useEffect(() => {
    if (error) {
      alert.error(error);
      dispatch(clearErrors());
    }
    if (message) {
      alert.success(message);
    }
  }, [dispatch, error, alert, message]);
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
              <Box
                component="form"
                onSubmit={forgotPasswordSubmit}
                noValidate
                sx={{ mt: 1 }}
              >
                <TextField
                  margin="normal"
                  required={true}
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, backgroundColor: "secondary.main" }}
                >
                  Send Email
                </Button>
              </Box>
            </Box>
          </Container>
          <Copyright />
        </>
      )}
    </>
  );
}

export default ForgotPassword;
