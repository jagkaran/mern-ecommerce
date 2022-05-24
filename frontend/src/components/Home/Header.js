import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SearchIcon from "@mui/icons-material/Search";
import {
  Avatar,
  Badge,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  SwipeableDrawer,
} from "@mui/material";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Logout from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasket";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "react-alert";
import { logoutUser } from "../../actions/userAction";
import MenuIcon from "@mui/icons-material/Menu";
import CategoryIcon from "@mui/icons-material/Category";
import InfoIcon from "@mui/icons-material/Info";

function Header() {
  const history = useNavigate();
  const dispatch = useDispatch();
  const alert = useAlert();
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const { cartItems } = useSelector((state) => state.cart);
  const [drawerState, setDrawerState] = React.useState({
    right: false,
  });
  const toggleDrawer = (anchor, open) => (event) => {
    if (
      event &&
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setDrawerState({ ...drawerState, [anchor]: open });
  };

  const mobileArrList = [
    {
      name: "About Us",
      url: aboutus,
    },
    {
      name: "Products",
      url: products,
    },
    {
      name: "Search",
      url: search,
    },
    {
      name: "Cart",
      url: cart,
    },
    {
      name: "Account",
      url: "",
    },
  ];

  const mobileList = (anchor) => (
    <Box
      sx={{ width: anchor === "top" || anchor === "bottom" ? "auto" : 250 }}
      role="presentation"
      onClick={toggleDrawer(anchor, false)}
      onKeyDown={toggleDrawer(anchor, false)}
    >
      <List>
        {mobileArrList.map((text, index) => (
          <ListItem key={text.name} disablePadding>
            <ListItemButton onClick={index === 4 ? handleClick : text.url}>
              <ListItemIcon>
                {index === 0 && <InfoIcon />}
                {index === 1 && <CategoryIcon />}
                {index === 2 && <SearchIcon />}
                {index === 3 && (
                  <Badge
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                    badgeContent={cartItems.reduce(
                      (accum, item) => accum + item.quantity,
                      0
                    )}
                    color="primary"
                  >
                    <ShoppingCartIcon />
                  </Badge>
                )}
                {index === 4 && (
                  <IconButton
                    size="small"
                    aria-controls={open ? "account-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                  >
                    <Avatar
                      sx={{ width: 28, height: 28 }}
                      alt={user && user.name}
                      src={user && user.profilePic?.url}
                    />
                  </IconButton>
                )}
              </ListItemIcon>
              <ListItemText primary={text.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const menuItems = [
    {
      id: 2,
      icon: <PersonIcon fontSize="small" />,
      name: "Profile",
      func: account,
    },
    {
      id: 3,
      icon: <ShoppingBasketIcon fontSize="small" />,
      name: "Orders",
      func: orders,
    },
    {
      id: 4,
      icon: <Logout fontSize="small" />,
      name: "Logout",
      func: logout,
    },
  ];

  if (user?.role === "admin") {
    menuItems.unshift({
      id: 1,
      icon: <DashboardIcon fontSize="small" />,
      name: "Dashboard",
      func: dashboard,
    });
  }

  function dashboard() {
    history("/dashboard", { replace: true });
  }
  function products() {
    history("/products", { replace: true });
  }
  function search() {
    history("/search", { replace: true });
  }
  function cart() {
    history("/cart", { replace: true });
  }
  function aboutus() {
    history("/aboutus", { replace: true });
  }
  function account() {
    history("/account", { replace: true });
  }
  function orders() {
    history("/myorders", { replace: true });
  }
  function logout() {
    dispatch(logoutUser());
    history("/", { replace: true });
    alert.success("Logout Successfully");
  }

  return (
    <header className="h-24 sm:h-32 flex items-center z-30 w-full ">
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="uppercase text-gray-800 dark:text-white font-black text-3xl">
          <Link to="/">Click.it</Link>
        </div>
        <div className="flex items-center">
          <nav className="font-sen text-gray-800 dark:text-white uppercase text-lg lg:flex items-center hidden">
            <a href="/aboutus" className="py-2 px-6 flex">
              About Us
            </a>
            <a href="/products" className="py-2 px-6 flex">
              Products
            </a>
            <a href="/search" className="py-2 px-2 flex">
              <SearchIcon />
            </a>

            <a href="/cart" className="py-2 px-2 flex">
              <Badge
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                badgeContent={cartItems.reduce(
                  (accum, item) => accum + item.quantity,
                  0
                )}
                color="primary"
              >
                <ShoppingCartIcon />
              </Badge>
            </a>

            {isAuthenticated ? (
              <>
                <Tooltip title="Account settings">
                  <IconButton
                    onClick={handleClick}
                    size="small"
                    aria-controls={open ? "account-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                  >
                    <Avatar
                      sx={{ width: 28, height: 28 }}
                      alt={user && user.name}
                      src={user && user.profilePic?.url}
                    />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  id="account-menu"
                  open={open}
                  onClose={handleClose}
                  onClick={handleClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: "visible",
                      filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                      mt: 1.5,
                      "& .MuiAvatar-root": {
                        width: 28,
                        height: 28,
                        ml: -0.5,
                        mr: 1,
                      },
                      "&:before": {
                        content: '""',
                        display: "block",
                        position: "absolute",
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: "background.paper",
                        transform: "translateY(-50%) rotate(45deg)",
                        zIndex: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                >
                  {menuItems.map((item) => (
                    <MenuItem key={item.id} onClick={item.func}>
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      {item.name}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : (
              <>
                <a href="/signin" className="py-2 px-2 flex">
                  <AccountCircleIcon />
                </a>
              </>
            )}
          </nav>

          <div className="lg:hidden flex flex-col ml-4">
            {["right"].map((anchor) => (
              <React.Fragment key={anchor}>
                <IconButton
                  onClick={toggleDrawer(anchor, true)}
                  size="small"
                  aria-controls={open ? "account-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                >
                  <MenuIcon />
                </IconButton>

                <SwipeableDrawer
                  anchor={anchor}
                  open={drawerState[anchor]}
                  onClose={toggleDrawer(anchor, false)}
                  onOpen={toggleDrawer(anchor, true)}
                >
                  {mobileList(anchor)}
                </SwipeableDrawer>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
