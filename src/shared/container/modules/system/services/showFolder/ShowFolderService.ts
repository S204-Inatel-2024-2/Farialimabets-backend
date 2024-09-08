import { injectable, inject } from 'tsyringe';

import { AppError } from '@shared/errors/AppError';

import { IFoldersRepositoryDTO } from '@modules/system/repositories/IFoldersRepository';
import { Folder } from '@modules/system/entities/Folder';
import { instanceToInstance } from 'class-transformer';
import { IResponseDTO } from '@dtos/IResponseDTO';

import { IConnectionDTO } from '@shared/typeorm';
import { Get, Route, Tags, Path } from 'tsoa';

@Route('/folders')
@injectable()
export class ShowFolderService {
  public constructor(
    @inject('FoldersRepository')
    private readonly foldersRepository: IFoldersRepositoryDTO,

    @inject('Connection')
    private readonly connection: IConnectionDTO,
  ) {}

  @Get('{id}')
  @Tags('Folder')
  public async execute(@Path() id?: string): Promise<IResponseDTO<Folder>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const folder = await this.foldersRepository.findBy(
        { where: { id }, select: { id: true, name: true, slug: true } },
        trx,
      );

      if (!folder) {
        throw new AppError('NOT_FOUND', 'Folder not found', 404);
      }

      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 200,
        message_code: 'FOUND',
        message: 'Folder found successfully',
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
