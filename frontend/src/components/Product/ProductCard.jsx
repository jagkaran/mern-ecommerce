import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Rating } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useCurrency } from '../../utils/currencyContext';
import { useWishlist } from '../../hooks/useWishlist';
import { Badge } from '../../design/primitives';
import { cld, srcset } from '../../utils/cloudinary';
import QuickViewDialog from './QuickViewDialog';

/**
 * ProductCard — Adidas-inspired.
 * - Bleed image (no padding inside media area)
 * - Hover: scale + secondary image cross-fade
 * - Top-left: badge (New, Out of Stock)
 * - Top-right: wishlist heart (real toggle via useWishlist hook)
 * - Bottom hover: Quick view button → opens modal (desktop only;
 *   touch devices skip the modal and use the image link to PDP, per
 *   mobile UX guidance)
 * - Category overline, 2-line clamp title, tabular price
 */
function ProductCard({
  id,
  _id,
  name,
  price,
  originalPrice,
  ratings,
  numOfReviews,
  images,
  stock,
  category,
  isNew = false,
  colors = [],
}) {
  const { fmt } = useCurrency();
  const { isWished, toggle } = useWishlist();
  const productId = id || _id;
  const wished = isWished(productId);
  const [hover, setHover] = useState(false);
  const [wishAnim, setWishAnim] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  const primary = images?.[0]?.url;
  const secondary = images?.[1]?.url;
  const reviewCount = Number(numOfReviews || 0);
  const onSale = originalPrice && originalPrice > price;
  const oos = stock === 0;

  const handleWish = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishAnim(true);
    setTimeout(() => setWishAnim(false), 320);
    toggle(productId);
  };

  // ponytail: button must beat the wrapping <Link>, so preventDefault +
  // stopPropagation. Desktop only — touch devices never see this bar
  // (no hover state) and deep-link to PDP via the image link.
  const openQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickOpen(true);
  };

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--t-neutral-50)',
        borderRadius: 'var(--t-border-radius-sm)',
        overflow: 'hidden',
        transition: 'transform var(--t-motion-duration-fast) var(--t-motion-easing-out)',
      }}
    >
      {/* Media — bleed, edge-to-edge */}
      <Link
        to={`/product/${productId}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        aria-label={name}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1',
            backgroundColor: 'var(--t-neutral-100)',
            overflow: 'hidden',
          }}
        >
          {primary ? (
            <>
              <img
                alt={name}
                src={cld(primary, { w: 480 })}
                srcSet={srcset(primary)}
                sizes="(max-width:600px) 50vw, (max-width:1024px) 33vw, 25vw"
                loading="lazy"
                decoding="async"
                className="product-card__image"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: hover ? 'scale(1.04)' : 'scale(1)',
                  transition:
                    'transform var(--t-motion-duration-slow) var(--t-motion-easing-out)',
                }}
              />
              {secondary && (
                <img
                  alt=""
                  src={cld(secondary, { w: 768 })}
                  srcSet={srcset(secondary)}
                  sizes="(max-width:600px) 50vw, (max-width:1024px) 33vw, 25vw"
                  loading="lazy"
                  decoding="async"
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: hover ? 1 : 0,
                    transition:
                      'opacity var(--t-motion-duration-base) var(--t-motion-easing-out)',
                  }}
                />
              )}
            </>
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--t-neutral-400)',
                fontSize: 'var(--t-fontSize-sm)',
              }}
            >
              No image
            </div>
          )}

          {/* Top-left badge */}
          {(isNew || oos) && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                display: 'flex',
                gap: 6,
                zIndex: 1,
              }}
            >
              {isNew && (
                <Badge
                  variant="warning"
                  sx={{ letterSpacing: '0.08em', fontSize: 'var(--t-fontSize-xs)' }}
                >
                  New
                </Badge>
              )}
              {oos && (
                <Badge
                  variant="neutral"
                  sx={{ letterSpacing: '0.06em', fontSize: 'var(--t-fontSize-xs)' }}
                >
                  Out of Stock
                </Badge>
              )}
            </div>
          )}

          {/* Top-right wishlist heart */}
          <button
            type="button"
            onClick={handleWish}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={wished}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 44,
              height: 44,
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: wished ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              color: wished ? 'var(--t-primary-600)' : 'var(--t-neutral-700)',
              transition:
                'background var(--t-motion-duration-fast) var(--t-motion-easing-out), transform var(--t-motion-duration-fast) var(--t-motion-easing-out)',
              transform: wishAnim ? 'scale(1.2)' : 'scale(1)',
              backdropFilter: 'blur(4px)',
              boxShadow: wished ? '0 0 0 1.5px var(--t-primary-600)' : 'none',
              zIndex: 2,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = wished
                ? 'rgba(255,255,255,0.95)'
                : 'rgba(255,255,255,0.85)')
            }
          >
            {wished ? (
              <FavoriteIcon sx={{ fontSize: 18, color: 'var(--t-primary-600)' }} />
            ) : (
              <FavoriteBorderIcon sx={{ fontSize: 18, color: 'var(--t-neutral-700)' }} />
            )}
          </button>

          {/* Hover quick-view bar — real button, opens modal on click */}
          {hover && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                padding: 12,
                background:
                  'linear-gradient(to top, rgba(28,25,23,0.55), transparent)',
                opacity: hover ? 1 : 0,
                transform: hover ? 'translateY(0)' : 'translateY(8px)',
                transition:
                  'opacity var(--t-motion-duration-base) var(--t-motion-easing-out), transform var(--t-motion-duration-base) var(--t-motion-easing-out)',
                zIndex: 1,
              }}
            >
              <button
                type="button"
                onClick={openQuickView}
                aria-label={`Quick view ${name}`}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: 'var(--t-primary-600)',
                  color: '#FFF',
                  fontSize: 'var(--t-fontSize-sm)',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  border: 'none',
                  borderRadius: 'var(--t-border-radius-sm)',
                  boxShadow: 'var(--t-shadow-md)',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                }}
              >
                Quick view
              </button>
            </div>
          )}
        </div>
      </Link>

      {/* Body — meta */}
      <div
        style={{
          padding: '14px 4px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {category && (
          <span
            style={{
              fontSize: 'var(--t-fontSize-xs)',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--t-neutral-500)',
            }}
          >
            {category}
          </span>
        )}

        <Link
          to={`/product/${productId}`}
          style={{
            textDecoration: 'none',
            color: 'var(--t-neutral-900)',
            fontSize: 'var(--t-fontSize-base)',
            fontWeight: 500,
            lineHeight: 1.35,
            letterSpacing: '0.005em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {name}
        </Link>

        {reviewCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Rating
              name={`rating-${productId}`}
              value={ratings || 0}
              precision={0.5}
              readOnly
              size="small"
            />
            <span
              style={{
                fontSize: 'var(--t-fontSize-sm)',
                color: 'var(--t-neutral-700)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {reviewCount === 1 ? '1 review' : `${reviewCount} reviews`}
            </span>
          </div>
        )}

        {colors.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
            {colors.slice(0, 4).map((c, i) => (
              <span
                key={i}
                title={c.name}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: c.hex || c,
                  border: '1px solid var(--t-neutral-200)',
                }}
              />
            ))}
            {colors.length > 4 && (
              <span
                style={{
                  fontSize: 'var(--t-fontSize-xs)',
                  color: 'var(--t-neutral-500)',
                  alignSelf: 'center',
                  marginLeft: 2,
                }}
              >
                +{colors.length - 4}
              </span>
            )}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginTop: 4,
          }}
        >
          <span
            style={{
              fontSize: 'var(--t-fontSize-base)',
              fontWeight: 600,
              color: onSale ? 'var(--t-primary-700)' : 'var(--t-neutral-900)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.01em',
            }}
          >
            {fmt(price)}
          </span>
          {onSale && (
            <span
              style={{
                fontSize: 'var(--t-fontSize-sm)',
                color: 'var(--t-neutral-400)',
                textDecoration: 'line-through',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmt(originalPrice)}
            </span>
          )}
        </div>
      </div>

      {quickOpen && (
        <QuickViewDialog
          open={quickOpen}
          productId={productId}
          onClose={() => setQuickOpen(false)}
        />
      )}
    </article>
  );
}

export default ProductCard;
