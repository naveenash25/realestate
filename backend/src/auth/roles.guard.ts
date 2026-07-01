import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', ctx.getHandler())
      ?? this.reflector.get<string[]>('roles', ctx.getClass());
    if (!roles) return true;
    const { user } = ctx.switchToHttp().getRequest();
    return !!user && roles.includes(user.role);
  }
}
