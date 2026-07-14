// utils/jsonLd.js
// Schema.org JSON-LD builders for SEO rich snippets.

export function productJsonLd(product) {
  if (!product) return null;
  const imageArr = Array.isArray(product.images)
    ? product.images.map(i => (typeof i === 'string' ? i : i?.url)).filter(Boolean)
    : [];
  // Schema.org validators (and Google's Rich Results test) flag empty `image`
  // / `review` arrays as warnings — and a single warning can suppress the
  // entire Product rich result. Drop empty arrays so the field is absent and
  // pass validation cleanly.
  const limitedReviews = (product.reviews || []).slice(0, 3);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: imageArr.length ? imageArr : undefined,
    description: product.description,
    sku: product._id,
    aggregateRating: product.avgRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.avgRating,
          reviewCount: product.numOfReviews ?? 0,
        }
      : undefined,
    review: limitedReviews.length
      ? limitedReviews.map(r => ({
          '@type': 'Review',
          author: r.name,
          datePublished: r.createdAt,
          reviewBody: r.comment,
          reviewRating: { '@type': 'Rating', ratingValue: r.rating },
        }))
      : undefined,
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Hverdag',
    url: typeof window !== 'undefined' ? window.location.origin : '',
    logo: 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_512/v1/hverdag-logo.png',
  };
}
