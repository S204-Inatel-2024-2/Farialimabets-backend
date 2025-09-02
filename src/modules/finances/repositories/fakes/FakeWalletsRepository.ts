import { Wallet } from '@modules/finances/entities/Wallet';
import { FakeBaseRepository } from '@shared/container/modules/repositories/fakes/FakeBaseRepository';
import { IWalletsRepository } from '../IWalletsRepository';

export class FakeWalletsRepository
  extends FakeBaseRepository<Wallet>
  implements IWalletsRepository
{
  public constructor() {
    super(Wallet);
  }

  // non-generic methods here
}

