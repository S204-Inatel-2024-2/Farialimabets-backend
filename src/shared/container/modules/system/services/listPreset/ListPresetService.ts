import { injectable, inject } from 'tsyringe';

import { IPresetsRepositoryDTO } from '@modules/system/repositories/IPresetsRepository';
import { ICacheProviderDTO } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { Preset } from '@modules/system/entities/Preset';
import { instanceToInstance } from 'class-transformer';
import { ICacheDTO } from '@dtos/ICacheDTO';
import { IListDTO } from '@dtos/IListDTO';
import { IConnectionDTO } from '@shared/typeorm';
import { FindOptionsWhere } from 'typeorm';
import { Get, Route, Tags, Query, Inject } from 'tsoa';

@Route('/presets')
@injectable()
export class ListPresetService {
  public constructor(
    @inject('PresetsRepository')
    private readonly presetsRepository: IPresetsRepositoryDTO,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProviderDTO,

    @inject('Connection')
    private readonly connection: IConnectionDTO,
  ) {}

  @Get()
  @Tags('Preset')
  public async execute(
    @Query() page: number,
    @Query() limit: number,
    @Inject() filters: FindOptionsWhere<Preset>,
  ): Promise<IListDTO<Preset>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const cacheKey = `${
        this.connection.client
      }:presets:${page}:${limit}:${JSON.stringify(filters)}`;

      let cache = await this.cacheProvider.recovery<ICacheDTO<Preset>>(
        cacheKey,
      );

      if (!cache) {
        const { list, amount } = await this.presetsRepository.findAll(
          { where: filters, page, limit, select: { id: true, name: true } },
          trx,
        );
        cache = { data: instanceToInstance(list), total: amount };
        await this.cacheProvider.save(cacheKey, cache);
      }

      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 200,
        message_code: 'LISTED',
        message: 'Successfully listed presets',
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
