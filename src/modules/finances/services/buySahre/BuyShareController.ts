import { IResponseDTO } from '@dtos/IResponseDTO';
import { IShareDTO } from '@modules/finances/dtos/IShareDTO';
import { Share } from '@modules/finances/entities/Share';
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { BuyShareService } from './BuyShareService';

export class BuyShareController {
  public async handle(
    request: Request<IShareDTO>,
    response: Response<IResponseDTO<Share>>,
  ) {
    const shareData = request.body;

    const buyShare = container.resolve(BuyShareService);

    const share = await buyShare.execute(request.auth.sub, shareData);

    return response.status(share.code).send(share );
  }
}
