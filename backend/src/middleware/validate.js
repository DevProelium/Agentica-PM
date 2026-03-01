/**
 * Request validation middleware using Zod schemas.
 * Usage: validate({ body: schema, params: schema, query: schema })
 */
export function validate({ body, params, query } = {}) {
  return (req, res, next) => {
    try {
      if (body) {
        const result = body.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            error:   'Validation error',
            details: result.error.issues,
          });
        }
        req.body = result.data;
      }
      if (params) {
        const result = params.safeParse(req.params);
        if (!result.success) {
          return res.status(400).json({
            error:   'Validation error (params)',
            details: result.error.issues,
          });
        }
        req.params = result.data;
      }
      if (query) {
        const result = query.safeParse(req.query);
        if (!result.success) {
          return res.status(400).json({
            error:   'Validation error (query)',
            details: result.error.issues,
          });
        }
        req.query = result.data;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
