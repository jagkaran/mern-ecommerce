// Shared form for create + update. Keep it dumb: just collects the payload
// shape the backend expects. Submit handler is the parent's responsibility
// so the same form can drive both flows without re-mounting the fields.

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { Card, CardBody, Headline } from "../../../design/primitives";

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Percentage" },
  { value: "flat", label: "Flat amount" },
  { value: "freeShipping", label: "Free shipping" },
  { value: "tiered", label: "Tiered (qty → %)" },
  { value: "bogo", label: "Buy N get M at X% off" },
];

const STACK_POLICIES = [
  { value: "best", label: "Best discount wins (default)" },
  { value: "first", label: "First applied wins" },
  { value: "none", label: "Reject stacking" },
  { value: "allow", label: "Allow additive stacking" },
];

const EMPTY = {
  code: "",
  name: "",
  description: "",
  discountType: "percentage",
  discountValue: 10,
  tiers: [],
  bogoConfig: { buyQty: 1, getQty: 1, getPercent: 50 },
  eligibility: { minSubtotal: "", minItems: "", firstOrderOnly: false, usageLimitPerUser: "" },
  usageLimit: "",
  startAt: "",
  endAt: "",
  active: true,
  stackPolicy: "best",
};

// Convert a Date to the value <input type="datetime-local"> expects.
function fromLocalInput(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function CouponForm({ initialValues, onSubmit, busy, submitLabel = "Save" }) {
  // Coerce known null fields to safe defaults so MUI TextFields stay
  // controlled across re-renders. A `null` → `""` flip triggers React's
  // "uncontrolled → controlled" warning otherwise.
  const sanitize = (iv) => {
    if (!iv) return EMPTY;
    return {
      ...EMPTY,
      ...iv,
      discountValue: iv.discountValue ?? EMPTY.discountValue,
      usageLimit: iv.usageLimit ?? "",
      // nested
      eligibility: {
        ...EMPTY.eligibility,
        ...(iv.eligibility || {}),
        minSubtotal: iv.eligibility?.minSubtotal ?? "",
        minItems: iv.eligibility?.minItems ?? "",
        usageLimitPerUser: iv.eligibility?.usageLimitPerUser ?? "",
      },
      bogoConfig: { ...EMPTY.bogoConfig, ...(iv.bogoConfig || {}) },
    };
  };
  const [values, setValues] = useState(() => sanitize(initialValues));
  const [codeLocked] = useState(Boolean(initialValues?.code));

  // Keep form in sync if parent re-passes initialValues (e.g. after async load).
  useEffect(() => {
    if (initialValues) setValues(sanitize(initialValues));
  }, [initialValues]);

  const set = (field, value) => setValues((v) => ({ ...v, [field]: value }));
  const setElig = (field, value) =>
    setValues((v) => ({ ...v, eligibility: { ...v.eligibility, [field]: value } }));
  const setBogo = (field, value) =>
    setValues((v) => ({ ...v, bogoConfig: { ...v.bogoConfig, [field]: value } }));
  const setTier = (idx, field, value) =>
    setValues((v) => {
      const tiers = [...(v.tiers || [])];
      tiers[idx] = { ...tiers[idx], [field]: Number(value) };
      return { ...v, tiers };
    });
  const addTier = () =>
    setValues((v) => ({ ...v, tiers: [...(v.tiers || []), { minQty: 3, percent: 10 }] }));
  const removeTier = (idx) =>
    setValues((v) => ({ ...v, tiers: (v.tiers || []).filter((_, i) => i !== idx) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // Coerce the wire shape: empty strings → null, dates → ISO, numbers.
    const payload = {
      ...values,
      discountValue: values.discountValue === "" ? null : Number(values.discountValue),
      usageLimit: values.usageLimit === "" ? null : Number(values.usageLimit),
      startAt: fromLocalInput(values.startAt),
      endAt: fromLocalInput(values.endAt),
      eligibility: {
        minSubtotal:
          values.eligibility.minSubtotal === "" ? null : Number(values.eligibility.minSubtotal),
        minItems: values.eligibility.minItems === "" ? null : Number(values.eligibility.minItems),
        firstOrderOnly: Boolean(values.eligibility.firstOrderOnly),
        usageLimitPerUser:
          values.eligibility.usageLimitPerUser === ""
            ? null
            : Number(values.eligibility.usageLimitPerUser),
        allowedCategories: values.eligibility.allowedCategories || [],
        allowedProducts: values.eligibility.allowedProducts || [],
      },
    };
    if (values.discountType !== "tiered") payload.tiers = [];
    if (values.discountType !== "bogo") payload.bogoConfig = undefined;
    onSubmit(payload);
  };

  return (
    <Card>
      <CardBody>
        <Headline level="md" style={{ marginBottom: 24 }}>
          {submitLabel} coupon
        </Headline>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Code (3-32 chars, A-Z 0-9 _ -)"
                value={values.code}
                disabled={codeLocked}
                onChange={(e) => set("code", e.target.value.toUpperCase().trim())}
                inputProps={{ style: { fontFamily: "monospace" } }}
                helperText={
                  codeLocked
                    ? "Code is immutable after creation"
                    : "Shown to shoppers in upper-case"
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Internal name"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (shown in admin + offers list)"
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Discount type</InputLabel>
                <Select
                  value={values.discountType}
                  label="Discount type"
                  onChange={(e) => set("discountType", e.target.value)}
                >
                  {DISCOUNT_TYPES.map((d) => (
                    <MenuItem key={d.value} value={d.value}>
                      {d.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Discount value (% or $)"
                value={values.discountValue}
                onChange={(e) => set("discountValue", e.target.value)}
                disabled={values.discountType === "freeShipping"}
                helperText="Required for percentage / flat. Free shipping ignores."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Stack policy</InputLabel>
                <Select
                  value={values.stackPolicy}
                  label="Stack policy"
                  onChange={(e) => set("stackPolicy", e.target.value)}
                >
                  {STACK_POLICIES.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Tiered sub-form */}
            {values.discountType === "tiered" && (
              <Grid item xs={12}>
                <Box sx={{ border: "1px solid var(--t-neutral-200)", borderRadius: 1, p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Tiers
                  </Typography>
                  {(values.tiers || []).map((t, idx) => (
                    <Box key={idx} sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
                      <TextField
                        type="number"
                        label="Min qty"
                        size="small"
                        value={t.minQty}
                        onChange={(e) => setTier(idx, "minQty", e.target.value)}
                        sx={{ width: 120 }}
                      />
                      <TextField
                        type="number"
                        label="Percent off"
                        size="small"
                        value={t.percent}
                        onChange={(e) => setTier(idx, "percent", e.target.value)}
                        sx={{ width: 120 }}
                      />
                      <IconButton size="small" onClick={() => removeTier(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button size="small" startIcon={<AddIcon />} onClick={addTier}>
                    Add tier
                  </Button>
                </Box>
              </Grid>
            )}

            {/* BOGO sub-form */}
            {values.discountType === "bogo" && (
              <Grid item xs={12}>
                <Box sx={{ border: "1px solid var(--t-neutral-200)", borderRadius: 1, p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Buy N get M at X% off
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      type="number"
                      label="Buy qty"
                      size="small"
                      value={values.bogoConfig.buyQty}
                      onChange={(e) => setBogo("buyQty", Number(e.target.value))}
                    />
                    <TextField
                      type="number"
                      label="Get qty"
                      size="small"
                      value={values.bogoConfig.getQty}
                      onChange={(e) => setBogo("getQty", Number(e.target.value))}
                    />
                    <TextField
                      type="number"
                      label="Get % off"
                      size="small"
                      value={values.bogoConfig.getPercent}
                      onChange={(e) => setBogo("getPercent", Number(e.target.value))}
                    />
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Eligibility */}
            <Grid item xs={12}>
              <Box sx={{ border: "1px solid var(--t-neutral-200)", borderRadius: 1, p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Eligibility
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Min cart subtotal"
                      value={values.eligibility.minSubtotal}
                      onChange={(e) => setElig("minSubtotal", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Min items"
                      value={values.eligibility.minItems}
                      onChange={(e) => setElig("minItems", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Per-user cap"
                      value={values.eligibility.usageLimitPerUser}
                      onChange={(e) => setElig("usageLimitPerUser", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={Boolean(values.eligibility.firstOrderOnly)}
                          onChange={(e) => setElig("firstOrderOnly", e.target.checked)}
                        />
                      }
                      label="First order only"
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>

            {/* Caps + dates */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Total usage limit"
                value={values.usageLimit}
                onChange={(e) => set("usageLimit", e.target.value)}
                helperText="Empty = unlimited"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Starts at"
                InputLabelProps={{ shrink: true }}
                value={values.startAt}
                onChange={(e) => set("startAt", e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Ends at"
                InputLabelProps={{ shrink: true }}
                value={values.endAt}
                onChange={(e) => set("endAt", e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(values.active)}
                    onChange={(e) => set("active", e.target.checked)}
                  />
                }
                label="Active (visible to shoppers)"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button type="submit" variant="contained" disabled={busy}>
              {busy ? "Saving…" : submitLabel}
            </Button>
          </Box>
        </form>
      </CardBody>
    </Card>
  );
}

export default CouponForm;
export { EMPTY as EMPTY_COUPON };
