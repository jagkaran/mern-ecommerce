"use strict";

/**
 * In-place NoSQL sanitization.
 *
 * Replaces express-mongo-sanitize@2.2.0 because that version reassigns
 * `req.query = target` after walking the object — Express 5 made
 * `req.query` a getter-only property, so the reassignment throws and the
 * request 500s. The library's underlying algorithm (`delete obj[key]` for
 * any `$`-prefixed or dot-bearing key) is in-place; the offending line is
 * the outer `req[key] = target`. This file replicates the algorithm
 * without the reassignment.
 *
 * Strategy: walk each of body / params / headers; for any plain object key
 * matching /^\$/ or containing a dot, delete it. Sub-objects are recursed.
 * Arrays are walked element-by-element. Non-string keys are left untouched
 * (no normal HTTP path produces them).
 *
 * `query` needs different handling. On Express 5 `req.query` is not just
 * getter-only, it RE-PARSES the query string on every property access, so a
 * fresh object is handed back each time. Walking it in place therefore
 * mutated a throwaway copy and the handler still saw the raw operators — the
 * middleware was a silent no-op for query strings. Because app.js sets
 * `query parser: extended`, qs expands `?name[$ne]=x` into a real nested
 * object `{name: {$ne: "x"}}`, so unsanitised operators were reaching every
 * controller that reads req.query.
 *
 * The fix is to define an OWN `query` property on the request instance,
 * which shadows the prototype getter, holding the sanitised snapshot.
 * Reassignment (`req.query = x`) still throws on Express 5; defineProperty
 * does not.
 *
 * Behavior parity with express-mongo-sanitize@2.2.0:
 *  - Removes keys starting with `$` (e.g. `{$gt: 1}`) — Mongo operator
 *    injection.
 *  - Removes keys containing a dot (e.g. `{"a.b": 1}`) — prototype /
 *    nested-document smuggling.
 *  - Original behavior of `replaceWith` is intentionally NOT replicated.
 *    We have no callers passing it; the `delete` path is the only one
 *    express-mongo-sanitize@2.2.0 uses by default.
 *
 * If `req[key]` is null or undefined, skip it (matches upstream).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
const PROHIBITED = /^\$|\./;

function walk(obj) {
  if (Array.isArray(obj)) {
    for (const item of obj) walk(item);
    return;
  }
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (PROHIBITED.test(key)) {
      delete obj[key];
    } else {
      walk(obj[key]);
    }
  }
}

// `query` is handled separately below — see the note above.
const TARGETS = ["body", "params", "headers"];

function mongoSanitize(req, _res, next) {
  for (const key of TARGETS) {
    const target = req[key];
    if (target && typeof target === "object") walk(target);
  }

  // Snapshot req.query ONCE (each access re-parses), sanitise the snapshot,
  // then pin it as an own property so every later read sees the clean object.
  const query = req.query;
  if (query && typeof query === "object") {
    walk(query);
    Object.defineProperty(req, "query", {
      value: query,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }

  next();
}

module.exports = mongoSanitize;
