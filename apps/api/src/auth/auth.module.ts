import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { SupabaseStrategy } from './supabase.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot(), // Setup env variables
    PassportModule.register({ defaultStrategy: 'supabase' }),
    UsersModule,
  ],
  providers: [SupabaseStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
