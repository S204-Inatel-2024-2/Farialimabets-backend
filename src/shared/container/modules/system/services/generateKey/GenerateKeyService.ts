import 'reflect-metadata';
import { ICryptoProviderDTO } from '@shared/container/providers/CryptoProvider/models/ICryptoProvider';
import { JWK } from 'pem-jwk';
import { injectable, inject } from 'tsyringe';
import { Get, Route, Tags } from 'tsoa';

@Route('/generate-keys')
@injectable()
export class GenerateKeyService {
  public constructor(
    @inject('CryptoProvider')
    private readonly cryptoProvider: ICryptoProviderDTO,
  ) {}

  @Get()
  @Tags('System')
  public async execute(): Promise<
    JWK<{
      use: string;
    }>
  > {
    return this.cryptoProvider.generateKeys();
  }
}
