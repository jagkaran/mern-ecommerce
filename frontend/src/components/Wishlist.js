import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Box, Container, IconButton, Rating, CircularProgress } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useSelector } from "react-redux";
import { useWishlist } from "../hooks/useWishlist";
import { useCurrency } from "../utils/currencyContext";
import { addItemsToCart } from "../actions/cartAction";
import { useDispatch } from "react-redux";
import { useToast } from "../hooks/useToast";
import Seo from "./Seo";
import { Overline, Headline, BodyText, PrimaryBtn, GhostBtn, Surface } from "../design/primitives";

export default function Wishlist() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { fmt } = useCurrency();
  const { isAuthenticated } = useSelector((s) => s.user);
  const { items, loading, toggle } = useWishlist();

  const handleAddToCart = (productId, qty = 1) => {
    dispatch(addItemsToCart(productId, qty));
    toast.success("Added to your bag");
  };

  // Anon users get prompted to sign in
  useEffect(() => {
    if (!isAuthenticated) {
      // don't auto-redirect; show gentle empty state with sign-in CTA
    }
  }, [isAuthenticated]);

  return (
    <>
      <Seo
        title="Wishlist | Hverdag"
        description="The pieces you're keeping an eye on."
        path="/wishlist"
      />
      <Container
        maxWidth={false}
        sx={{ maxWidth: "var(--t-grid-containerMax)", pt: { xs: 4, md: 6 }, pb: 2 }}
      >
        <Box sx={{ mb: { xs: 3, md: 4 } }}>
          <BreadcrumbHeader />
          <Overline sx={{ display: "block", color: "var(--t-neutral-500)", mb: 1 }}>
            Saved for later
          </Overline>
          <Headline level="2xl">
            {isAuthenticated ? "Your wishlist" : "Sign in to keep a wishlist"}
          </Headline>
          <BodyText
            sx={{ color: "var(--t-neutral-500)", mt: 1, maxWidth: "var(--t-measure-base)" }}
          >
            {isAuthenticated
              ? items.length === 0
                ? "Nothing here yet. Tap the heart on any piece to keep it close."
                : `${items.length} ${items.length === 1 ? "piece" : "pieces"} you're keeping an eye on.`
              : "Your wishlist is private — sign in to keep pieces you love in one place."}
          </BodyText>
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "var(--t-primary-600)" }} />
          </Box>
        )}

        {!loading && isAuthenticated && items.length === 0 && (
          <Surface sx={{ p: { xs: 4, sm: 6 }, textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--t-fontFamily-display)",
                fontStyle: "italic",
                fontSize: "1.125rem",
                color: "var(--t-neutral-600)",
                marginBottom: "1.5rem",
              }}
            >
              Find something to keep.
            </p>
            <PrimaryBtn component={Link} to="/products">
              Browse the collection
            </PrimaryBtn>
          </Surface>
        )}

        {!loading && !isAuthenticated && (
          <Surface sx={{ p: { xs: 4, sm: 6 }, textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--t-fontFamily-display)",
                fontStyle: "italic",
                fontSize: "1.125rem",
                color: "var(--t-neutral-600)",
                marginBottom: "1.5rem",
              }}
            >
              Your wishlist travels with your account.
            </p>
            <PrimaryBtn component={Link} to="/signin">
              Sign in
            </PrimaryBtn>
            <GhostBtn component={Link} to="/signup" sx={{ ml: 1 }}>
              Create an account
            </GhostBtn>
          </Surface>
        )}

        {!loading && items.length > 0 && (
          <Box>
            {items.map((p) => {
              const img = p.images?.[0]?.url;
              const oos = p.stock === 0;
              return (
                <Box
                  key={p._id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "80px 1fr", sm: "120px 1fr auto" },
                    gap: { xs: 2, sm: 3 },
                    alignItems: "center",
                    py: 3,
                    borderBottom: "1px solid var(--t-neutral-200)",
                  }}
                >
                  <Link to={`/product/${p._id}`} style={{ display: "block" }}>
                    <Box
                      sx={{
                        width: { xs: 80, sm: 120 },
                        aspectRatio: "1 / 1",
                        backgroundColor: "var(--t-neutral-100)",
                        borderRadius: "var(--t-border-radius-base)",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {img ? (
                        <img
                          alt={p.name}
                          src={img}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : null}
                    </Box>
                  </Link>

                  <Box>
                    {p.category && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "var(--t-fontSize-xs)",
                          fontWeight: 500,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--t-neutral-500)",
                          marginBottom: 4,
                        }}
                      >
                        {p.category}
                      </span>
                    )}
                    <Link
                      to={`/product/${p._id}`}
                      style={{
                        color: "var(--t-neutral-900)",
                        textDecoration: "none",
                        fontSize: "var(--t-fontSize-base)",
                        fontWeight: 500,
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      {p.name}
                    </Link>
                    {p.numOfReviews > 0 && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Rating value={p.ratings || 0} precision={0.5} readOnly size="small" />
                        <span
                          style={{
                            fontSize: "var(--t-fontSize-sm)",
                            color: "var(--t-neutral-500)",
                          }}
                        >
                          ({p.numOfReviews})
                        </span>
                      </Box>
                    )}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                        mt: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "var(--t-fontSize-base)",
                          fontWeight: 600,
                          color: "var(--t-neutral-900)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {fmt(p.price)}
                      </span>
                      {oos && (
                        <Box
                          sx={{
                            fontSize: "var(--t-fontSize-xs)",
                            color: "var(--t-neutral-600)",
                            background: "var(--t-neutral-200)",
                            px: 1,
                            py: 0.25,
                            borderRadius: "var(--t-border-radius-sm)",
                            fontWeight: 500,
                          }}
                        >
                          Out of Stock
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      alignItems: "center",
                      justifyContent: { xs: "flex-start", sm: "flex-end" },
                      gridColumn: { xs: "1 / -1", sm: "auto" },
                    }}
                  >
                    <PrimaryBtn
                      onClick={() => handleAddToCart(p._id)}
                      disabled={oos}
                      sx={{ "&.Mui-disabled": { opacity: 0.4 } }}
                    >
                      {oos ? "Sold out" : "Add to bag"}
                    </PrimaryBtn>
                    <IconButton
                      onClick={() => toggle(p._id)}
                      aria-label={`Remove ${p.name} from wishlist`}
                      sx={{
                        color: "var(--t-neutral-500)",
                        transition:
                          "color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
                        "&:hover": { color: "var(--t-primary-600)" },
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Container>
    </>
  );
}

const BreadcrumbHeader = () => (
  <Box
    sx={{
      fontSize: "var(--t-fontSize-sm)",
      color: "var(--t-neutral-500)",
      mb: 2,
    }}
  >
    <Link to="/" style={{ color: "var(--t-neutral-500)", textDecoration: "none" }}>
      Home
    </Link>
    <span style={{ margin: "0 6px", color: "var(--t-neutral-300)" }}>›</span>
    <span style={{ color: "var(--t-neutral-900)" }}>Wishlist</span>
  </Box>
);
