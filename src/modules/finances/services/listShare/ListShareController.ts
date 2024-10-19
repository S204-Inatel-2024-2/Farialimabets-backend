import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { FindOptionsWhere } from 'typeorm';
import { IListDTO } from '@dtos/IListDTO';
import { Share } from '@modules/finances/entities/Share';
import { ListShareService } from './ListShareService';

export class ListShareController {
  public async handle(
    request: Request<
      never,
      never,
      never,
      { page: number; limit: number } & FindOptionsWhere<Share>
    >,
    response: Response<IListDTO<Share>>,
  ) {
    const listShare = container.resolve(ListShareService);

    const { page = 1, limit = 20, ...filters } = request.query;

    const shares = await listShare.execute(
      page,
      limit,
      filters,
      request.auth.sub,
    );

    return response.status(shares.code).send(shares);
  }
}
