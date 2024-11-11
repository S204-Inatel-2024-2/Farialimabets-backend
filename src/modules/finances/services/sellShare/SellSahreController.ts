import { IResponseDTO } from '@dtos/IResponseDTO';
import { IShareDTO } from '@modules/finances/dtos/IShareDTO';
import { Share } from '@modules/finances/entities/Share';
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { SellShareService } from './SellShareService';

export class SellShareController {
  public async handle(
    request: Request<IShareDTO>,
    response: Response<IResponseDTO<Share>>,
  ) {
    const sellShareData = request.body;

    const sellShare = container.resolve(SellShareService);

    const user_id = request.auth.sub;

    const sell = await sellShare.execute(user_id, sellShareData);

    return response.status(sell.code).send(sell);
  }
}
