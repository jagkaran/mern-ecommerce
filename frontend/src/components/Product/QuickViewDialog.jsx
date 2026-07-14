import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  IconButton,
  Rating,
  Box,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { useCurrency } from '../../utils/currencyContext';
import { useToast } from '../../hooks/useToast';
import { cld, srcset } from '../../utils/cloudinary';
import {
  clearErrors,
  getProductDetails,
} from '../../actions/productAction';
import { addItemsToCart } from '../../actions/cartAction';
import {
  Headline,
  BodyText,
  Overline,
  QtyStepper,
  Badge,
  PrimaryBtn,
  SecondaryBtn,
} from '../../design/primitives';

// Quick-view modal — essentials only: image, name, price, variations, qty,
// Add to Cart, View Full Details link. Reuses /api/v1/product/:id so the
// response is served from the same cache as the PDP route.
function QuickViewDialog({ open, productId, onClose }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { fmt } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const { product, loading, error } = useSelector(
    (state) => state.productDetails
  );

  // ponytail: refetch on open, not on mount — modal sits dormant until clicked.
  useEffect(() => {
    if (open && productId) {
      setQuantity(1);
      setImgIdx(0);
      dispatch(getProductDetails(productId));
    }
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
  }, [open, productId, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addItemsToCart(product._id, quantity));
    toast.success(`${product.name} Added to Cart`);
    onClose();
  };

  const images = product?.images || [];
  const colors =
    product?.colors || (product?.color ? [product.color] : []);
  const oos = !product || product.stock === 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="quickview-title"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 'var(--t-border-radius-md)',
            backgroundColor: 'var(--t-neutral-50)',
            overflow: 'hidden',
            maxHeight: { xs: '90vh', md: '85vh' },
          },
        },
      }}
    >
      <IconButton
        onClick={onClose}
        aria-label="Close quick view"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 2,
          color: 'var(--t-neutral-700)',
          backgroundColor: 'rgba(255,255,255,0.9)',
          '&:hover': { backgroundColor: '#FFF' },
        }}
      >
        <CloseIcon />
      </IconButton>

      {loading || !product ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 320,
          }}
        >
          <CircularProgress sx={{ color: 'var(--t-primary-600)' }} />
        </Box>
      ) : (
        <DialogContent
          sx={{
            p: 0,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 0,
          }}
        >
          {/* Media column */}
          <Box
            sx={{
              backgroundColor: 'var(--t-neutral-100)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: { xs: 2, md: 4 },
              minHeight: { xs: 240, md: 420 },
            }}
          >
            {images[imgIdx]?.url && (
              <img
                src={cld(images[imgIdx].url, { w: 480 })}
                srcSet={srcset(images[imgIdx].url)}
                sizes="(max-width:600px) 100vw, 50vw"
                alt={product.name}
                loading="lazy"
                decoding="async"
                style={{
                  maxWidth: '100%',
                  maxHeight: 360,
                  objectFit: 'contain',
                }}
              />
            )}
            {images.length > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  mt: 2,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {images.slice(0, 4).map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImgIdx(i)}
                    aria-label={`Image ${i + 1}`}
                    aria-current={i === imgIdx}
                    style={{
                      width: 48,
                      height: 48,
                      border:
                        i === imgIdx
                          ? '2px solid var(--t-primary-600)'
                          : '1px solid var(--t-neutral-200)',
                      borderRadius: 'var(--t-border-radius-sm)',
                      padding: 0,
                      background: '#FFF',
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={img.url}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </button>
                ))}
              </Box>
            )}
          </Box>

          {/* Info column */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              p: { xs: 3, md: 4 },
              overflowY: 'auto',
            }}
          >
            {product.category && (
              <Overline sx={{ color: 'var(--t-neutral-500)' }}>
                {product.category}
              </Overline>
            )}

            <Headline
              id="quickview-title"
              level="2xl"
              sx={{ fontFamily: 'var(--t-fontFamily-display)' }}
            >
              {product.name}
            </Headline>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Rating
                value={product.ratings || 0}
                precision={0.5}
                readOnly
                size="small"
                sx={{ color: 'var(--t-primary-600)' }}
              />
              <BodyText small sx={{ color: 'var(--t-neutral-600)' }}>
                {product.numOfReviews || 0}{' '}
                {product.numOfReviews === 1 ? 'Review' : 'Reviews'}
              </BodyText>
            </Box>

            <Headline
              level="xl"
              sx={{
                fontFamily: 'var(--t-fontFamily-display)',
                color: 'var(--t-neutral-900)',
              }}
            >
              {fmt(product.price)}
            </Headline>

            {product.description && (
              <BodyText
                sx={{
                  color: 'var(--t-neutral-700)',
                  lineHeight: 1.6,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {product.description}
              </BodyText>
            )}

            {/* Color swatches — kept simple, no SKU mapping */}
            {colors.length > 0 && (
              <Box>
                <BodyText
                  small
                  sx={{
                    color: 'var(--t-neutral-600)',
                    mb: 1,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    fontSize: 'var(--t-fontSize-xs)',
                    fontWeight: 500,
                  }}
                >
                  Colour
                </BodyText>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {colors.slice(0, 6).map((c, i) => (
                    <span
                      key={i}
                      title={c.name || c}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: c.hex || c,
                        border: '1px solid var(--t-neutral-300)',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {!oos && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BodyText
                  small
                  sx={{
                    color: 'var(--t-neutral-600)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    fontSize: 'var(--t-fontSize-xs)',
                    fontWeight: 500,
                  }}
                >
                  Qty
                </BodyText>
                <QtyStepper
                  value={quantity}
                  min={1}
                  max={product.stock || 99}
                  onChange={setQuantity}
                  ariaLabel="Quantity"
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Badge variant={oos ? 'error' : 'success'}>
                {oos ? 'Out of Stock' : 'In Stock'}
              </Badge>
              {!oos && product.stock <= 3 && (
                <BodyText small sx={{ color: 'var(--t-neutral-600)' }}>
                  Only {product.stock} left
                </BodyText>
              )}
            </Box>

            <PrimaryBtn
              onClick={handleAddToCart}
              disabled={oos}
              startIcon={<AddShoppingCartIcon />}
              sx={{ mt: 1 }}
            >
              {oos ? 'Out of Stock' : 'Add to Cart'}
            </PrimaryBtn>

            <SecondaryBtn
              component={Link}
              to={`/product/${product._id}`}
              onClick={onClose}
              sx={{ alignSelf: 'flex-start' }}
            >
              View Full Details
            </SecondaryBtn>
          </Box>
        </DialogContent>
      )}
    </Dialog>
  );
}

export default QuickViewDialog;
