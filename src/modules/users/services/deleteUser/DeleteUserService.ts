import { injectable, inject } from 'tsyringe';
import { AppError } from '@shared/errors/AppError';
import { ICacheProvider } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { IUsersRepository } from '@modules/users/repositories/IUsersRepository';
import { IResponseDTO } from '@dtos/IResponseDTO';
import { IConnection } from '@shared/typeorm';
import { Route, Tags, Delete, Path } from 'tsoa';

@Route('/users')
@injectable()
export class DeleteUserService {
  public constructor(
    @inject('UsersRepository')
    private readonly usersRepository: IUsersRepository,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProvider,

    @inject('Connection')
    private readonly connection: IConnection,
  ) {}

  @Delete('{id}')
  @Tags('User')
  public async execute(@Path() id?: string): Promise<IResponseDTO<null>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const user = await this.usersRepository.exists(
        { where: { id } },
        trx,
      );

      if (!user) {
        throw new AppError('NOT_FOUND', 'User not found', 404);
      }

      await this.usersRepository.delete({ id }, trx);

      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:users`,
      );
      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 204,
        message_code: 'DELETED',
        message: 'Successfully deleted user',
        data: null,
      };
    } catch (error: unknown) {
      if (trx.isTransactionActive) await trx.rollbackTransaction();
      throw error;
    } finally {
      if (!trx.isReleased) await trx.release();
    }
  }
}
