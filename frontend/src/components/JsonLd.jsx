// components/JsonLd.jsx
// Safe JSON-LD <script> injector.
// Unicode-escapes `<`, `>`, `&`, U+2028, U+2029 to neutralize the
// </script> breakout that raw JSON.stringify permits in inline <script>
// bodies. See https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
export default function JsonLd({ data }) {
  if (!data) return null;
  try {
    const safe = JSON.stringify(data)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(new RegExp('\\u2028', 'g'), '\\u2028')
      .replace(new RegExp('\\u2029', 'g'), '\\u2029');
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('JsonLd: stringify failed', err);
    }
    return null;
  }
}
