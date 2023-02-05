import React, { useState } from "react";
import PerfectScrollbar from "react-perfect-scrollbar";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Link } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { format, parseISO } from "date-fns";
import SeverityPill from "../../Order/SeverityPill";

function AllUsersList({ users, usersCount, deleteUserHandler }) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});

  const handleClickOpen = (user) => {
    setOpen(true);
    setSelectedUser(user);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const deleteUser = (id) => {
    deleteUserHandler(id);
    setOpen(false);
  };
  return (
    <Card>
      <CardHeader title={`All Users (${usersCount})`} />
      <PerfectScrollbar>
        <Box sx={{ minWidth: 800 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Registration Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow hover key={user._id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar
                        src={user.profilePic.url}
                        sx={{
                          height: 50,
                          width: 50,
                        }}
                      />
                      <Typography
                        sx={{ ml: 2, textTransform: "capitalize" }}
                        color="textPrimary"
                        gutterBottom
                        variant="body1"
                      >
                        {user.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <SeverityPill
                      color={
                        (user.role === "admin" && "success") ||
                        (user.role === "user" && "warning") ||
                        "error"
                      }
                    >
                      {user.role}
                    </SeverityPill>
                  </TableCell>
                  <TableCell>
                    {format(parseISO(user.createdAt), `dd/MM/yyyy`)}
                  </TableCell>
                  <TableCell>
                    {" "}
                    <Link to={`/admin/user/update/${user._id}`}>
                      <EditIcon />
                    </Link>
                    <Button onClick={() => handleClickOpen(user)}>
                      <DeleteIcon />
                    </Button>
                    <Dialog
                      open={open}
                      onClose={handleClose}
                      aria-labelledby="alert-dialog-title"
                      aria-describedby="alert-dialog-description"
                    >
                      <DialogTitle id="alert-dialog-title">
                        {"Delete Confirmation"}
                      </DialogTitle>
                      <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                          Are you sure you want to delete "{selectedUser.email}"
                          user?
                        </DialogContentText>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={handleClose} color="primary">
                          Cancel
                        </Button>
                        <Button
                          onClick={() => deleteUser(selectedUser._id)}
                          color="secondary"
                        >
                          Delete
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </PerfectScrollbar>
    </Card>
  );
}

export default AllUsersList;
