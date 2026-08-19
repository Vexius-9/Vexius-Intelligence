import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SolanaAuthService } from './solana-auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: SolanaAuthService) {}

  @Post('nonce')
  @HttpCode(HttpStatus.OK)
  async getNonce(@Body('walletAddress') walletAddress: string) {
    if (!walletAddress) {
      return { error: 'Wallet address is required' };
    }
    const message = this.authService.generateNonce(walletAddress);
    return { message };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifySignature(
    @Body('walletAddress') walletAddress: string,
    @Body('signature') signature: string,
  ) {
    if (!walletAddress || !signature) {
      return { error: 'Wallet address and signature are required' };
    }
    return this.authService.verifySignature(walletAddress, signature);
  }
}
