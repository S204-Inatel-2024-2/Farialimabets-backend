import { Request, Response } from 'express';
import { container } from 'tsyringe';

import { IResponseDTO } from '@dtos/IResponseDTO';

import { IFolderDTO } from '@modules/system/dtos/IFolderDTO';
import { Folder } from '@modules/system/entities/Folder';

import { UpdateFolderService } from './UpdateFolderService';

export class UpdateFolderController {
  public async handle(
    request: Request<IFolderDTO, never, IFolderDTO>,
    response: Response<IResponseDTO<Folder>>,
  ) {
    const updateFolder = container.resolve(UpdateFolderService);

    const { id } = request.params;
    const folderData = request.body;

    const folder = await updateFolder.execute(folderData, id);

    return response.status(folder.code).send(folder);
  }
}
