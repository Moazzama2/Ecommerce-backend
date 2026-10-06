const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  // Normalised/coerced values (e.g. "20" → 20) replace the raw query.
  req.body = value;
  next();
};

// Same contract, but for GET query strings (validate() above only
// ever looks at req.body). Express exposes `req.query` as a getter,
// so the coerced values are written back with defineProperty instead
// of a plain assignment (which throws in strict/ESM code).
export const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  Object.defineProperty(req, 'query', {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
};

export default validate;