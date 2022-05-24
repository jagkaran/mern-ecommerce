import {
  Box,
  Container,
  Grid,
  Typography,
  CardHeader,
  TextField,
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  CircularProgress,
} from "@mui/material";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useAlert } from "react-alert";
import KeyIcon from "@mui/icons-material/Key";
import { useNavigate } from "react-router-dom";
import {
  clearErrors,
  loadUser,
  updateUserProfile,
} from "../../actions/userAction";
import Seo from "../Seo";
import Copyright from "../Copyright";

const Account = () => {
  const dispatch = useDispatch();
  const history = useNavigate();
  const alert = useAlert();
  const { user } = useSelector((state) => state.user);
  const { error, isUpdated, loading } = useSelector((state) => state.profile);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState();
  const [avatarPreview, setAvatarPreview] = useState("/Profile.png");

  const updateProfile = (event) => {
    event.preventDefault();

    const data = new FormData();

    data.set("name", name);
    data.set("email", email);
    data.set("avatar", avatar);

    dispatch(updateUserProfile(data));
  };

  const registerDataChange = (event) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.readyState === 2) {
        setAvatarPreview(reader.result);
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(event.target.files[0]);
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatarPreview(user.profilePic?.url);
    }
    if (error) {
      alert.error(error);
      dispatch(clearErrors());
    }
    if (isUpdated) {
      alert.success("Profile Updated Successfully");
      dispatch(loadUser());
      history("/account");
      dispatch({
        type: "UpdateProfileReset",
      });
    }
  }, [dispatch, error, alert, history, user, isUpdated]);

  return (
    <>
      <Seo
        title="Your Profile - Click.it store"
        description="Verify your account details"
        path="/account"
      />
      {loading ? (
        <div className="grid place-items-center h-screen">
          <CircularProgress />
        </div>
      ) : (
        <Box
          component="form"
          noValidate
          onSubmit={updateProfile}
          sx={{
            flexGrow: 1,
            py: 8,
          }}
        >
          <Container maxWidth="lg">
            <Typography sx={{ mb: 3 }} variant="h4">
              Account
            </Typography>
            <Grid container spacing={3}>
              <Grid item lg={4} md={6} xs={12}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        alignItems: "center",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Avatar
                        src={avatarPreview}
                        sx={{
                          height: 86,
                          mb: 2,
                          width: 86,
                        }}
                      />
                      <Typography
                        sx={{ textTransform: "uppercase" }}
                        color="textPrimary"
                        gutterBottom
                        variant="h5"
                      >
                        {user.name}
                      </Typography>
                      <Typography color="textSecondary" variant="body2">
                        Joined on: {String(user.createdAt).substring(0, 10)}
                      </Typography>
                      <Typography color="textSecondary" variant="body2">
                        Assigned Role: {user.role}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <Button
                      color="primary"
                      fullWidth
                      variant="text"
                      component="label"
                      startIcon={<PhotoCamera />}
                    >
                      Upload picture
                      <input
                        type="file"
                        name="avatar"
                        accept="image/*"
                        onChange={registerDataChange}
                        hidden
                      />
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              <Grid item lg={8} md={6} xs={12}>
                <Card>
                  <CardHeader
                    subheader="The information can be edited"
                    title="Profile"
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item md={6} xs={12}>
                        <TextField
                          autoComplete="given-name"
                          id="name"
                          fullWidth
                          helperText="Please specify your Name"
                          label="Name"
                          name="name"
                          onChange={(e) => setName(e.target.value)}
                          value={name}
                          variant="outlined"
                        />
                      </Grid>

                      <Grid item md={6} xs={12}>
                        <TextField
                          id="email"
                          autoComplete="email"
                          fullWidth
                          label="Email Address"
                          name="email"
                          onChange={(e) => setEmail(e.target.value)}
                          value={email}
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                  <Divider />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      p: 2,
                    }}
                  >
                    <Button
                      href="/password/update"
                      sx={{ backgroundColor: "secondary.main" }}
                      variant="contained"
                      startIcon={<KeyIcon />}
                    >
                      Change Password
                    </Button>
                    <Button
                      type="submit"
                      sx={{ backgroundColor: "secondary.main" }}
                      variant="contained"
                    >
                      Save details
                    </Button>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>
      )}
      <Copyright />
    </>
  );
};

export default Account;
