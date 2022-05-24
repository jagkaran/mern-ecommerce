import * as React from "react";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { List } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CategoryIcon from "@mui/icons-material/Category";
import ViewListIcon from "@mui/icons-material/ViewList";
import PeopleIcon from "@mui/icons-material/People";

function ListItems({ open }) {
  const items = [
    { id: 1, name: "Dashboard", icon: <DashboardIcon />, link: "/dashboard" },
    {
      id: 2,
      name: "Products & Reviews",
      icon: <CategoryIcon />,
      link: "/admin/products",
    },
    { id: 3, name: "Orders", icon: <ViewListIcon />, link: "/admin/orders" },
    { id: 4, name: "Customers", icon: <PeopleIcon />, link: "/admin/users" },
  ];
  return (
    <React.Fragment>
      <List>
        {items.map((item) => (
          <ListItemButton
            key={item.id}
            sx={{
              minHeight: 48,
              justifyContent: open ? "initial" : "center",
              px: 2.5,
            }}
            component="a"
            href={item.link}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : "auto",
                justifyContent: "center",
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.name} sx={{ opacity: open ? 1 : 0 }} />
          </ListItemButton>
        ))}
      </List>
    </React.Fragment>
  );
}

export default ListItems;
