import { injectable, inject } from 'tsyringe';
import { IUsersRepository } from '@modules/users/repositories/IUsersRepository';
import { User } from '@modules/users/entities/User';
import { instanceToInstance } from 'class-transformer';
import { IResponseDTO } from '@dtos/IResponseDTO';
import { IConnection } from '@shared/typeorm';
import { Route, Tags, Get, Inject } from 'tsoa';
import { AppError } from '@shared/errors/AppError';

@Route('/me')
@injectable()
export class ShowSelfUserService {
  public constructor(
    @inject('UsersRepository')
    private readonly usersRepository: IUsersRepository,

    @inject('Connection')
    private readonly connection: IConnection,
  ) {}

  @Get()
  @Tags('User')
  public async execute(@Inject() id: string): Promise<IResponseDTO<User>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const user = await this.usersRepository.findBy(
        {
          where: { id },
          relations: {
            wallet: true,
          },
          select: {
            id: true,
            email: true,
            name: true,
            shares: true,
            wallet: { id: true, value: true, last_transactions: true },
            wallet_id: true,
          },
        },
        trx,
      );

      if (!user) {
        throw new AppError('NOT_FOUND', 'User not found', 404);
      }

      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 201,
        message_code: 'CREATED',
        message: 'User successfully created',
        data: instanceToInstance(user),
      };
    } catch (error: unknown) {
      if (trx.isTransactionActive) await trx.rollbackTransaction();
      throw error;
    } finally {
      if (!trx.isReleased) await trx.release();
    }
  }
}
