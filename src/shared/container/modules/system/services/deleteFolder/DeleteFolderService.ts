import { injectable, inject } from 'tsyringe';

import { AppError } from '@shared/errors/AppError';

import { ICacheProviderDTO } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { IFoldersRepositoryDTO } from '@modules/system/repositories/IFoldersRepository';
import { IResponseDTO } from '@dtos/IResponseDTO';

import { IConnectionDTO } from '@shared/typeorm';
import { Route, Tags, Delete, Path } from 'tsoa';
import { IStorageProviderDTO } from '@shared/container/providers/StorageProvider/models/IStorageProvider';

@Route('/folders')
@injectable()
export class DeleteFolderService {
  public constructor(
    @inject('FoldersRepository')
    private readonly foldersRepository: IFoldersRepositoryDTO,

    @inject('StorageProvider')
    private readonly storageProvider: IStorageProviderDTO,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProviderDTO,

    @inject('Connection')
    private readonly connection: IConnectionDTO,
  ) {}

  @Delete('{id}')
  @Tags('Folder')
  public async execute(@Path() id?: string): Promise<IResponseDTO<null>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const folder = await this.foldersRepository.findBy(
        {
          where: { id },
          relations: { files: true },
          select: { files: { file: true } },
        },
        trx,
      );

      if (!folder) {
        throw new AppError('NOT_FOUND', 'Folder not found', 404);
      }

      await Promise.all(
        folder.files.map(async image => {
          return this.storageProvider.deleteFile(image.file);
        }),
      );

      await this.foldersRepository.delete({ id }, trx);

      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:folders`,
      );
      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 204,
        message_code: 'DELETED',
        message: 'Successfully deleted folder',
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
