import { injectable, inject } from 'tsyringe';
import { IUsersRepository } from '@modules/users/repositories/IUsersRepository';
import { ICacheProvider } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { User } from '@modules/users/entities/User';
import { instanceToInstance } from 'class-transformer';
import { ICacheDTO } from '@dtos/ICacheDTO';
import { IListDTO } from '@dtos/IListDTO';
import { IConnection } from '@shared/typeorm';
import { FindOptionsWhere } from 'typeorm';
import { Get, Route, Tags, Query, Inject } from 'tsoa';

@Route('/users')
@injectable()
export class ListUserService {
  public constructor(
    @inject('UsersRepository')
    private readonly usersRepository: IUsersRepository,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProvider,

    @inject('Connection')
    private readonly connection: IConnection,
  ) {}

  @Get()
  @Tags('User')
  public async execute(
    @Query() page: number,
    @Query() limit: number,
    @Inject() filters: FindOptionsWhere<User>,
  ): Promise<IListDTO<User>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const cacheKey = `${
        this.connection.client
      }:users:${page}:${limit}:${JSON.stringify(filters)}`;

      let cache = await this.cacheProvider.recovery<ICacheDTO<User>>(cacheKey);

      if (!cache) {
        const { list, amount } = await this.usersRepository.findAll(
          { where: filters, page, limit },
          trx,
        );
        cache = { data: instanceToInstance(list), total: amount };
        await this.cacheProvider.save(cacheKey, cache);
      }

      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 200,
        message_code: 'LISTED',
        message: 'Successfully listed users',
        pagination: {
          total: cache.total,
          page,
          perPage: limit,
          lastPage: Math.ceil(cache.total / limit),
        },
        data: cache.data,
      };
    } catch (error: unknown) {
      if (trx.isTransactionActive) await trx.rollbackTransaction();
      throw error;
    } finally {
      if (!trx.isReleased) await trx.release();
    }
  }
}
