// components/SkipLink.jsx
// A11y: visually hidden until focused. First focusable element on every page.
export default function SkipLink({ targetId = 'main', children = 'Skip to main content' }) {
  return (
    <a href={`#${targetId}`} className="skip-link">
      {children}
    </a>
  );
}
