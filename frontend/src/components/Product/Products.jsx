import {
  Pagination,
  Typography,
  Box,
  MenuItem,
  TextField,
  Chip,
  Skeleton,
  Button,
  Drawer,
  IconButton,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import CloseIcon from "@mui/icons-material/Close";
import React, { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { useCurrency } from "../../utils/currencyContext";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import { getProduct, getActiveCategories } from "../../actions/productAction";
import ProductGrid from "./ProductGrid";
import Seo from "../Seo";
import {
  Overline,
  Headline,
  BodyText,
  GhostBtn,
  Breadcrumb,
  PrimaryBtn,
} from "../../design/primitives";
import PlpFilterContent from "./PlpFilterContent";
import { useLenisStop } from "../../utils/lenis";

const ratingLabels = { 0: "Any", 1: "1+", 2: "2+", 3: "3+", 4: "4+", 5: "5 only" };

function Products() {
  const toast = useToast();
  const { fmt } = useCurrency();
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const [price, setPrice] = useState([0, 5000]);
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get("category") || "";
  const [category, setCategory] = useState(urlCategory);
  const [ratingValue, setRatingValue] = useState(0);
  const urlSort = searchParams.get("sort") || "newest";
  const [sort, setSort] = useState(urlSort);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  // Pause Lenis while the mobile filter drawer is open.
  useLenisStop(mobileFiltersOpen);

  const { loading, error, products, productsCount, resultPerPage, filteredProductsCount } =
    useSelector((state) => state.product);

  const { keyword } = useParams();

  const {
    categories,
    categoryCounts,
    priceRange: dbPriceRange,
  } = useSelector((state) => state.categories);

  const hasActiveFilters =
    !!category ||
    ratingValue > 0 ||
    priceRange[0] > (dbPriceRange?.min ?? 0) ||
    priceRange[1] < (dbPriceRange?.max ?? 5000);

  // Shared filter props — desktop sidebar AND mobile drawer render the same
  // <PlpFilterContent> with this prop bag. Declared after all useSelector
  // calls so `categories` is in scope.
  const filterProps = {
    categories,
    categoryCounts,
    category,
    productsCount,
    setSearchParams,
    setCurrentPage,
    price,
    setPrice,
    priceRange,
    setPriceRange,
    dbPriceRange,
    ratingValue,
    setRatingValue,
  };

  // Count of active filters (drives button badge + drawer title)
  const activeFilterCount =
    (category ? 1 : 0) +
    (ratingValue > 0 ? 1 : 0) +
    (priceRange[0] > (dbPriceRange?.min ?? 0) ||
    priceRange[1] < (dbPriceRange?.max ?? 5000)
      ? 1
      : 0);

  const numberOfPages = Math.floor((filteredProductsCount + resultPerPage - 1) / resultPerPage);

  const setCurrentPageNo = (e, value) => setCurrentPage(value);

  useEffect(() => {
    dispatch(getActiveCategories());
  }, [dispatch]);

  // URL is source of truth for category — keeps header sub-menu links,
  // sidebar filter clicks, and browser back/forward all in sync.
  useEffect(() => {
    setCategory(urlCategory);
    setCurrentPage(1);
  }, [urlCategory]);

  useEffect(() => {
    setSort(urlSort);
    setCurrentPage(1);
  }, [urlSort]);

  // Once the categories payload arrives, snap the slider to real min/max.
  // Guards against stale-cache responses that omit `priceRange` (server
  // restart flushes the in-memory cache).
  useEffect(() => {
    const { min, max } = dbPriceRange || {};
    if (Number.isFinite(min) && Number.isFinite(max) && max > min) {
      setPrice([min, max]);
      setPriceRange([min, max]);
    }
  }, [dbPriceRange]);

  useEffect(() => {
    if (error) return toast.error(error);
    dispatch(getProduct(keyword, currentPage, priceRange, category, ratingValue, sort));
  }, [dispatch, error, toast, keyword, currentPage, priceRange, category, ratingValue, sort]);

  return (
    <>
      <Seo
        title={`${keyword ? `${keyword} · ` : ""}Shop | Hverdag`}
        description="Everyday essentials, carefully sourced. The full collection."
        path="/products"
      />

      <Box
        component="header"
        sx={{
          py: { xs: 5, md: 8 },
          px: "var(--t-grid-containerPad)",
          borderBottom: "1px solid var(--t-neutral-200)",
          backgroundColor: "var(--t-neutral-50)",
        }}
      >
        <Box sx={{ maxWidth: "var(--t-grid-containerMax)", mx: "auto" }}>
          <Breadcrumb
            items={[
              { label: "Home", to: "/" },
              ...(category
                ? [{ label: "Shop", to: "/products" }, { label: category }]
                : keyword
                  ? [{ label: "Shop", to: "/products" }, { label: `Search · ${keyword}` }]
                  : [{ label: "Shop" }]),
            ]}
          />
          <Overline sx={{ display: "block", mb: 1, color: "var(--t-neutral-500)" }}>
            {keyword ? `Search · ${keyword}` : "The collection"}
          </Overline>
          <Headline level="3xl" style={{ maxWidth: "32ch" }}>
            {keyword ? `Pieces the room around "${keyword}"` : "Pieces made to live with you"}
          </Headline>
          <BodyText
            sx={{ mt: 2, color: "var(--t-neutral-500)", maxWidth: "var(--t-measure-base)" }}
          >
            {productsCount} {productsCount === 1 ? "piece" : "pieces"} in the collection. Filter
            quietly on the left.
          </BodyText>
        </Box>
      </Box>

      {loading ? (
        <Box
          sx={{
            maxWidth: "var(--t-grid-containerMax)",
            mx: "auto",
            px: "var(--t-grid-containerPad)",
            py: { xs: 4, md: 6 },
          }}
        >
          <Box className="filter-grid" sx={{ alignItems: "start" }}>
            {/* Filter rail skeleton (desktop only — matches real layout) */}
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Skeleton
                variant="text"
                width={120}
                height={20}
                sx={{ bgcolor: "var(--t-neutral-100)", mb: 2 }}
              />
              {[0, 1, 2].map((i) => (
                <Skeleton
                  key={i}
                  variant="text"
                  width={`${70 + i * 10}%`}
                  height={18}
                  sx={{ bgcolor: "var(--t-neutral-100)", mb: 1.5 }}
                />
              ))}
              <Skeleton
                variant="rounded"
                width="100%"
                height={80}
                sx={{ bgcolor: "var(--t-neutral-100)", mt: 3 }}
              />
            </Box>
            {/* Card grid skeleton — 8 cards matching prod-grid */}
            <Box className="prod-grid" sx={{ display: "grid", gap: "24px" }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Box key={i}>
                  <Skeleton
                    variant="rectangular"
                    sx={{
                      width: "100%",
                      aspectRatio: "4/5",
                      borderRadius: "var(--t-border-radius-base)",
                      bgcolor: "var(--t-neutral-100)",
                    }}
                  />
                  <Skeleton
                    variant="text"
                    width="40%"
                    height={14}
                    sx={{ bgcolor: "var(--t-neutral-100)", mt: 1.5 }}
                  />
                  <Skeleton
                    variant="text"
                    width="85%"
                    height={22}
                    sx={{ bgcolor: "var(--t-neutral-100)", mt: 0.5 }}
                  />
                  <Skeleton
                    variant="text"
                    width="50%"
                    height={18}
                    sx={{ bgcolor: "var(--t-neutral-100)", mt: 0.5 }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            maxWidth: "var(--t-grid-containerMax)",
            mx: "auto",
            px: "var(--t-grid-containerPad)",
            py: { xs: 4, md: 6 },
          }}
        >
          <Box className="filter-grid" sx={{ alignItems: "start" }}>
            {/* Mobile: filter button opens bottom-sheet drawer */}
            <Box sx={{ display: { xs: "block", md: "none" }, mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setMobileFiltersOpen(true)}
                startIcon={<TuneIcon fontSize="small" />}
                sx={{
                  borderColor: "var(--t-neutral-300)",
                  color: "var(--t-neutral-900)",
                  textTransform: "none",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  "&:hover": {
                    borderColor: "var(--t-primary-700)",
                    backgroundColor: "var(--t-primary-50)",
                  },
                }}
              >
                Filters {hasActiveFilters && `· ${activeFilterCount}`}
              </Button>
            </Box>

            {/* Desktop: filter sidebar */}
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <PlpFilterContent {...filterProps} />
            </Box>

            {/* Grid + sort + pagination */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="body2" sx={{ color: "var(--t-neutral-500)" }}>
                  {filteredProductsCount} {filteredProductsCount === 1 ? "result" : "results"}
                </Typography>
                <TextField
                  select
                  size="small"
                  value={sort}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSort(next);
                    setCurrentPage(1);
                    const params = {};
                    if (category) params.category = category;
                    if (next && next !== "newest") params.sort = next;
                    setSearchParams(params);
                  }}
                  sx={{
                    minWidth: 180,
                    "& .MuiOutlinedInput-root": {
                      fontFamily: "var(--t-fontFamily-display)",
                      fontSize: "var(--t-fontSize-sm)",
                    },
                  }}
                >
                  <MenuItem value="newest">Newest</MenuItem>
                  <MenuItem value="price-asc">Price ↑ (low to high)</MenuItem>
                  <MenuItem value="price-desc">Price ↓ (high to low)</MenuItem>
                  <MenuItem value="rating-desc">Rating (high to low)</MenuItem>
                  <MenuItem value="name-asc">Name (A–Z)</MenuItem>
                </TextField>
              </Box>

              {hasActiveFilters && (
                <Box
                  role="region"
                  aria-label="Active filters"
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  {category && (
                    <Chip
                      size="small"
                      label={category}
                      onDelete={() => {
                        setSearchParams((prev) => {
                          const next = new URLSearchParams(prev);
                          next.delete("category");
                          return next;
                        });
                        setCurrentPage(1);
                      }}
                      sx={{ bgcolor: "var(--t-neutral-100)", color: "var(--t-neutral-700)" }}
                    />
                  )}
                  {ratingValue > 0 && (
                    <Chip
                      size="small"
                      label={`${ratingValue}+ stars`}
                      onDelete={() => {
                        setRatingValue(0);
                        setCurrentPage(1);
                      }}
                      sx={{ bgcolor: "var(--t-neutral-100)", color: "var(--t-neutral-700)" }}
                    />
                  )}
                  {(priceRange[0] > (dbPriceRange?.min ?? 0) ||
                    priceRange[1] < (dbPriceRange?.max ?? 5000)) && (
                    <Chip
                      size="small"
                      label={`${fmt(priceRange[0])} – ${fmt(priceRange[1])}`}
                      onDelete={() => {
                        const min = dbPriceRange?.min ?? 0;
                        const max = dbPriceRange?.max ?? 5000;
                        setPrice([min, max]);
                        setPriceRange([min, max]);
                        setCurrentPage(1);
                      }}
                      sx={{ bgcolor: "var(--t-neutral-100)", color: "var(--t-neutral-700)" }}
                    />
                  )}
                  <GhostBtn
                    onClick={() => {
                      setSearchParams({});
                      const min = dbPriceRange?.min ?? 0;
                      const max = dbPriceRange?.max ?? 5000;
                      setPrice([min, max]);
                      setPriceRange([min, max]);
                      setRatingValue(0);
                      setCurrentPage(1);
                    }}
                    sx={{ ml: "auto" }}
                  >
                    Clear all
                  </GhostBtn>
                </Box>
              )}

              <ProductGrid products={products} />

              {resultPerPage < filteredProductsCount && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
                  <Pagination
                    count={numberOfPages}
                    onChange={setCurrentPageNo}
                    page={currentPage}
                    sx={{
                      "& .MuiPaginationItem-root": {
                        fontFamily: "var(--t-fontFamily-display)",
                        color: "var(--t-neutral-700)",
                      },
                      "& .Mui-selected": {
                        backgroundColor: "var(--t-primary-600) !important",
                        color: "#FFF !important",
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>

          {/* Mobile filter drawer — bottom-sheet, full filter body, sticky
              Show results CTA. useLenisStop (declared at top of component)
              pauses page scroll while open. Plain Drawer (not SwipeableDrawer)
              because the swipe variant intercepts touch events and blocks the
              scrollable body — swipe-to-close is sacrificed for scrollability. */}
          <Drawer
            anchor="bottom"
            open={mobileFiltersOpen}
            onClose={() => setMobileFiltersOpen(false)}
            aria-label="Filter products"
            slotProps={{
              paper: {
                sx: {
                  maxHeight: "92vh",
                  borderTopLeftRadius: "var(--t-border-radius-lg)",
                  borderTopRightRadius: "var(--t-border-radius-lg)",
                  backgroundColor: "var(--t-neutral-50)",
                },
              },
            }}
          >
            <Box sx={{ maxHeight: "92vh", overflowY: "auto" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 3,
                  py: 2,
                  borderBottom: "1px solid var(--t-neutral-200)",
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  backgroundColor: "var(--t-neutral-50)",
                }}
              >
                <Headline
                  level="2xl"
                  sx={{ fontFamily: "var(--t-fontFamily-display)", fontSize: "1.5rem" }}
                >
                  Filters
                </Headline>
                <IconButton
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close filters"
                  size="small"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ px: 3, py: 2 }}>
                <PlpFilterContent {...filterProps} />
              </Box>
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  borderTop: "1px solid var(--t-neutral-200)",
                  position: "sticky",
                  bottom: 0,
                  zIndex: 1,
                  backgroundColor: "var(--t-neutral-50)",
                }}
              >
                <PrimaryBtn
                  fullWidth
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  Show results
                </PrimaryBtn>
              </Box>
            </Box>
          </Drawer>
        </Box>
      )}
    </>
  );
}

export default Products;
