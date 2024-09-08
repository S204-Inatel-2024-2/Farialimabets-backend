import { Request, Response } from 'express';
import { container } from 'tsyringe';

import { IFolderDTO } from '@modules/system/dtos/IFolderDTO';
import { IResponseDTO } from '@dtos/IResponseDTO';
import { DeleteFolderService } from './DeleteFolderService';

export class DeleteFolderController {
  public async handle(
    request: Request<IFolderDTO>,
    response: Response<IResponseDTO<null>>,
  ) {
    const deleteFolder = container.resolve(DeleteFolderService);

    const { id } = request.params;

    const folder = await deleteFolder.execute(id);

    return response.send(folder);
  }
}
