import { injectable, inject } from 'tsyringe';
import { ICacheProvider } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { IUsersRepository } from '@modules/users/repositories/IUsersRepository';
import { IUserDTO } from '@modules/users/dtos/IUserDTO';
import { User } from '@modules/users/entities/User';
import { instanceToInstance } from 'class-transformer';
import { IResponseDTO } from '@dtos/IResponseDTO';
import { IConnection } from '@shared/typeorm';
import { Route, Tags, Post, Body } from 'tsoa';
import { IHashProviderDTO } from '@shared/container/providers/HashProvider/models/IHashProvider';
import { AppError } from '@shared/errors/AppError';
import { IWalletsRepository } from '@modules/finances/repositories/IWalletsRepository';

@Route('/users')
@injectable()
export class CreateUserService {
  public constructor(
    @inject('UsersRepository')
    private readonly usersRepository: IUsersRepository,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProvider,

    @inject('WalletsRepository')
    private readonly walletsRepository: IWalletsRepository,

    @inject('Connection')
    private readonly connection: IConnection,

    @inject('HashProvider')
    private readonly hashProvider: IHashProviderDTO,
  ) {}

  @Post()
  @Tags('User')
  public async execute(
    @Body() userData: IUserDTO,
  ): Promise<IResponseDTO<User>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const { password, email, ...rest } = userData;

      if (!password || !email) {
        throw new AppError('BAD_REQUEST', 'Email or password are blank', 400);
      }

      const emailExists = await this.usersRepository.exists(
        {
          where: { email },
        },
        trx,
      );

      if (emailExists) {
        throw new AppError('BAD_REQUEST', 'Email alerady exists', 400);
      }

      const hashedPassword = await this.hashProvider.generateHash(password);

      const wallet = await this.walletsRepository.create(
        {
          value: 25000,
        },
        trx,
      );

      const user = await this.usersRepository.create(
        {
          ...rest,
          email,
          password: hashedPassword,
          wallet,
          wallet_id: wallet.id,
        },
        trx,
      );

      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:users`,
      );
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
