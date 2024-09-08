import { injectable, inject } from 'tsyringe';

import { IFilesRepositoryDTO } from '@modules/system/repositories/IFilesRepository';
import { ICacheProviderDTO } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { File } from '@modules/system/entities/File';
import { instanceToInstance } from 'class-transformer';
import { ICacheDTO } from '@dtos/ICacheDTO';
import { IListDTO } from '@dtos/IListDTO';
import { IConnectionDTO } from '@shared/typeorm';
import { Get, Route, Tags, Query, Inject } from 'tsoa';
import { FindOptionsWhere } from 'typeorm';

@Route('/files')
@injectable()
export class ListFileService {
  public constructor(
    @inject('FilesRepository')
    private readonly filesRepository: IFilesRepositoryDTO,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProviderDTO,

    @inject('Connection')
    private readonly connection: IConnectionDTO,
  ) {}

  @Get()
  @Tags('File')
  public async execute(
    @Query() page: number,
    @Query() limit: number,
    @Inject() filters: FindOptionsWhere<File>,
  ): Promise<IListDTO<File>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const cacheKey = `${
        this.connection.client
      }:files:${page}:${limit}:${JSON.stringify(filters)}`;

      let cache = await this.cacheProvider.recovery<ICacheDTO<File>>(cacheKey);

      if (!cache) {
        const { list, amount } = await this.filesRepository.findAll(
          { page, limit, where: filters, select: { id: true, name: true } },
          trx,
        );
        cache = { data: instanceToInstance(list), total: amount };
        await this.cacheProvider.save(cacheKey, cache);
      }

      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 200,
        message_code: 'LISTED',
        message: 'Successfully listed files',
        data: {
          pagination: {
            total: cache.total,
            page,
            perPage: limit,
            lastPage: Math.ceil(cache.total / limit),
          },
          list: cache.data,
        },
      };
    } catch (error: unknown) {
      if (trx.isTransactionActive) await trx.rollbackTransaction();
      throw error;
    } finally {
      if (!trx.isReleased) await trx.release();
    }
  }
}
