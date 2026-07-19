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
 * Strategy: walk each of body / params / headers / query; for any plain
 * object key matching /^\$/ or containing a dot, delete it. Sub-objects
 * are recursed. Arrays are walked element-by-element. Non-string keys are
 * left untouched (no normal HTTP path produces them).
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

const TARGETS = ["body", "params", "headers", "query"];

function mongoSanitize(req, _res, next) {
  for (const key of TARGETS) {
    const target = req[key];
    if (target && typeof target === "object") walk(target);
  }
  next();
}

module.exports = mongoSanitize;
