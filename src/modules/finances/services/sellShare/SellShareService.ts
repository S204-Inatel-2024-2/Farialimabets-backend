import { IResponseDTO } from '@dtos/IResponseDTO';
import { IShareDTO } from '@modules/finances/dtos/IShareDTO';
import { Share } from '@modules/finances/entities/Share';
import { ISharesRepository } from '@modules/finances/repositories/ISharesRepository';
import { IWalletsRepository } from '@modules/finances/repositories/IWalletsRepository';
import { IUsersRepository } from '@modules/users/repositories/IUsersRepository';
import { ICacheProvider } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { AppError } from '@shared/errors/AppError';
import { IConnection } from '@shared/typeorm';
import { instanceToInstance } from 'class-transformer';
import { Route, Post, Tags, Body, Inject } from 'tsoa';
import { injectable, inject } from 'tsyringe';

@injectable()
@Route('/sell-shares')
export class SellShareService {
  public constructor(
    @inject('WalletsRepository')
    private readonly walletsRepository: IWalletsRepository,

    @inject('SharesRepository')
    private readonly sharesRepository: ISharesRepository,

    @inject('UsersRepository')
    private readonly usersRepository: IUsersRepository,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProvider,

    @inject('Connection')
    private readonly connection: IConnection,
  ) {}

  @Post('/sell-shares')
  @Tags('Shares')
  public async execute(
    @Inject() user_id: string,
    @Body() shareData: IShareDTO,
  ): Promise<IResponseDTO<Share>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();

    try {
      const user = await this.usersRepository.findBy(
        { where: { id: user_id }, relations: { wallet: true } },
        trx,
      );

      if (!user) {
        throw new AppError('BAD_REQUEST', 'User not found', 400);
      }

      if (!shareData.quantity || !shareData.value) {
        throw new AppError(
          'BAD_REQUEST',
          'Quantity and value are required',
          400,
        );
      }

      const share = await this.sharesRepository.findBy(
        {
          where: { user_id, company: shareData.company },
        },
        trx,
      );

      if (!share || share.quantity < shareData.quantity) {
        throw new AppError('BAD_REQUEST', 'Insufficient shares to sell', 400);
      }

      const saleValue = shareData.quantity * shareData.value;

      share.quantity -= shareData.quantity;
      share.total_value = share.quantity * share.purchase_price;

      if (!share.quantity) {
        await this.sharesRepository.delete({ id: share.id }, trx);
      } else {
        await this.sharesRepository.update(share, trx);
      }

      user.wallet.value += saleValue;
      if (!user.wallet.last_transactions.length) {
        user.wallet.last_transactions = [];
      }

      user.wallet.last_transactions.push({
        sold_value: shareData?.value,
        quantity: shareData?.quantity,
        company: shareData?.company ?? 'no-company',
        profit: saleValue - shareData.quantity * share.purchase_price,
      });

      await this.walletsRepository.update(user.wallet, trx);

      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:shares:${user_id}`,
      );

      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 200,
        message_code: 'SUCCESS',
        message: 'Share sold successfully',
        data: instanceToInstance(share),
      };
    } catch (error: unknown) {
      if (trx.isTransactionActive) await trx.rollbackTransaction();
      throw error;
    } finally {
      if (!trx.isReleased) await trx.release();
    }
  }
}
