import { Request, Response } from 'express';
import { container } from 'tsyringe';

import { IResponseDTO } from '@dtos/IResponseDTO';
import { File } from '@modules/system/entities/File';
import { IFileDTO } from '@modules/system/dtos/IFileDTO';
import { ShowFileService } from './ShowFileService';

export class ShowFileController {
  public async handle(
    request: Request<IFileDTO>,
    response: Response<IResponseDTO<File>>,
  ) {
    const showFile = container.resolve(ShowFileService);

    const { id } = request.params;

    const file = await showFile.execute(id);

    return response.status(file.code).send(file);
  }
}
