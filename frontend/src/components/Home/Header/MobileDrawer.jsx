// components/Home/Header/MobileDrawer.jsx
// Hamburger + right-side SwipeableDrawer. NAV_ITEMS drives the list and
// badge counts — every nav target uses history() navigation so the link
// list stays short and declarative.

import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  IconButton,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Divider,
  Select,
  MenuItem,
  Collapse,
  Avatar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import InfoIcon from "@mui/icons-material/Info";
import CategoryIcon from "@mui/icons-material/Category";
import PersonIcon from "@mui/icons-material/Person";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasket";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { avatarUrl } from "../../../utils/avatar";

export default function MobileDrawer({
  pathname,
  wishlistCount,
  cartCount,
  isAuthenticated,
  currency,
  currencyLoaded,
  currencyLocked,
  currencyRates,
  setCurrency,
  user,
  onLogout,
}) {
  const history = useNavigate();
  const [drawerState, setDrawerState] = useState({ right: false });
  const [accountOpen, setAccountOpen] = useState(false);

  const toggleDrawer = (anchor, open) => (event) => {
    if (event && event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setDrawerState((s) => ({ ...s, [anchor]: open }));
    if (!open) setAccountOpen(false);
  };

  const go = (path) => () => {
    setDrawerState({ right: false });
    setAccountOpen(false);
    history(path, { replace: true });
  };

  const aboutus = go("/aboutus");
  const products = go("/products");
  const search = go("/search");
  const wishlist = go("/wishlist");
  const cart = go("/cart");
  const signin = go("/signin");

  const handleAccountClick = (e) => {
    if (isAuthenticated) {
      e.stopPropagation();
      setAccountOpen((o) => !o);
    } else {
      // signin handler already closes drawer + navigates
    }
  };

  const handleLogout = () => {
    setDrawerState({ right: false });
    setAccountOpen(false);
    onLogout();
  };

  const isAdmin = user?.role === "admin";

  const NAV_ITEMS = [
    { name: "About Us", Icon: InfoIcon, onClick: aboutus },
    { name: "Products", Icon: CategoryIcon, onClick: products },
    { name: "Search", Icon: SearchIcon, onClick: search },
    {
      name: "Wishlist",
      Icon: FavoriteBorderIcon,
      onClick: wishlist,
      badge: wishlistCount,
    },
    {
      name: "Cart",
      Icon: ShoppingCartIcon,
      onClick: cart,
      badge: cartCount,
    },
  ];

  const SUB_ITEMS = isAdmin
    ? [
        { name: "Dashboard", Icon: DashboardIcon, onClick: go("/dashboard") },
        { name: "Profile", Icon: PersonIcon, onClick: go("/account") },
        { name: "Orders", Icon: ShoppingBasketIcon, onClick: go("/myorders") },
        { name: "Logout", Icon: LogoutIcon, onClick: handleLogout },
      ]
    : [
        { name: "Profile", Icon: PersonIcon, onClick: go("/account") },
        { name: "Orders", Icon: ShoppingBasketIcon, onClick: go("/myorders") },
        { name: "Logout", Icon: LogoutIcon, onClick: handleLogout },
      ];

  return (
    <Box sx={{ display: { xs: "flex", md: "none" }, ml: 1, alignItems: "center" }}>
      {["right"].map((anchor) => (
        <Fragment key={anchor}>
          <IconButton
            onClick={toggleDrawer(anchor, true)}
            size="small"
            sx={{
              color: "var(--t-neutral-600)",
              transition: "color 150ms cubic-bezier(0, 0, 0.2, 1)",
              "&:hover": { color: "var(--t-neutral-900)" },
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
          <SwipeableDrawer
            anchor={anchor}
            open={drawerState[anchor]}
            onClose={toggleDrawer(anchor, false)}
            onOpen={toggleDrawer(anchor, true)}
            slotProps={{ paper: {
              sx: {
                width: 260,
                backgroundColor: "var(--t-neutral-50)",
                borderLeft: "1px solid var(--t-neutral-200)",
              },
            } }}
          >
            <Box
              sx={{
                width: 250,
              }}
              role="presentation"
              onClick={toggleDrawer(anchor, false)}
              onKeyDown={toggleDrawer(anchor, false)}
            >
              <List>
                {currencyLoaded && !hideCurrency(pathname) && (
                  <ListItem
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 2,
                      py: 1,
                    }}
                  >
                    <Box
                      sx={{
                        flex: "0 0 auto",
                        fontSize: "12px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--t-neutral-500)",
                        fontWeight: 500,
                      }}
                    >
                      Currency
                    </Box>
                    <Select
                      size="small"
                      variant="standard"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={currencyLocked}
                      sx={{ fontSize: "14px", minWidth: 80, flex: 1 }}
                    >
                      {["USD", "EUR", "GBP"]
                        .filter((c) => currencyRates[c])
                        .map((c) => (
                          <MenuItem key={c} value={c} sx={{ fontSize: "14px" }}>
                            {c}
                          </MenuItem>
                        ))}
                    </Select>
                  </ListItem>
                )}
                {currencyLoaded && !hideCurrency(pathname) && <Divider />}
                {NAV_ITEMS.map((item) => (
                  <ListItem key={item.name} disablePadding>
                    <ListItemButton onClick={item.onClick}>
                      <ListItemIcon>
                        {item.Icon &&
                          (item.badge !== undefined ? (
                            <Badge
                              anchorOrigin={{ vertical: "top", horizontal: "right" }}
                              badgeContent={item.badge}
                              color="primary"
                            >
                              <item.Icon />
                            </Badge>
                          ) : (
                            <item.Icon />
                          ))}
                      </ListItemIcon>
                      <ListItemText primary={item.name} />
                    </ListItemButton>
                  </ListItem>
                ))}

                {/* Account / Sign in — special row with avatar + collapsible submenu */}
                <ListItem key="account" disablePadding>
                  <ListItemButton onClick={isAuthenticated ? handleAccountClick : signin}>
                    <ListItemIcon>
                      {isAuthenticated ? (
                        <Avatar
                          alt={user?.name}
                          src={avatarUrl(user)}
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: "var(--t-neutral-200)",
                            color: "var(--t-neutral-600)",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        <PersonIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText primary={isAuthenticated ? "Account" : "Sign in"} />
                    {isAuthenticated && (
                      <ExpandMoreIcon
                        fontSize="small"
                        sx={{
                          color: "var(--t-neutral-500)",
                          transform: accountOpen ? "rotate(180deg)" : "none",
                          transition: "transform 200ms cubic-bezier(0, 0, 0.2, 1)",
                          ml: "auto",
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
                <Collapse in={isAuthenticated && accountOpen} timeout="auto" unmountOnExit>
                  <List dense disablePadding>
                    {SUB_ITEMS.map((item) => (
                      <ListItem key={item.name} disablePadding>
                        <ListItemButton onClick={item.onClick} sx={{ pl: 4 }}>
                          <ListItemIcon>
                            <item.Icon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={item.name}
                            primaryTypographyProps={{ fontSize: "14px" }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </List>
            </Box>
          </SwipeableDrawer>
        </Fragment>
      ))}
    </Box>
  );
}

function hideCurrency(pathname) {
  return /^\/(order|account|success|myorders|dashboard|admin\/.*)/.test(pathname);
}
