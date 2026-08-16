import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SUPABASE_JWT_SECRET') || 'your_supabase_jwt_secret_here',
    });
  }

  async validate(payload: any) {
    // payload is the decoded JWT from Supabase
    if (!payload) {
      throw new UnauthorizedException();
    }
    // Return the user data to be accessible via @CurrentUser()
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
