import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Copyright from "../Copyright";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearErrors, login } from "../../actions/userAction";
import { useAlert } from "react-alert";
import { CircularProgress } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import LoginIcon from "@mui/icons-material/Login";
import { InputAdornment, IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Seo from "../Seo";
import { useLoginFormControls } from "../Admin/Hooks/useLoginForm";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = () => setShowPassword(!showPassword);
  const dispatch = useDispatch();
  const alert = useAlert();
  const history = useNavigate();
  // const [loginEmail, setLoginEmail] = useState("");
  // const [loginPassword, setLoginPassword] = useState("");
  const location = useLocation();

  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.user
  );

  const { handleLoginInputValue, loginFormIsValid, errors, loginFormvalues } =
    useLoginFormControls();

  // const isEnabled = loginEmail.length > 0 && loginPassword.length > 0;

  const loginSubmit = (event) => {
    event.preventDefault();
    if (loginFormIsValid()) {
      dispatch(login(loginFormvalues.email, loginFormvalues.password));
    }
  };

  const redirect = location.search ? location.search.split("=")[1] : "account";

  useEffect(() => {
    if (error) {
      alert.error(error);
      dispatch(clearErrors());
    }
    if (isAuthenticated) {
      history(`/${redirect}`);
      window.location.reload();
    }
  }, [error, alert, history, redirect, isAuthenticated, dispatch]);

  return (
    <>
      <Seo
        title="Login - Click.it Store"
        description="Login to shop amazing products on Click.it Store"
        path="/signin"
      />
      {loading ? (
        <div className="grid place-items-center">
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
                <LoginIcon />
              </Avatar>
              <Typography component="h1" variant="h5">
                Sign in
              </Typography>
              <Box
                component="form"
                onSubmit={loginSubmit}
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
                  value={loginFormvalues.email}
                  onChange={handleLoginInputValue}
                  {...(errors.email && {
                    error: true,
                    helperText: errors.email,
                  })}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  value={loginFormvalues.password}
                  onChange={handleLoginInputValue}
                  {...(errors.password && {
                    error: true,
                    helperText: errors.password,
                  })}
                  InputProps={{
                    // <-- This is where the toggle button is added.
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                        >
                          {showPassword ? (
                            <VisibilityIcon />
                          ) : (
                            <VisibilityOffIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, backgroundColor: "secondary.main" }}
                  disabled={!loginFormIsValid()}
                >
                  Sign In
                </Button>
                <Grid container>
                  <Grid item xs>
                    <Link href="/password/forgot" variant="body2">
                      Forgot password?
                    </Link>
                  </Grid>
                  <Grid item>
                    <Link href="/signup" variant="body2">
                      {"Don't have an account? Sign Up"}
                    </Link>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Container>
          <Copyright />
        </>
      )}
    </>
  );
}

export default Login;
