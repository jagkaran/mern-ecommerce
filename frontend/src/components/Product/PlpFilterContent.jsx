import { Box, Slider, Typography } from "@mui/material";
import {
  FilterGroup,
  FilterOption,
  GhostBtn,
} from "../../design/primitives";

const ratingLabels = ["Any", "1★+", "2★+", "3★+", "4★+", "5★"];

// Shared filter body — used by the desktop sidebar (md+) AND the mobile
// bottom-sheet drawer. Caller owns all state; this component is pure UI.
//
// NOTE: Renders filter groups DIRECTLY (no <QuietFilter> wrapper) because
// QuietFilter ships its own mobile drawer + chip, which would conflict
// with the bottom-sheet drawer this filters-into. Render-only contract.
export default function PlpFilterContent({
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
}) {
  const hasFilters =
    !!category ||
    priceRange[0] > (dbPriceRange?.min ?? 0) ||
    priceRange[1] < (dbPriceRange?.max ?? 5000) ||
    ratingValue > 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography
        variant="overline"
        sx={{ display: "block", color: "var(--t-neutral-500)" }}
      >
        Browse
      </Typography>

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
          step={Math.max(
            1,
            Math.round(((dbPriceRange?.max ?? 5000) - (dbPriceRange?.min ?? 0)) / 100)
          )}
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

      {hasFilters && (
        <GhostBtn
          onClick={() => {
            setSearchParams({});
            setPrice([dbPriceRange?.min ?? 0, dbPriceRange?.max ?? 5000]);
            setPriceRange([dbPriceRange?.min ?? 0, dbPriceRange?.max ?? 5000]);
            setRatingValue(0);
            setCurrentPage(1);
          }}
          sx={{ alignSelf: "flex-start", mt: 1 }}
        >
          Clear filters
        </GhostBtn>
      )}
    </Box>
  );
}
