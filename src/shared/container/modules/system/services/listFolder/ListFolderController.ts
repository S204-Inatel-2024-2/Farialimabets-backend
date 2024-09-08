import { Request, Response } from 'express';
import { container } from 'tsyringe';

import { FindOptionsWhere } from 'typeorm';
import { IListDTO } from '@dtos/IListDTO';

import { Folder } from '@modules/system/entities/Folder';
import { ListFolderService } from './ListFolderService';

export class ListFolderController {
  public async handle(
    request: Request<
      never,
      never,
      never,
      { page: number; limit: number } & FindOptionsWhere<Folder>
    >,
    response: Response<IListDTO<Folder>>,
  ) {
    const listFolder = container.resolve(ListFolderService);

    const { page = 1, limit = 20, ...filters } = request.query;

    const folders = await listFolder.execute(page, limit, filters);

    return response.status(folders.code).send(folders);
  }
}
