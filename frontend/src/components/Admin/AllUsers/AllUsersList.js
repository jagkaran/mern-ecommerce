import React, { useState } from "react";
import PerfectScrollbar from "react-perfect-scrollbar";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardHeader,
  Divider,
  MenuItem,
  Pagination,
  Select,
  Stack,
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
import useAdminPagination, { PER_PAGE_OPTIONS } from "../Hooks/useAdminPagination";

function AllUsersList({ users, usersCount, deleteUserHandler }) {
  const [open, setOpen]             = useState(false);
  const [selectedUser, setSelectedUser] = useState({});

  const { page, perPage, totalPages, paginated, setPage, setPerPage } =
    useAdminPagination(users, 10);

  const handleClickOpen = (user) => { setOpen(true); setSelectedUser(user); };
  const handleClose     = () => setOpen(false);

  const deleteUser = (id) => {
    deleteUserHandler(id);
    setOpen(false);
  };

  return (
    <Card>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <CardHeader title={`All Users (${usersCount})`} />
      <Divider />

      {/* ── Table ──────────────────────────────────────────────────── */}
      <PerfectScrollbar>
        <Box sx={{ minWidth: 800 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Registered</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((user) => (
                <TableRow hover key={user._id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar src={user.profilePic.url} sx={{ height: 40, width: 40 }} />
                      <Typography
                        sx={{ ml: 2, textTransform: "capitalize" }}
                        color="textPrimary"
                        variant="body2"
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
                        (user.role === "user"  && "warning") ||
                        "error"
                      }
                    >
                      {user.role}
                    </SeverityPill>
                  </TableCell>
                  <TableCell>
                    {format(parseISO(user.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <Link to={`/admin/user/update/${user._id}`}>
                      <EditIcon />
                    </Link>
                    <Button onClick={() => handleClickOpen(user)}>
                      <DeleteIcon />
                    </Button>

                    <Dialog
                      open={open && selectedUser._id === user._id}
                      onClose={handleClose}
                      aria-labelledby="user-delete-title"
                    >
                      <DialogTitle id="user-delete-title">Delete Confirmation</DialogTitle>
                      <DialogContent>
                        <DialogContentText>
                          Are you sure you want to delete "{selectedUser.email}" user?
                        </DialogContentText>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={handleClose} color="primary">Cancel</Button>
                        <Button onClick={() => deleteUser(selectedUser._id)} color="secondary">
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

      <Divider />

      {/* ── Pagination footer ──────────────────────────────────────── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ px: 2, py: 1.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Rows per page:
          </Typography>
          <Select
            size="small"
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            sx={{ fontSize: "0.875rem" }}
          >
            {PER_PAGE_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {Math.min((page - 1) * perPage + 1, users.length)}–
            {Math.min(page * perPage, users.length)} of {users.length}
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            shape="rounded"
            size="small"
          />
        </Stack>
      </Stack>
    </Card>
  );
}

export default AllUsersList;
