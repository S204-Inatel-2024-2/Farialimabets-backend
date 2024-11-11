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
import { Body, Post, Route, Tags } from 'tsoa';
import { inject, injectable } from 'tsyringe';

@injectable()
@Route('/shares')
export class BuyShareService {
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

  @Post()
  @Tags('Shares')
  public async execute(
    user_id: string,
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

      const saleValue = shareData.quantity * shareData.value;

      if ((user.wallet?.value ?? 0) < saleValue) {
        throw new AppError(
          'BAD_REQUEST',
          'Insufficient balance to buy shares',
          400,
        );
      }

      let share = await this.sharesRepository.findBy(
        {
          where: { user_id, company: shareData.company },
        },
        trx,
      );

      if (!share) {
        shareData.purchase_price = shareData.value;
        shareData.total_value = saleValue;
        share = await this.sharesRepository.create({ ...shareData, user }, trx);
      } else {
        const totalCurrentValue = share.quantity * share.purchase_price;
        const totalNewValue = shareData.quantity * shareData.value;

        const totalQuantity = share.quantity + shareData.quantity;
        const newAveragePrice =
          (totalCurrentValue + totalNewValue) / totalQuantity;

        share.purchase_price = newAveragePrice;
        share.quantity = totalQuantity;

        share.total_value += totalNewValue;

        share = await this.sharesRepository.update(share, trx);
      }

      user.wallet.value -= saleValue;
      await this.walletsRepository.update(user.wallet, trx);

      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:shares:${user_id}`,
      );

      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 200,
        message_code: 'SUCCESS',
        message: 'Share bought successfully',
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
