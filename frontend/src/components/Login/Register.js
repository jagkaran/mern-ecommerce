import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import Copyright from "../Copyright";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAlert } from "react-alert";
import { register } from "../../actions/userAction";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import { InputAdornment, IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Seo from "../Seo";
import { useRegisterFormControls } from "../Admin/Hooks/useRegisterForm";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = () => setShowPassword(!showPassword);
  const history = useNavigate();
  const alert = useAlert();
  // const [user, setUser] = useState({
  //   name: "",
  //   email: "",
  //   password: "",
  // });
  const dispatch = useDispatch();
  // const { name, email, password } = user;

  const [avatar, setAvatar] = useState();

  const [avatarPreview, setAvatarPreview] = useState("/Profile.png");

  const { error, isAuthenticated } = useSelector((state) => state.user);

  const {
    handleRegisterInputValue,
    registerFormIsValid,
    errors,
    registerFormvalues,
  } = useRegisterFormControls();

  // const isEnabled = name.length > 0 && email.length > 0 && password.length > 0;

  const registerSubmit = (event) => {
    event.preventDefault();

    if (registerFormIsValid()) {
      const data = new FormData();

      data.set("name", registerFormvalues.name);
      data.set("email", registerFormvalues.email);
      data.set("password", registerFormvalues.password);
      data.set("avatar", avatar);
      dispatch(register(data));

      history("/account", { replace: true });
    }
  };

  const registerDataChange = (event) => {
    if (event.target.name === "avatar") {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.readyState === 2) {
          setAvatarPreview(reader.result);
          setAvatar(reader.result);
        }
      };
      const file = event.target.files[0];
      if (file.size > 760000) {
        alert.error("Please upload an image smaller than 750 KB");
        return false;
      }
      reader.readAsDataURL(file);
    }
    // else {
    //   setUser({ ...user, [event.target.name]: event.target.value });
    // }
  };

  useEffect(() => {
    if (error) {
      return alert.error(error);
    }
    if (isAuthenticated) {
      history("/account", { replace: true });
    }
  }, [error, alert, history, isAuthenticated]);

  return (
    <div>
      <Seo
        title="Sign up - Click.it Store"
        description="Sign up and Subscribe to our shop with amazing products"
        path="/signup"
      />
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
            <HowToRegIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Sign up
          </Typography>
          <Box
            component="form"
            noValidate
            onSubmit={registerSubmit}
            sx={{ mt: 3 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoComplete="given-name"
                  name="name"
                  required
                  fullWidth
                  id="name"
                  label="Name"
                  autoFocus
                  value={registerFormvalues.name}
                  onChange={handleRegisterInputValue}
                  {...(errors.name && {
                    error: true,
                    helperText: errors.name,
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={registerFormvalues.email}
                  onChange={handleRegisterInputValue}
                  {...(errors.email && {
                    error: true,
                    helperText: errors.email,
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="new-password"
                  value={registerFormvalues.password}
                  onChange={handleRegisterInputValue}
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
              </Grid>
              <Grid item xs={2}>
                <Avatar sx={{ m: 1 }}>
                  <img src={avatarPreview} alt="Avatar Preview" />
                </Avatar>
              </Grid>
              <Grid item xs={6}>
                <Button
                  sx={{ m: 1, backgroundColor: "secondary.main" }}
                  variant="contained"
                  component="label"
                  startIcon={<PhotoCamera />}
                >
                  Upload Image
                  <input
                    type="file"
                    name="avatar"
                    accept="image/*"
                    onChange={registerDataChange}
                    hidden
                  />
                </Button>
              </Grid>
            </Grid>
            <Typography
              variant="caption"
              display="block"
              gutterBottom
              color="red"
              mt={2}
            >
              Image should not be more than 750KB
            </Typography>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, backgroundColor: "secondary.main" }}
              disabled={!registerFormIsValid() || avatar === undefined}
            >
              Sign Up
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link href="/signin" variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
      <Copyright />
    </div>
  );
}

export default Register;
