import {
  CircularProgress,
  Pagination,
  Slider,
  Typography,
  Box,
  MenuItem,
  TextField,
  Chip,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { useCurrency } from "../../utils/currencyContext";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import { getProduct, getActiveCategories } from "../../actions/productAction";
import ProductGrid from "./ProductGrid";
import Seo from "../Seo";
import {
  QuietFilter,
  FilterGroup,
  FilterOption,
  Overline,
  Headline,
  BodyText,
  GhostBtn,
  Breadcrumb,
  Disclosure,
} from "../../design/primitives";

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

  const {
    loading,
    error,
    products,
    productsCount,
    resultPerPage,
    filteredProductsCount,
  } = useSelector((state) => state.product);

  const { keyword } = useParams();

  const { categories, categoryCounts, priceRange: dbPriceRange } =
    useSelector((state) => state.categories);

  const hasActiveFilters =
    !!category ||
    ratingValue > 0 ||
    priceRange[0] > (dbPriceRange?.min ?? 0) ||
    priceRange[1] < (dbPriceRange?.max ?? 5000);

  const numberOfPages = Math.floor(
    (filteredProductsCount + resultPerPage - 1) / resultPerPage
  );

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
            {keyword
              ? `Pieces the room around "${keyword}"`
              : "Pieces made to live with you"}
          </Headline>
          <BodyText sx={{ mt: 2, color: "var(--t-neutral-500)", maxWidth: "var(--t-measure-base)" }}>
            {productsCount} {productsCount === 1 ? "piece" : "pieces"} in the collection.
            Filter quietly on the left.
          </BodyText>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 12 }}>
          <CircularProgress sx={{ color: "var(--t-primary-600)" }} />
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
            {/* Mobile filters — collapsible disclosure below 1024px */}
            <Box sx={{ display: { xs: "block", md: "none" }, mb: 2 }}>
              <Disclosure
                title={
                  hasActiveFilters
                    ? `Filters · ${
                        (category ? 1 : 0) +
                        (ratingValue > 0 ? 1 : 0) +
                        ((priceRange[0] > (dbPriceRange?.min ?? 0) ||
                          priceRange[1] < (dbPriceRange?.max ?? 5000))
                          ? 1
                          : 0)
                      } active`
                    : "Filters"
                }
                defaultOpen={false}
              >
                <QuietFilter title="Browse">
                  <FilterGroup label="Category">
                    <FilterOption
                      label="All"
                      count={productsCount}
                      active={!category}
                      onClick={() => {
                        setSearchParams({});
                        setCurrentPage(1);
                      }}
                    />
                    {categories.map((cat) => (
                      <FilterOption
                        key={cat}
                        label={cat}
                        count={categoryCounts ? categoryCounts[cat] : undefined}
                        active={category === cat}
                        onClick={() => {
                          setSearchParams({ category: cat });
                          setCurrentPage(1);
                        }}
                      />
                    ))}
                  </FilterGroup>

                  <FilterGroup label="Price">
                    <Slider
                      value={price}
                      onChange={(_, v) => setPrice(v)}
                      onChangeCommitted={(_, v) => setPriceRange(v)}
                      valueLabelDisplay="auto"
                      min={dbPriceRange?.min ?? 0}
                      max={dbPriceRange?.max ?? 5000}
                      step={Math.max(1, Math.round(((dbPriceRange?.max ?? 5000) - (dbPriceRange?.min ?? 0)) / 100))}
                      sx={{
                        color: "var(--t-primary-600)",
                        mt: 1,
                        "& .MuiSlider-thumb": {
                          transition: "all var(--t-motion-duration-fast) var(--t-motion-easing-out)",
                        },
                      }}
                    />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "var(--t-fontSize-sm)",
                        color: "var(--t-neutral-500)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <span>{price[0]}</span>
                      <span>{price[1]}</span>
                    </Box>
                  </FilterGroup>

                  <FilterGroup label="Rating">
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {[0, 1, 2, 3, 4, 5].map((r) => (
                        <FilterOption
                          key={r}
                          label={ratingLabels[r]}
                          active={ratingValue === r}
                          onClick={() => {
                            setRatingValue(r);
                            setCurrentPage(1);
                          }}
                        />
                      ))}
                    </Box>
                  </FilterGroup>

                  {(category || priceRange[0] > 0 || priceRange[1] < 5000 || ratingValue > 0) && (
                    <GhostBtn
                      onClick={() => {
                        setSearchParams({});
                        setPrice([0, 5000]);
                        setPriceRange([0, 5000]);
                        setRatingValue(0);
                        setCurrentPage(1);
                      }}
                      sx={{ alignSelf: "flex-start", mt: 1 }}
                    >
                      Clear filters
                    </GhostBtn>
                  )}
                </QuietFilter>
              </Disclosure>
            </Box>

            {/* Desktop filters — sidebar at 1024px+ */}
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <QuietFilter title="Browse">
                <FilterGroup label="Category">
                  <FilterOption
                    label="All"
                    count={productsCount}
                    active={!category}
                    onClick={() => {
                      setSearchParams({});
                      setCurrentPage(1);
                    }}
                  />
                  {categories.map((cat) => (
                    <FilterOption
                      key={cat}
                      label={cat}
                      count={categoryCounts ? categoryCounts[cat] : undefined}
                      active={category === cat}
                      onClick={() => {
                        setSearchParams({ category: cat });
                        setCurrentPage(1);
                      }}
                    />
                  ))}
                </FilterGroup>

                <FilterGroup label="Price">
                  <Slider
                    value={price}
                    onChange={(_, v) => setPrice(v)}
                    onChangeCommitted={(_, v) => setPriceRange(v)}
                    valueLabelDisplay="auto"
                    min={dbPriceRange?.min ?? 0}
                    max={dbPriceRange?.max ?? 5000}
                    step={Math.max(1, Math.round(((dbPriceRange?.max ?? 5000) - (dbPriceRange?.min ?? 0)) / 100))}
                    sx={{
                      color: "var(--t-primary-600)",
                      mt: 1,
                      "& .MuiSlider-thumb": {
                        transition: "all var(--t-motion-duration-fast) var(--t-motion-easing-out)",
                      },
                    }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "var(--t-fontSize-sm)",
                      color: "var(--t-neutral-500)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <span>{price[0]}</span>
                    <span>{price[1]}</span>
                  </Box>
                </FilterGroup>

                <FilterGroup label="Rating">
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {[0, 1, 2, 3, 4, 5].map((r) => (
                      <FilterOption
                        key={r}
                        label={ratingLabels[r]}
                        active={ratingValue === r}
                        onClick={() => {
                          setRatingValue(r);
                          setCurrentPage(1);
                        }}
                      />
                    ))}
                  </Box>
                </FilterGroup>

                {(category || priceRange[0] > 0 || priceRange[1] < 5000 || ratingValue > 0) && (
                  <GhostBtn
                    onClick={() => {
                      setSearchParams({});
                      setPrice([0, 5000]);
                      setPriceRange([0, 5000]);
                      setRatingValue(0);
                      setCurrentPage(1);
                    }}
                    sx={{ alignSelf: "flex-start", mt: 1 }}
                  >
                    Clear filters
                  </GhostBtn>
                )}
              </QuietFilter>
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
                      onDelete={() => { setRatingValue(0); setCurrentPage(1); }}
                      sx={{ bgcolor: "var(--t-neutral-100)", color: "var(--t-neutral-700)" }}
                    />
                  )}
                  {(priceRange[0] > (dbPriceRange?.min ?? 0) || priceRange[1] < (dbPriceRange?.max ?? 5000)) && (
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
        </Box>
      )}
    </>
  );
}

export default Products;