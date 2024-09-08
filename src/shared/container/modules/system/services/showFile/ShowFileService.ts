import { injectable, inject } from 'tsyringe';

import { AppError } from '@shared/errors/AppError';

import { IFilesRepositoryDTO } from '@modules/system/repositories/IFilesRepository';
import { File } from '@modules/system/entities/File';
import { instanceToInstance } from 'class-transformer';
import { IResponseDTO } from '@dtos/IResponseDTO';

import { IConnectionDTO } from '@shared/typeorm';
import { Get, Route, Tags, Path } from 'tsoa';

@Route('/files')
@injectable()
export class ShowFileService {
  public constructor(
    @inject('FilesRepository')
    private readonly filesRepository: IFilesRepositoryDTO,

    @inject('Connection')
    private readonly connection: IConnectionDTO,
  ) {}

  @Get('{id}')
  @Tags('File')
  public async execute(@Path() id?: string): Promise<IResponseDTO<File>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      const file = await this.filesRepository.findBy(
        {
          where: { id },
          select: {
            id: true,
            name: true,
            file: true,
            folder_id: true,
          },
        },
        trx,
      );

      if (!file) {
        throw new AppError('NOT_FOUND', 'File not found', 404);
      }

      if (trx.isTransactionActive) await trx.commitTransaction();

      return {
        code: 200,
        message_code: 'FOUND',
        message: 'File found successfully',
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
