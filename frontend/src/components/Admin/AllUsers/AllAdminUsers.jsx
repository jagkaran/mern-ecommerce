import * as React from "react";
import Box from "@mui/material/Box";
import { CircularProgress } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "../../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import AllUsersList from "./AllUsersList";
import { clearErrors, deleteUser, getAllUsers } from "../../../actions/userAction";
import Seo from "../../Seo";

function AllAdminUsers() {
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

  // Fetch on mount only. Re-firing on every error change loops into 429 spam.
  React.useEffect(() => {
    dispatch(getAllUsers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

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
  }, [dispatch, error, toast, deleteError, history, isDeleted, message]);

  return (
    <>
      <Seo
        title="Manage Customers - Click.it Dashboard - Admin access only"
        description="Dashboard to manage registered users on Click.it store"
        path="/admin/users"
      />
      <Box sx={{ padding: "16px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          {loading ? (
            <div className="grid place-items-center" style={{ minHeight: "60vh" }}>
              <CircularProgress />
            </div>
          ) : (
            <AllUsersList
              users={users && sortedUsersArrayByDate}
              deleteUserHandler={deleteUserHandler}
              usersCount={usersCount}
            />
          )}
        </div>
      </Box>
    </>
  );
}

export default AllAdminUsers;
