import { injectable, inject } from 'tsyringe';
import { ICacheProviderDTO } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { IFilesRepositoryDTO } from '@modules/system/repositories/IFilesRepository';
import { File } from '@modules/system/entities/File';
import { instanceToInstance } from 'class-transformer';
import { IResponseDTO } from '@dtos/IResponseDTO';
import { IConnectionDTO } from '@shared/typeorm';
import { IStorageProviderDTO } from '@shared/container/providers/StorageProvider/models/IStorageProvider';
import { IFoldersRepositoryDTO } from '@modules/system/repositories/IFoldersRepository';
import { AppError } from '@shared/errors/AppError';
import { ICreateFileDTO } from '@modules/system/dtos/ICreateFileDTO';
import { IFileDTO } from '@modules/system/dtos/IFileDTO';
import { Route, Tags, Post, Body, Consumes, UploadedFiles } from 'tsoa';

@Route('/files')
@injectable()
export class CreateFileService {
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

  @Post()
  @Tags('File')
  @Consumes('multipart/form-data')
  @UploadedFiles('files')
  public async execute(
    @Body() fileData: ICreateFileDTO,
  ): Promise<IResponseDTO<Array<File>>> {
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
        throw new AppError(
          'CAN_NOT_RESOLVE_RELATION',
          'Could not resolve folder location',
        );
      }

      const fileDataArray: Array<IFileDTO> = [];

      fileData.files.map(async file => {
        fileDataArray.push({
          folder_id: folder.id,
          file: file.file,
          name: file.name,
        });

        return this.storageProvider.saveFile(file.file);
      });

      const file = await this.filesRepository.createMany(fileDataArray, trx);

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
        code: 201,
        message_code: 'CREATED',
        message: 'File successfully created',
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
