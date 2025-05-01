import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization token is missing or invalid');
    }
    
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    // Throw an error if authentication failed or token is invalid
    if (err || !user) {
      throw new UnauthorizedException(
        err?.message || 'You are not authorized to access this resource'
      );
    }
    
    const request = context.switchToHttp().getRequest();
    request.body.userId = user.id;
    
    return user;
  }
}
