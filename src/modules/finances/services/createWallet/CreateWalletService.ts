import { injectable, inject } from 'tsyringe';
import { ICacheProvider } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { IWalletsRepository } from '@modules/finances/repositories/IWalletsRepository';
import { IWalletDTO } from '@modules/finances/dtos/IWalletDTO';
import { Wallet } from '@modules/finances/entities/Wallet';
import { instanceToInstance } from 'class-transformer';
import { IResponseDTO } from '@dtos/IResponseDTO';
import { IConnection } from '@shared/typeorm';
import { Route, Tags, Post, Body } from 'tsoa';

@Route('/finances')
@injectable()
export class CreateWalletService {
  public constructor(
    @inject('WalletsRepository')
    private readonly walletsRepository: IWalletsRepository,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProvider,

    @inject('Connection')
    private readonly connection: IConnection,
  ) {}

  @Post()
  @Tags('Wallet')
  public async execute(
    @Body() financeData: IWalletDTO,
  ): Promise<IResponseDTO<Wallet>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const finance = await this.walletsRepository.create(financeData, trx);

      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:finances`,
      );
      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 201,
        message_code: 'CREATED',
        message: 'Wallet successfully created',
        data: instanceToInstance(finance),
      };
    } catch (error: unknown) {
      if (trx.isTransactionActive) await trx.rollbackTransaction();
      throw error;
    } finally {
      if (!trx.isReleased) await trx.release();
    }
  }
}
