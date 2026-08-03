import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  Box,
  InputBase,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import { useDebounce } from "../utils/useDebounce";
import { useSearchOverlay } from "../utils/searchOverlayContext";
import { useCurrency } from "../utils/currencyContext";
import { useLenisStop } from "../utils/lenis";
import { cld } from "../utils/cloudinary";

// Fullscreen search overlay — opens from header search icon. Live typeahead
// against /api/v1/products?keyword=... (backend's ApiFeatures.search does
// regex against name + description). Debounced 250ms.
export default function SearchOverlay() {
  const { open, closeOverlay } = useSearchOverlay();
  useLenisStop(open);
  const navigate = useNavigate();
  const { fmt } = useCurrency();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query, 250);

  // Reset state on close so re-opening starts fresh.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Fetch results when debounced query changes.
  useEffect(() => {
    if (!open) return undefined;
    if (!debounced.trim()) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    axios
      .get(`/api/v1/products?keyword=${encodeURIComponent(debounced.trim())}`)
      .then((res) => {
        if (cancelled) return;
        setResults(res.data?.products?.slice(0, 6) || []);
      })
      .catch(() => {
        if (cancelled) return;
        setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/products/${trimmed}`);
      closeOverlay();
    }
  };

  const handleItemClick = (id) => {
    navigate(`/product/${id}`);
    closeOverlay();
  };

  return (
    <Dialog
      open={open}
      onClose={closeOverlay}
      fullScreen
      aria-label="Search products"
      slotProps={{
        paper: { sx: { backgroundColor: "var(--t-neutral-50)" } },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1.5,
            borderBottom: "1px solid var(--t-neutral-200)",
            flexShrink: 0,
          }}
        >
          <SearchIcon sx={{ color: "var(--t-neutral-500)" }} />
          <form onSubmit={handleSubmit} style={{ flex: 1 }}>
            <InputBase
              autoFocus
              fullWidth
              placeholder="Search the collection…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              inputProps={{ "aria-label": "Search products" }}
              sx={{ fontSize: "1.125rem", fontFamily: "inherit" }}
            />
          </form>
          <IconButton onClick={closeOverlay} aria-label="Close search" size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={24} sx={{ color: "var(--t-primary-600)" }} />
            </Box>
          )}
          {!loading && debounced.trim() && results.length === 0 && (
            <Box
              sx={{
                textAlign: "center",
                py: 6,
                color: "var(--t-neutral-500)",
                fontFamily: "var(--t-fontFamily-display)",
                fontStyle: "italic",
              }}
            >
              No matches for &ldquo;{debounced}&rdquo;
            </Box>
          )}
          {!loading && !debounced.trim() && (
            <Box
              sx={{
                textAlign: "center",
                py: 6,
                color: "var(--t-neutral-500)",
                fontFamily: "var(--t-fontFamily-display)",
                fontStyle: "italic",
              }}
            >
              Type a few letters to look through the shelves.
            </Box>
          )}
          {!loading &&
            results.map((p) => (
              <Box
                key={p._id}
                onClick={() => handleItemClick(p._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleItemClick(p._id);
                  }
                }}
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  px: 2,
                  py: 1.5,
                  cursor: "pointer",
                  borderBottom: "1px solid var(--t-neutral-200)",
                  "&:hover": { backgroundColor: "var(--t-neutral-100)" },
                  "&:focus-visible": {
                    outline: "2px solid var(--t-primary-600)",
                    outlineOffset: "-2px",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "var(--t-border-radius-sm)",
                    background: "var(--t-neutral-100)",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {p.images?.[0]?.url && (
                    <img
                      src={cld(p.images[0].url, { w: 120 })}
                      alt={p.name}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      fontFamily: "var(--t-fontFamily-display)",
                      fontSize: "var(--t-fontSize-base)",
                      fontWeight: 500,
                      color: "var(--t-neutral-900)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.name}
                  </Box>
                  {p.category && (
                    <Box
                      sx={{
                        fontSize: "var(--t-fontSize-xs)",
                        color: "var(--t-neutral-500)",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {p.category}
                    </Box>
                  )}
                </Box>
                <Box
                  sx={{
                    fontFamily: "var(--t-fontFamily-display)",
                    fontWeight: 500,
                    color: "var(--t-neutral-900)",
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmt(p.price)}
                </Box>
              </Box>
            ))}
        </Box>
        {!loading && debounced.trim() && results.length > 0 && (
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderTop: "1px solid var(--t-neutral-200)",
              color: "var(--t-neutral-500)",
              fontSize: "var(--t-fontSize-sm)",
              textAlign: "center",
              fontStyle: "italic",
              fontFamily: "var(--t-fontFamily-display)",
            }}
          >
            Press Enter to see all results for &ldquo;{debounced}&rdquo;
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
