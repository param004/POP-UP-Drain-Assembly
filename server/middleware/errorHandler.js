/** Wraps an async route handler so rejected promises reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** 404 handler for unmatched routes. */
export function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

/* eslint-disable no-unused-vars */
export function errorHandler(err, req, res, _next) {
  // Mongoose: bad ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  // Mongoose: schema validation
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: Object.fromEntries(
        Object.entries(err.errors).map(([field, e]) => [field, e.message])
      ),
    });
  }

  // Mongoose: duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] || "field";
    return res.status(409).json({ message: `That ${field} is already in use.` });
  }

  // Body parser: malformed JSON
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON." });
  }

  const status = err.status || err.statusCode || 500;
  const payload = { message: err.message || "Something went wrong." };

  if (status >= 500) console.error("[error]", err);

  // Never leak stack traces to clients outside development.
  if (process.env.NODE_ENV !== "production" && status >= 500) payload.stack = err.stack;

  return res.status(status).json(payload);
}
