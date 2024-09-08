import { IFolderDTO } from '@modules/system/dtos/IFolderDTO';
import { Request, Response } from 'express';
import { container } from 'tsyringe';

import { Folder } from '@modules/system/entities/Folder';
import { IResponseDTO } from '@dtos/IResponseDTO';
import { CreateFolderService } from './CreateFolderService';

export class CreateFolderController {
  public async handle(
    request: Request<never, never, IFolderDTO>,
    response: Response<IResponseDTO<Folder>>,
  ) {
    const folderData: IFolderDTO = request.body;

    const createFolder = container.resolve(CreateFolderService);

    const folder = await createFolder.execute(folderData);

    return response.status(folder.code).send(folder);
  }
}
