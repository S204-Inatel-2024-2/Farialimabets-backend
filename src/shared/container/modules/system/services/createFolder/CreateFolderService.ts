import { injectable, inject } from 'tsyringe';

import { ICacheProviderDTO } from '@shared/container/providers/CacheProvider/models/ICacheProvider';

import { IFoldersRepositoryDTO } from '@modules/system/repositories/IFoldersRepository';
import { IFolderDTO } from '@modules/system/dtos/IFolderDTO';
import { Folder } from '@modules/system/entities/Folder';
import { instanceToInstance } from 'class-transformer';
import { IResponseDTO } from '@dtos/IResponseDTO';
import { IConnectionDTO } from '@shared/typeorm';
import { GenerateSlug } from '@utils/generateSlug';
import { Route, Tags, Post, Body } from 'tsoa';

@Route('/folders')
@injectable()
export class CreateFolderService {
  private readonly generateSlug: GenerateSlug<IFoldersRepositoryDTO>;

  public constructor(
    @inject('FoldersRepository')
    private readonly foldersRepository: IFoldersRepositoryDTO,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProviderDTO,

    @inject('Connection')
    private readonly connection: IConnectionDTO,
  ) {
    this.generateSlug = new GenerateSlug(this.foldersRepository);
  }

  @Post()
  @Tags('Folder')
  public async execute(
    @Body() folderData: IFolderDTO,
  ): Promise<IResponseDTO<Folder>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      if (folderData.name) {
        folderData.slug = await this.generateSlug.execute(trx, folderData.name);
      }

      const folder = await this.foldersRepository.create(folderData, trx);

      await this.cacheProvider.invalidatePrefix(
        `${this.connection.client}:folders`,
      );
      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 201,
        message_code: 'CREATED',
        message: 'Folder successfully created',
        data: instanceToInstance(folder),
      };
    } catch (error: unknown) {
      if (trx.isTransactionActive) await trx.rollbackTransaction();
      throw error;
    } finally {
      if (!trx.isReleased) await trx.release();
    }
  }
}
