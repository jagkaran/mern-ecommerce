import React, { useState } from "react";
import { Card, CardBody, Overline, Headline, BodyText, GhostBtn } from "../../../design/primitives";
import { SeverityPill } from "../../../design/primitives";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { avatarUrl } from "../../../utils/avatar";
import useAdminPagination, { PER_PAGE_OPTIONS } from "../Hooks/useAdminPagination";
import { useDispatch } from "react-redux";
import { deleteUser } from "../../../actions/userAction";

function AllUsersList({ users, usersCount, deleteUserHandler }) {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});
  const dispatch = useDispatch();

  const { page, perPage, totalPages, paginated, setPage, setPerPage } = useAdminPagination(
    users,
    10
  );

  const handleClickOpen = (user) => {
    setOpen(true);
    setSelectedUser(user);
  };
  const handleClose = () => setOpen(false);

  const deleteUserFn = (id) => {
    dispatch(deleteUser(id));
    setOpen(false);
  };

  if (!users || users.length === 0) {
    return (
      <Card>
        <CardBody>
          <BodyText style={{ color: "var(--t-neutral-400)" }}>No users found.</BodyText>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody style={{ padding: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid var(--t-neutral-200)",
          }}
        >
          <Overline>All Users</Overline>
          <Headline level="xl" style={{ fontSize: "var(--t-fontSize-xl)" }}>
            {usersCount ?? 0}
          </Headline>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "var(--t-fontSize-sm)",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--t-neutral-200)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {["Name", "Email", "Role", "Registered", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontWeight: 600,
                      color: "var(--t-neutral-500)",
                      fontSize: "var(--t-fontSize-xs)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((user) => (
                <tr
                  key={user._id}
                  style={{
                    borderBottom: "1px solid var(--t-neutral-100)",
                    transition:
                      "background var(--t-motion-duration-fast) var(--t-motion-easing-out)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--t-neutral-50)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <img
                        src={avatarUrl(user)}
                        alt=""
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: "var(--t-neutral-200)",
                          objectFit: "cover",
                        }}
                      />
                      <BodyText style={{ textTransform: "capitalize" }}>{user.name}</BodyText>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--t-neutral-600)",
                    }}
                  >
                    {user.email}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <SeverityPill color={user.role === "admin" ? "success" : "warning"}>
                      {user.role}
                    </SeverityPill>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--t-neutral-600)",
                    }}
                  >
                    {format(parseISO(user.createdAt), "dd MMM yyyy")}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Link
                        to={`/admin/user/update/${user._id}`}
                        style={{
                          color: "var(--t-neutral-500)",
                          textDecoration: "none",
                          transition: "color 150ms",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-primary-600)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-neutral-500)")}
                      >
                        ✎
                      </Link>
                      <GhostBtn
                        size="small"
                        onClick={() => handleClickOpen(user)}
                        style={{ color: "var(--t-neutral-400)" }}
                      >
                        ✕
                      </GhostBtn>

                      {open && selectedUser._id === user._id && (
                        <div
                          style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1300,
                          }}
                          onClick={handleClose}
                        >
                          <div
                            style={{
                              background: "var(--t-neutral-50)",
                              borderRadius: "var(--t-border-radius-base)",
                              padding: 24,
                              maxWidth: 400,
                              width: "90%",
                              boxShadow: "var(--t-shadow-lg)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Headline level="lg" style={{ marginBottom: 12 }}>
                              Delete Confirmation
                            </Headline>
                            <BodyText
                              style={{
                                color: "var(--t-neutral-500)",
                                marginBottom: 20,
                              }}
                            >
                              Are you sure you want to delete user &ldquo;
                              {selectedUser.name}&rdquo;?
                            </BodyText>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                justifyContent: "flex-end",
                              }}
                            >
                              <GhostBtn size="small" onClick={handleClose}>
                                Cancel
                              </GhostBtn>
                              <GhostBtn
                                size="small"
                                onClick={() => deleteUserFn(selectedUser._id)}
                                style={{
                                  color: "var(--t-semantic-error)",
                                  borderColor: "var(--t-semantic-error)",
                                }}
                              >
                                Delete
                              </GhostBtn>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            borderTop: "1px solid var(--t-neutral-200)",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <BodyText small style={{ color: "var(--t-neutral-500)" }}>
              Rows per page:
            </BodyText>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              style={{
                fontSize: "0.875rem",
                border: "1px solid var(--t-neutral-300)",
                borderRadius: "var(--t-border-radius-base)",
                padding: "2px 8px",
                background: "var(--t-neutral-50)",
                color: "var(--t-neutral-700)",
              }}
            >
              {PER_PAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <BodyText small style={{ color: "var(--t-neutral-500)" }}>
              {Math.min((page - 1) * perPage + 1, users.length)}–
              {Math.min(page * perPage, users.length)} of {users.length}
            </BodyText>
            <div style={{ display: "flex", gap: 4 }}>
              <GhostBtn
                size="small"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                ‹
              </GhostBtn>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <GhostBtn
                  key={p}
                  size="small"
                  onClick={() => setPage(p)}
                  style={{
                    background: p === page ? "var(--t-primary-600)" : "transparent",
                    color: p === page ? "#fff" : "var(--t-neutral-700)",
                    borderColor: p === page ? "var(--t-primary-600)" : "var(--t-neutral-300)",
                  }}
                >
                  {p}
                </GhostBtn>
              ))}
              <GhostBtn
                size="small"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                ›
              </GhostBtn>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default AllUsersList;
