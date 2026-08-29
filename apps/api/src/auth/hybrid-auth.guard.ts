import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class HybridAuthGuard extends AuthGuard(['supabase', 'api-key']) {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | import('rxjs').Observable<boolean> {
    // If request contains API key headers, Passport resolves via api-key strategy fallback.
    return super.canActivate(context);
  }
}
