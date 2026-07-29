import React, { useState } from "react";
import Box from "@mui/material/Box";
import {
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../../../hooks/useToast";
import { useNavigate, useParams } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { clearErrors, getUserDetails, updateUser } from "../../../actions/userAction";
import PersonIcon from "@mui/icons-material/Person";
import Seo from "../../Seo";

function UpdateUser() {
  const { id } = useParams();

  const dispatch = useDispatch();
  const toast = useToast();

  const { loading, error, user } = useSelector((state) => state.userDetails);
  const {
    loading: updateLoading,
    error: updateError,
    isUpdated,
  } = useSelector((state) => state.profile);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const history = useNavigate();

  const updateUserSubmitHandler = (e) => {
    e.preventDefault();

    const myForm = new FormData();

    myForm.set("name", name);
    myForm.set("email", email);
    myForm.set("role", role);

    dispatch(updateUser(id, myForm));
  };

  // Populate fields whenever the user record arrives (or id changes).
  // Re-fetch only when the loaded record doesn't match the route id — never on
  // error/toast changes (those live in the effect below, separate).
  useEffect(() => {
    if (user && user._id === id) {
      setName(user.name || "");
      setEmail(user.email || "");
      setRole(user.role || "");
    } else {
      dispatch(getUserDetails(id));
    }
  }, [dispatch, id, user]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (updateError) {
      toast.error(updateError);
      dispatch(clearErrors());
    }

    if (isUpdated) {
      toast.success("User Updated Successfully");
      history("/admin/users");
      dispatch({ type: "UpdateUserReset" });
    }
  }, [dispatch, error, toast, history, isUpdated, updateError]);

  return (
    <div style={{ padding: "24px 16px" }}>
      <Seo
        title="Manage Customer access - Click.it Dashboard - Admin access only"
        description="Dashboard to manage registered users access on Click.it store"
        path="/admin/users"
      />
      <Box
        sx={{
          maxWidth: "560px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "var(--t-border-radius-base)",
          padding: { xs: "20px", md: "32px" },
          boxShadow: "var(--t-shadow-sm)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, marginBottom: "24px" }}>
          <Avatar sx={{ bgcolor: "secondary.main", width: 40, height: 40 }}>
            <PersonIcon />
          </Avatar>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            Update User
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", padding: "48px" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form" noValidate onSubmit={updateUserSubmitHandler}>
            <TextField
              required
              fullWidth
              name="name"
              id="name"
              label="Name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ marginBottom: "16px" }}
            />
            <TextField
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ marginBottom: "16px" }}
            />
            <FormControl fullWidth sx={{ marginBottom: "24px" }}>
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                id="role"
                name="role"
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value="admin">admin</MenuItem>
                <MenuItem value="user">user</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ padding: "12px", backgroundColor: "secondary.main" }}
              disabled={updateLoading || role === ""}
            >
              Update
            </Button>
          </Box>
        )}
      </Box>
    </div>
  );
}

export default UpdateUser;
