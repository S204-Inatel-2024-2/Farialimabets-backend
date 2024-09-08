import { Request, Response } from 'express';
import { container } from 'tsyringe';

import { IResponseDTO } from '@dtos/IResponseDTO';
import { IFolderDTO } from '@modules/system/dtos/IFolderDTO';
import { Folder } from '@modules/system/entities/Folder';
import { ShowFolderService } from './ShowFolderService';

export class ShowFolderController {
  public async handle(
    request: Request<IFolderDTO>,
    response: Response<IResponseDTO<Folder>>,
  ) {
    const showFolder = container.resolve(ShowFolderService);

    const { id } = request.params;

    const folder = await showFolder.execute(id);

    return response.status(folder.code).send(folder);
  }
}
