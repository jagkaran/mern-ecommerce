// components/Home/Header/AccountMenu.jsx
// Avatar-triggered dropdown. Profile, Orders, Logout for everyone; Dashboard
// is unshifted to the top for admins. Calls onLogout after dispatch clears
// the auth state.

import { Menu, MenuItem, ListItemIcon } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasket";
import Logout from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";

export default function AccountMenu({ anchorEl, open, onClose, navigate, onLogout, isAdmin }) {
  const items = [
    {
      id: 2,
      icon: <PersonIcon fontSize="small" />,
      name: "Profile",
      onClick: () => {
        onClose();
        navigate("/account");
      },
    },
    {
      id: 3,
      icon: <ShoppingBasketIcon fontSize="small" />,
      name: "Orders",
      onClick: () => {
        onClose();
        navigate("/myorders");
      },
    },
    {
      id: 4,
      icon: <Logout fontSize="small" />,
      name: "Logout",
      onClick: () => {
        onClose();
        onLogout();
      },
    },
  ];
  if (isAdmin) {
    items.unshift({
      id: 1,
      icon: <DashboardIcon fontSize="small" />,
      name: "Dashboard",
      onClick: () => {
        onClose();
        navigate("/dashboard");
      },
    });
  }

  return (
    <Menu
      anchorEl={anchorEl}
      id="account-menu"
      open={open}
      onClose={onClose}
      onClick={(e) => e.stopPropagation()}
      PaperProps={{
        sx: { minWidth: 180, mt: 1 },
      }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
    >
      {items.map((item) => (
        <MenuItem key={item.id} onClick={item.onClick}>
          <ListItemIcon>{item.icon}</ListItemIcon>
          {item.name}
        </MenuItem>
      ))}
    </Menu>
  );
}
