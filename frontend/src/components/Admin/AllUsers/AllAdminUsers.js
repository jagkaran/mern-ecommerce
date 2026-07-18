import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import DashboardAppBar from "../Sidebar/DashboardAppBar";
import DashboardDrawer from "../Sidebar/DashboardDrawer";
import AdminMobileNav from "../AdminMobileNav";
import { CircularProgress, Container, Grid } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import AllUsersList from "./AllUsersList";
import { clearErrors, deleteUser, getAllUsers } from "../../../actions/userAction";
import Seo from "../../Seo";

function AllAdminUsers() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const dispatch = useDispatch();
  const toast = useToast();
  const history = useNavigate();

  const { loading, error, users, usersCount } = useSelector((state) => state.allUsers);

  const { error: deleteError, isDeleted, message } = useSelector((state) => state.profile);

  function sortByDate(a, b) {
    if (a.createdAt < b.createdAt) {
      return 1;
    }
    if (a.createdAt > b.createdAt) {
      return -1;
    }
    return 0;
  }

  const sortedUsersArrayByDate = users.slice().sort(sortByDate);

  const deleteUserHandler = (id) => {
    dispatch(deleteUser(id));
  };

  React.useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (deleteError) {
      toast.error(deleteError);
      dispatch(clearErrors());
    }
    if (isDeleted) {
      toast.success(message);
      history("/dashboard");
      dispatch({ type: "DeleteUserReset" });
    }
    dispatch(getAllUsers());
  }, [dispatch, error, toast, deleteError, history, isDeleted, message]);

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <Seo
          title="Manage Customers - Click.it Dashboard - Admin access only"
          description="Dashboard to manage registered users on Click.it store"
          path="/admin/users"
        />
        <CssBaseline />
        <DashboardAppBar open={open} handleDrawerOpen={handleDrawerOpen} />
        <DashboardDrawer open={open} handleDrawerClose={handleDrawerClose} theme={theme} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: 8,
          }}
        >
          <AdminMobileNav />
          <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {loading ? (
                  <div className="grid place-items-center h-screen">
                    <CircularProgress />
                  </div>
                ) : (
                  <AllUsersList
                    users={users && sortedUsersArrayByDate}
                    deleteUserHandler={deleteUserHandler}
                    usersCount={usersCount}
                  />
                )}
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </>
  );
}

export default AllAdminUsers;
