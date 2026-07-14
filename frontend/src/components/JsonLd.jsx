// components/JsonLd.jsx
// Safe JSON-LD <script> injector. dangerouslySetInnerHTML is safe here:
// input is JSON.stringify of an object we just built from typed props;
// no user-supplied raw HTML reaches this path.
export default function JsonLd({ data }) {
  if (!data) return null;
  try {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
    );
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('JsonLd: stringify failed', err);
    }
    return null;
  }
}
