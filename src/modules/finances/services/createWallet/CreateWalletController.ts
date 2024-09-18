import { IWalletDTO } from '@modules/finances/dtos/IWalletDTO';
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { IResponseDTO } from '@dtos/IResponseDTO';
import { Wallet } from '@modules/finances/entities/Wallet';
import { CreateWalletService } from './CreateWalletService';

export class CreateWalletController {
  public async handle(
    request: Request<never, never, IWalletDTO>,
    response: Response<IResponseDTO<Wallet>>,
  ) {
    const financeData = request.body;

    const createWallet = container.resolve(CreateWalletService);

    const wallet = await createWallet.execute(financeData);

    return response.status(wallet.code).send(wallet);
  }
}
