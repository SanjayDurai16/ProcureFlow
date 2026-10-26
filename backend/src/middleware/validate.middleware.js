import { ZodError } from 'zod';
import { AppError } from './error.middleware.js';

export const validate = (schema, target = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', issues));
      }
      next(err);
    }
  };
};
