import { injectable, inject } from 'tsyringe';

import { AppError } from '@shared/errors/AppError';
import { ICacheProvider } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { IUsersRepository } from '@modules/users/repositories/IUsersRepository';
import { IUserDTO } from '@modules/users/dtos/IUserDTO';
import { updateAttribute } from '@utils/mappers';
import { User } from '@modules/users/entities/User';
import { instanceToInstance } from 'class-transformer';
import { IResponseDTO } from '@dtos/IResponseDTO';
import { IConnection } from '@shared/typeorm';
import { Route, Tags, Put, Body, Path } from 'tsoa';

@Route('/users')
@injectable()
export class UpdateUserService {
  public constructor(
    @inject('UsersRepository')
    private readonly usersRepository: IUsersRepository,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProvider,

    @inject('Connection')
    private readonly connection: IConnection,
  ) {}

  @Put('{id}')
  @Tags('User')
  public async execute(
    @Body() userData: IUserDTO,
    @Path() id?: string,
  ): Promise<IResponseDTO<User>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const user = await this.usersRepository.findBy(
        { where: { id } },
        trx,
      );

      if (!user) {
        throw new AppError('NOT_FOUND', 'User not found', 404);
      }

      await this.usersRepository.update(
        updateAttribute(user, userData),
        trx,
      );

      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:users`,
      );
      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 200,
        message_code: 'UPDATED',
        message: 'Successfully updated user',
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
