import { render } from '@testing-library/react';
import JsonLd from '../components/JsonLd';
import { productJsonLd, organizationJsonLd } from '../utils/jsonLd';

describe('productJsonLd', () => {
  it('returns null for null/undefined product', () => {
    expect(productJsonLd(null)).toBeNull();
    expect(productJsonLd(undefined)).toBeNull();
  });

  it('builds Product schema with aggregateRating', () => {
    const product = {
      _id: 'p1',
      name: 'Linen Shirt',
      description: 'A shirt',
      images: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/shirt.jpg' }],
      avgRating: 4.5,
      numOfReviews: 12,
    };
    const out = productJsonLd(product);
    expect(out['@type']).toBe('Product');
    expect(out.name).toBe('Linen Shirt');
    expect(out.sku).toBe('p1');
    expect(out.aggregateRating.ratingValue).toBe(4.5);
    expect(out.aggregateRating.reviewCount).toBe(12);
  });

  it('limits reviews to 3', () => {
    const product = {
      _id: 'p1',
      name: 'X',
      description: 'd',
      images: [{ url: 'https://example.com/x.jpg' }],
      reviews: Array.from({ length: 10 }, (_, i) => ({
        name: `r${i}`,
        createdAt: '2026-01-01',
        comment: `c${i}`,
        rating: 5,
      })),
    };
    expect(productJsonLd(product).review).toHaveLength(3);
  });

  it('omits aggregateRating when no avgRating', () => {
    const product = { _id: 'p1', name: 'X', description: 'd', images: [{ url: 'https://example.com/x.jpg' }] };
    expect(productJsonLd(product).aggregateRating).toBeUndefined();
  });

  it('omits image array when product has no images', () => {
    // Schema.org validators flag `"image": []` as a warning that can suppress
    // the entire Product rich result — instead, drop the field entirely so
    // JSON.stringify emits no `image` key.
    const product = { _id: 'p1', name: 'X', description: 'd', images: [] };
    const out = productJsonLd(product);
    expect(out.image).toBeUndefined();
    expect(JSON.stringify(out)).not.toContain('"image"');
  });

  it('omits review array when product has no reviews', () => {
    // Same rationale as images: empty review arrays trigger Rich Results warnings.
    const product = { _id: 'p1', name: 'X', description: 'd', images: [{ url: 'https://example.com/x.jpg' }] };
    const out = productJsonLd(product);
    expect(out.review).toBeUndefined();
    expect(JSON.stringify(out)).not.toContain('"review"');
  });
});

describe('organizationJsonLd', () => {
  it('returns Organization schema with name + url', () => {
    const out = organizationJsonLd();
    expect(out['@type']).toBe('Organization');
    expect(out.name).toBeTruthy();
    expect(out.url).toBeTruthy();
  });
});

describe('JsonLd XSS escapes', () => {
  it('neutralizes </script> breakout in payload', () => {
    const { container } = render(
      <JsonLd data={{ x: '</script><script>alert(1)</script>' }} />
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    // Raw `</script>` substring must NOT appear — escaped Unicode form must appear.
    expect(script.innerHTML).not.toContain('</script>');
    expect(script.innerHTML).toContain('\\u003c');
  });
});
