import { Request, Response } from 'express';
import { container } from 'tsyringe';

import { IResponseDTO } from '@dtos/IResponseDTO';

import { IFileDTO } from '@modules/system/dtos/IFileDTO';
import { File } from '@modules/system/entities/File';

import { UpdateFileService } from './UpdateFileService';

export class UpdateFileController {
  public async handle(
    request: Request<IFileDTO, never, IFileDTO>,
    response: Response<IResponseDTO<File>>,
  ) {
    const updateFile = container.resolve(UpdateFileService);

    const { id } = request.params;
    const fileData = request.body;
    fileData.file = request.file?.filename;
    fileData.name = request.file?.originalname;

    const file = await updateFile.execute(fileData, id);

    return response.status(file.code).send(file);
  }
}
