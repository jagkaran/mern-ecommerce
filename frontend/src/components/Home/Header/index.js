// components/Home/Header/index.js
// Top-level header shell. Composes the child pieces (DesktopNav,
// MobileDrawer, AccountMenu) and owns the small bit of cross-cutting state
// (account menu anchor, mobile drawer state). Most logic lives in the
// children — keep this file as a thin orchestrator.

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../../hooks/useToast";
import { logoutUser } from "../../../actions/userAction";
import { useCurrency } from "../../../utils/currencyContext";
import useHeaderScroll from "./useHeaderScroll";
import useCurrencyLock from "./useCurrencyLock";
import DesktopNav from "./DesktopNav";
import MobileDrawer from "./MobileDrawer";
import AccountMenu from "./AccountMenu";
import SkipLink from "../SkipLink";

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((s) => s.user);
  const wishlistCount = useSelector((s) => s.wishlist.ids.length);
  const cartItems = useSelector((s) => s.cart.cartItems);
  const cartCount = cartItems.reduce((a, i) => a + i.quantity, 0);
  const [anchorEl, setAnchorEl] = useState(null);
  const scrolled = useHeaderScroll();
  const {
    code: currency,
    rates: currencyRates,
    setCurrency,
    loaded: currencyLoaded,
    locked: currencyLocked,
    lockCurrency,
    unlockCurrency,
  } = useCurrency();

  useCurrencyLock(location.pathname, { lockCurrency, unlockCurrency });

  // Reset to USD if stored currency not in fetched rates
  useEffect(() => {
    if (currencyLoaded && currency && !currencyRates[currency]) {
      setCurrency("USD");
    }
  }, [currencyLoaded, currency, currencyRates, setCurrency]);

  const handleAccountClick = (event) => {
    if (!isAuthenticated) {
      navigate("/signin", { replace: true });
      return;
    }
    setAnchorEl(event.currentTarget);
  };

  const handleAccountClose = () => setAnchorEl(null);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/", { replace: true });
    toast.success("Logout Successfully");
  };

  return (
    <header
      style={{
        zIndex: 1100,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "56px",
        display: "flex",
        alignItems: "center",
        width: "100%",
        backgroundColor: "var(--t-neutral-50)",
        borderBottom: scrolled
          ? "1px solid var(--t-neutral-200)"
          : "1px solid transparent",
        boxShadow: scrolled ? "var(--t-shadow-sm)" : "none",
        transition:
          "border-color 200ms cubic-bezier(0, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0, 0, 0.2, 1)",
      }}
    >
      <SkipLink />
      <div
        style={{
          maxWidth: "var(--t-grid-containerMax)",
          marginInline: "auto",
          paddingInline: "var(--t-grid-containerPad)",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          to="/"
          style={{
            fontFamily: "var(--t-fontFamily-display)",
            fontSize: "22px",
            fontWeight: 500,
            color: "var(--t-neutral-900)",
            textDecoration: "none",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            fontStyle: "italic",
          }}
        >
          Hverdag
        </Link>

        <DesktopNav
          pathname={location.pathname}
          wishlistCount={wishlistCount}
          cartCount={cartCount}
          user={user}
          isAuthenticated={isAuthenticated}
          currency={currency}
          currencyLoaded={currencyLoaded}
          currencyLocked={currencyLocked}
          currencyRates={currencyRates}
          setCurrency={setCurrency}
          onAccountClick={handleAccountClick}
          onSigninClick={() => navigate("/signin", { replace: true })}
        />

        <MobileDrawer
          wishlistCount={wishlistCount}
          cartCount={cartCount}
          isAuthenticated={isAuthenticated}
          onAccountClick={handleAccountClick}
        />
      </div>

      <AccountMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleAccountClose}
        navigate={navigate}
        onLogout={handleLogout}
        isAdmin={user?.role === "admin"}
      />
    </header>
  );
}

export default Header;