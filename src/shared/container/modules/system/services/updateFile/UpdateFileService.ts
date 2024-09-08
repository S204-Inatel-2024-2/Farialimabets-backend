import { injectable, inject } from 'tsyringe';

import { AppError } from '@shared/errors/AppError';

import { ICacheProviderDTO } from '@shared/container/providers/CacheProvider/models/ICacheProvider';

import { IFilesRepositoryDTO } from '@modules/system/repositories/IFilesRepository';
import { IFileDTO } from '@modules/system/dtos/IFileDTO';
import { updateAttribute } from '@utils/mappers';
import { File } from '@modules/system/entities/File';
import { instanceToInstance } from 'class-transformer';
import { IResponseDTO } from '@dtos/IResponseDTO';

import { IConnectionDTO } from '@shared/typeorm';
import { IStorageProviderDTO } from '@shared/container/providers/StorageProvider/models/IStorageProvider';
import { IFoldersRepositoryDTO } from '@modules/system/repositories/IFoldersRepository';
import { Route, Tags, Put, Body, Path, Consumes, UploadedFiles } from 'tsoa';

@Route('/files')
@injectable()
export class UpdateFileService {
  public constructor(
    @inject('FilesRepository')
    private readonly filesRepository: IFilesRepositoryDTO,

    @inject('FoldersRepository')
    private readonly foldersRepository: IFoldersRepositoryDTO,

    @inject('StorageProvider')
    private readonly storageProvider: IStorageProviderDTO,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProviderDTO,

    @inject('Connection')
    private readonly connection: IConnectionDTO,
  ) {}

  @Put('{id}')
  @Tags('File')
  @Consumes('multipart/form-data')
  @UploadedFiles('files')
  public async execute(
    @Body() fileData: IFileDTO,
    @Path() id?: string,
  ): Promise<IResponseDTO<File>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const folder = await this.foldersRepository.findBy(
        {
          where: [
            {
              id: fileData.folder_id,
            },
            { slug: 'hidden' },
          ],
          select: { id: true },
        },
        trx,
      );

      if (!folder) {
        throw new AppError('NOT_FOUND', 'Could not resolve folder location');
      }

      const file = await this.filesRepository.findBy({ where: { id } }, trx);

      if (!file) {
        throw new AppError('NOT_FOUND', 'File not found', 404);
      }

      if (fileData.file) {
        if (file.file) await this.storageProvider.deleteFile(file.file);
        await this.storageProvider.saveFile(fileData.file);
      }

      await this.filesRepository.update(
        updateAttribute(file, { ...fileData, folder_id: folder.id }),
        trx,
      );

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
        code: 200,
        message_code: 'UPDATED',
        message: 'Successfully updated file',
        data: instanceToInstance(file),
      };
    } catch (error: unknown) {
      if (trx.isTransactionActive) await trx.rollbackTransaction();
      throw error;
    } finally {
      if (!trx.isReleased) await trx.release();
    }
  }
}
