// components/Home/Header/DesktopNav.jsx
// Right-side desktop navigation: About link + Shop (with MegaMenu on hover) +
// search/wishlist/cart icon trio + currency selector + auth trigger (sign-in
// link or account avatar). Renders only on md+ breakpoints.

import { Box, IconButton, Badge, Select, MenuItem, Tooltip, Avatar } from "@mui/material";
import { Link } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { avatarUrl } from "../../../utils/avatar";
import MegaMenu from "./MegaMenu";

const navLinkStyle = (to, isActive) => ({
  color: isActive ? "var(--t-neutral-900)" : "var(--t-neutral-700)",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 500,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "6px 2px",
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  position: "relative",
  transition: "color 150ms cubic-bezier(0, 0, 0.2, 1)",
  ...(isActive && {
    "&::after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "1px",
      background: "var(--t-primary-600)",
    },
  }),
});

export default function DesktopNav({
  pathname,
  wishlistCount,
  cartCount,
  user,
  isAuthenticated,
  currency,
  currencyLoaded,
  currencyLocked,
  currencyRates,
  setCurrency,
  onAccountClick,
  onSigninClick,
}) {
  const isActive = (to) => pathname === to;

  return (
    <Box
      component="nav"
      sx={{
        display: { xs: "none", md: "flex" },
        alignItems: "center",
        gap: "4px",
      }}
    >
      <Link to="/aboutus" style={navLinkStyle("/aboutus", isActive("/aboutus"))}>
        About
      </Link>
      <MegaMenu />

      <IconButton size="small" component={Link} to="/search" aria-label="Search" sx={iconSx}>
        <SearchIcon fontSize="small" />
      </IconButton>

      <IconButton
        size="small"
        component={Link}
        to="/wishlist"
        aria-label="Wishlist"
        sx={{
          ...iconSx,
          ml: 0.5,
          color: wishlistCount > 0 ? "var(--t-primary-600)" : "var(--t-neutral-500)",
        }}
      >
        <Badge badgeContent={wishlistCount} invisible={wishlistCount === 0} sx={badgeSx}>
          <FavoriteBorderIcon fontSize="small" />
        </Badge>
      </IconButton>

      <IconButton
        size="small"
        component={Link}
        to="/cart"
        aria-label="Cart"
        sx={{ ...iconSx, ml: 0.5 }}
      >
        <Badge
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          badgeContent={cartCount}
          color="primary"
          sx={{
            ...badgeSx,
            "& .MuiBadge-badge": {
              ...badgeSx["& .MuiBadge-badge"],
              backgroundColor: "var(--t-primary-600)",
            },
          }}
        >
          <ShoppingCartIcon fontSize="small" />
        </Badge>
      </IconButton>

      {currencyLoaded && !hideCurrency(pathname) && (
        <Select
          disabled={currencyLocked}
          size="small"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          sx={currencySelectSx}
        >
          {["USD", "EUR", "GBP"]
            .filter((c) => currencyRates[c])
            .map((c) => (
              <MenuItem key={c} value={c} sx={{ fontSize: "12px" }}>
                {c}
              </MenuItem>
            ))}
        </Select>
      )}

      {isAuthenticated ? (
        <Tooltip title="Account settings">
          <IconButton
            onClick={onAccountClick}
            size="small"
            sx={{ ml: 1 }}
            aria-controls={onAccountClick ? "account-menu" : undefined}
            aria-haspopup="true"
          >
            <Avatar sx={avatarSx} alt={user?.name} src={avatarUrl(user)} />
          </IconButton>
        </Tooltip>
      ) : (
        <IconButton component={Link} to="/signin" size="small" sx={{ ...iconSx, ml: 1 }}>
          <AccountCircleIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}

const iconSx = {
  color: "var(--t-neutral-500)",
  transition: "color 150ms cubic-bezier(0,0,0.2,1)",
  "&:hover": { color: "var(--t-neutral-900)" },
};

const badgeSx = {
  "& .MuiBadge-badge": {
    fontSize: "10px",
    height: "16px",
    minWidth: "16px",
    padding: "0 4px",
    fontWeight: 600,
    borderRadius: "8px",
  },
};

const avatarSx = {
  width: 28,
  height: 28,
  bgcolor: "var(--t-neutral-200)",
  color: "var(--t-neutral-600)",
  fontSize: "12px",
  fontWeight: 600,
};

const currencySelectSx = {
  ml: 1.5,
  minWidth: 72,
  height: 32,
  fontSize: "12px",
  fontWeight: 500,
  letterSpacing: "0.04em",
  color: "var(--t-neutral-600)",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--t-neutral-300)",
    borderRadius: "var(--t-border-radius-base)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--t-neutral-400)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--t-primary-600)",
    borderWidth: "1px",
  },
};

function hideCurrency(pathname) {
  return /^\/(order|account|success|myorders|dashboard|admin\/.*)/.test(pathname);
}
