import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User, Permission } from '@shared/schema';

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: User & { permissions?: Permission[] };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: User & { permissions?: Permission[] };
}

// Middleware to authenticate user from session
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if user is in session (assumes express-session is used)
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user with role information
    const userWithRole = await storage.getUserWithRole(userId);
    
    if (!userWithRole) {
      return res.status(401).json({ error: 'Invalid user session' });
    }

    // Get user permissions
    const permissions = await storage.getUserPermissions(userId);
    
    // Attach user and permissions to request
    req.user = {
      ...userWithRole,
      permissions
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Middleware to check if user has specific permission
export function requirePermission(permissionName: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasPermission = req.user.permissions?.some(
        permission => permission.permission_name === permissionName
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permissionName 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Middleware to check if user has any of the specified permissions
export function requireAnyPermission(permissionNames: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasAnyPermission = permissionNames.some(permissionName =>
        req.user.permissions?.some(
          permission => permission.permission_name === permissionName
        )
      );

      if (!hasAnyPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: `One of: ${permissionNames.join(', ')}` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Middleware to check if user has admin role
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const isAdmin = req.user.role?.is_admin === true;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to get user permissions as string array
export function getUserPermissionNames(user: User & { permissions?: Permission[] }): string[] {
  return user.permissions?.map(p => p.permission_name) || [];
}

// Helper function to check if user has specific permission
export function userHasPermission(user: User & { permissions?: Permission[] }, permissionName: string): boolean {
  return getUserPermissionNames(user).includes(permissionName);
}

// Helper function to check if user has any of the specified permissions
export function userHasAnyPermission(user: User & { permissions?: Permission[] }, permissionNames: string[]): boolean {
  const userPermissions = getUserPermissionNames(user);
  return permissionNames.some(permission => userPermissions.includes(permission));
}

// Middleware for permission-based route filtering
export function filterRoutesByPermissions(routes: Array<{ path: string; requiredPermission: string }>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userPermissions = getUserPermissionNames(req.user);
      const allowedRoutes = routes.filter(route => 
        userPermissions.includes(route.requiredPermission)
      );

      // Attach filtered routes to request for client consumption
      req.user.allowedRoutes = allowedRoutes.map(route => route.path);

      next();
    } catch (error) {
      console.error('Route filtering error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}