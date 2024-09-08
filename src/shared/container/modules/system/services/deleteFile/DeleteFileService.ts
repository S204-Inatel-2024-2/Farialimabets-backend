import { injectable, inject } from 'tsyringe';

import { AppError } from '@shared/errors/AppError';

import { ICacheProviderDTO } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { IFilesRepositoryDTO } from '@modules/system/repositories/IFilesRepository';
import { IResponseDTO } from '@dtos/IResponseDTO';

import { IConnectionDTO } from '@shared/typeorm';
import { IStorageProviderDTO } from '@shared/container/providers/StorageProvider/models/IStorageProvider';
import { Route, Tags, Delete, Path } from 'tsoa';

@Route('/files')
@injectable()
export class DeleteFileService {
  public constructor(
    @inject('FilesRepository')
    private readonly filesRepository: IFilesRepositoryDTO,

    @inject('StorageProvider')
    private readonly storageProvider: IStorageProviderDTO,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProviderDTO,

    @inject('Connection')
    private readonly connection: IConnectionDTO,
  ) {}

  @Delete('{id}')
  @Tags('File')
  public async execute(@Path() id?: string): Promise<IResponseDTO<null>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const file = await this.filesRepository.findBy(
        {
          where: { id },
          select: {
            file: true,
          },
        },
        trx,
      );

      if (!file) {
        throw new AppError('NOT_FOUND', 'File not found', 404);
      }

      if (file.file) {
        await this.storageProvider.deleteFile(file.file);
      }

      await this.filesRepository.delete({ id }, trx);

      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:files`,
      );
      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:items`,
      );
      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:stocks`,
      );
      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:users`,
      );
      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:profiles`,
      );
      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 204,
        message_code: 'DELETED',
        message: 'Successfully deleted file',
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
