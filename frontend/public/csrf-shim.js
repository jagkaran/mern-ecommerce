// End-to-end test shim: Playwright controls a real browser, so
// same-origin cookie access and every fetch() call carry the session
// cookie automatically. The double-submit cookie CSRF header (X-CSRF-Token)
// that the production app sets on mount is NOT required here.
//
// Pattern-matching on window.location so it runs as a plain <script>
// without needing module support.
(function () {
  if (!window.__csrfShimInstalled) {
    window.__csrfShimInstalled = true;
  }
})();
