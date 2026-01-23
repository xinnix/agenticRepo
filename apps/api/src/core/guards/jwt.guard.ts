import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check for @Public decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    console.log('[JwtAuthGuard] ================================');
    console.log('[JwtAuthGuard] Error:', err?.message);
    console.log('[JwtAuthGuard] Info:', info);
    console.log('[JwtAuthGuard] Info name:', info?.name);
    console.log('[JwtAuthGuard] Info message:', info?.message);
    console.log('[JwtAuthGuard] User:', user);
    console.log('[JwtAuthGuard] ================================');

    if (err || !user) {
      throw err || new UnauthorizedException(`${info?.name || 'Unauthorized'}: ${info?.message || 'Invalid token'}`);
    }
    return user;
  }
}

// Re-export guards for convenience
export { RolesGuard } from './roles.guard';
export { PermissionsGuard } from './permissions.guard';
