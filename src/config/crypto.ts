import { resolve } from 'node:path';

interface ICryptoConfigDTO {
  readonly driver: 'crypto';
  readonly config: {
    readonly bytes: number;
    readonly algorithm: string;
    readonly encoding: BufferEncoding;
    readonly secretKey: string;
    readonly assetsPath: string;
    readonly keysPath: string;
    readonly jwksPath: string;
  };
}

export const cryptoConfig = Object.freeze<ICryptoConfigDTO>({
  driver: 'crypto',
  config: {
    bytes: 16,
    algorithm: 'aes-256-ctr',
    encoding: 'hex',
    secretKey: process.env.CRYPTO_SECRET_KEY ?? '',
    keysPath: resolve(__dirname, '..', 'keys'),
    assetsPath: resolve(__dirname, '..', 'assets'),
    jwksPath: resolve(__dirname, '..', 'assets', '.well-known', 'jwks.json'),
  },
});
