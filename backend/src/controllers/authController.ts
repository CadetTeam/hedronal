import { Request, Response } from 'express';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Dummy user data store (in production, use a database)
const dummyUsers: Array<{
  id: string;
  email: string;
  password: string;
  name: string;
}> = [
  {
    id: '1',
    email: 'demo@hedronal.com',
    password: '$2a$10$dummyhashedpassword', // In production, use bcrypt
    name: 'Demo User',
  },
];

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = dummyUsers.find((u) => u.email === validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // In production, hash password and save to database
      const newUser = {
        id: String(dummyUsers.length + 1),
        email: validatedData.email,
        password: validatedData.password, // Hash this in production
        name: validatedData.name,
      };

      dummyUsers.push(newUser);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: 'Registration failed' });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user (in production, query database)
      const user = dummyUsers.find((u) => u.email === validatedData.email);
      if (!user || user.password !== validatedData.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // In production, generate JWT token
      const token = `dummy-jwt-token-${user.id}`;

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: 'Login failed' });
    }
  },

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // In production, send password reset email
      res.json({ message: 'Password reset email sent (demo mode)' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process request' });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' });
      }

      // In production, validate token and update password
      res.json({ message: 'Password reset successful (demo mode)' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset password' });
    }
  },

  getMe: async (req: Request, res: Response) => {
    try {
      // In production, validate JWT and return user data
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Dummy user for demo
      const user = dummyUsers[0];
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user data' });
    }
  },
};
