import { z } from 'zod';
import { AuthService } from './auth.service.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().pipe(z.string().email('Invalid email address')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['BUYER', 'VENDOR'], {
    errorMap: () => ({ message: 'Role must be BUYER or VENDOR' }),
  }),
  organization: z.string().trim().min(2, 'Organization must be at least 2 characters'),
  region: z.string().trim().min(2, 'Region must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.string().email('Invalid email address')),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      const user = await AuthService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }
}
