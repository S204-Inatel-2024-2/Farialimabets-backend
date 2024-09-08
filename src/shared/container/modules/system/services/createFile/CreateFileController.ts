import { Request, Response } from 'express';
import { container } from 'tsyringe';

import { ICreateFileDTO } from '@modules/system/dtos/ICreateFileDTO';
import { File } from '@modules/system/entities/File';
import { IResponseDTO } from '@dtos/IResponseDTO';
import { CreateFileService } from './CreateFileService';

export class CreateFileController {
  public async handle(
    request: Request<never, never, ICreateFileDTO>,
    response: Response<IResponseDTO<Array<File>>>,
  ) {
    const fileData: ICreateFileDTO = request.body;

    if (!fileData.files) fileData.files = [];

    if (request?.files?.files) {
      request.files.files.map(file => {
        return fileData.files.push({
          file: file.filename,
          name: file.originalname,
        });
      });
    }

    const createFile = container.resolve(CreateFileService);

    const file = await createFile.execute(fileData);

    return response.status(file.code).send(file);
  }
}
