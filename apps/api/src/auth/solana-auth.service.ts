import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Connection, PublicKey } from '@solana/web3.js';
import * as nacl from 'tweetnacl';
import * as bs58 from 'bs58';
import * as crypto from 'crypto';

@Injectable()
export class SolanaAuthService {
  private readonly logger = new Logger(SolanaAuthService.name);
  // In-memory store for nonces. In production, use Redis.
  private nonces = new Map<string, string>();
  private solanaConnection: Connection;

  private readonly VEXIUS_TOKEN_ADDRESS: string;
  private readonly MIN_SUPPLY_REQUIRED: number;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const rpcUrl = this.configService.get<string>('SOLANA_RPC_URL');
    if (!rpcUrl) throw new Error('SOLANA_RPC_URL must be defined');
    this.solanaConnection = new Connection(rpcUrl);
    
    const tokenAddress = this.configService.get<string>('VEXIUS_TOKEN_ADDRESS');
    if (!tokenAddress) throw new Error('VEXIUS_TOKEN_ADDRESS must be defined');
    this.VEXIUS_TOKEN_ADDRESS = tokenAddress;

    const minSupply = this.configService.get<number>('MIN_SUPPLY_REQUIRED');
    if (!minSupply) throw new Error('MIN_SUPPLY_REQUIRED must be defined');
    this.MIN_SUPPLY_REQUIRED = Number(minSupply);
  }

  generateNonce(walletAddress: string): string {
    const nonce = crypto.randomBytes(32).toString('hex');
    const message = `Sign this message to authenticate with Vexius Engine.\nNonce: ${nonce}`;
    this.nonces.set(walletAddress, message);
    
    // Expire nonce after 5 minutes
    setTimeout(() => {
      this.nonces.delete(walletAddress);
    }, 5 * 60 * 1000);

    return message;
  }

  async verifySignature(walletAddress: string, signatureBase58: string): Promise<{ access_token: string }> {
    const message = this.nonces.get(walletAddress);
    
    if (!message) {
      throw new UnauthorizedException('Nonce expired or not found. Please request a new nonce.');
    }

    try {
      const publicKey = new PublicKey(walletAddress);
      const signatureBytes = bs58.decode(signatureBase58);
      const messageBytes = new TextEncoder().encode(message);

      const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes());

      if (!isValid) {
        throw new UnauthorizedException('Invalid signature');
      }

      // Check token balance
      const hasEnoughTokens = await this.checkTokenBalance(publicKey);
      if (!hasEnoughTokens) {
        throw new UnauthorizedException('Access Denied: You do not hold enough Vexius tokens (min. 1% supply).');
      }

      // Clear the nonce so it can't be reused
      this.nonces.delete(walletAddress);

      // Issue JWT
      const payload = { sub: walletAddress, role: 'holder' };
      return {
        access_token: this.jwtService.sign(payload),
      };

    } catch (error) {
      this.logger.error('Signature verification failed', error);
      throw new UnauthorizedException(error instanceof Error ? error.message : 'Authentication failed');
    }
  }

  private async checkTokenBalance(walletPublicKey: PublicKey): Promise<boolean> {
    try {
      // Fetch parsed token accounts by owner
      const response = await this.solanaConnection.getParsedTokenAccountsByOwner(walletPublicKey, {
        mint: new PublicKey(this.VEXIUS_TOKEN_ADDRESS),
      });

      if (response.value.length === 0) return false;

      const balance = response.value[0].account.data.parsed.info.tokenAmount.uiAmount;
      this.logger.log(`Wallet ${walletPublicKey.toBase58()} holds ${balance} Vexius tokens.`);
      
      return balance >= this.MIN_SUPPLY_REQUIRED;
    } catch (error) {
      this.logger.error('Failed to check token balance', error);
      // For development/mocking purposes, if the RPC fails, we might want to return true
      // But since we want strict cryptographic auth, return false.
      // NOTE: Because VEXIUS_TOKEN_ADDRESS is a dummy (USDC), no one will have 10M USDC likely.
      // So you can temporarily hardcode this to `return true` for frontend testing if you don't have the token yet.
      return false; 
    }
  }
}
