import { IBaseRepository } from '@shared/container/modules/repositories/IBaseRepository';
import { Share } from '../entities/Share';

export interface ISharesRepository extends IBaseRepository<Share> {
  // non-generic methods here
}
