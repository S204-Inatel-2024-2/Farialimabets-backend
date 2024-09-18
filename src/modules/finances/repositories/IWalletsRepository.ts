import { Wallet } from '@modules/finances/entities/Wallet';
import { IBaseRepository } from '@shared/container/modules/repositories/IBaseRepository';

export interface IWalletsRepository extends IBaseRepository<Wallet> {
  // non-generic methods here
}
