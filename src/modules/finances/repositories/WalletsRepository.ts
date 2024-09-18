import { Wallet } from '@modules/finances/entities/Wallet';
import { IWalletsRepository } from '@modules/finances/repositories/IWalletsRepository';
import { BaseRepository } from '@shared/container/modules/repositories/BaseRepository';

export class WalletsRepository
  extends BaseRepository<Wallet>
  implements IWalletsRepository
{
  public constructor() {
    super(Wallet);
  }

  // non-generic methods here
}
