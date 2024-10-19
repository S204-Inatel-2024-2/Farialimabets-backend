import { BaseRepository } from '@shared/container/modules/repositories/BaseRepository';
import { Share } from '../entities/Share';
import { ISharesRepository } from './ISharesRepository';

export class SharesRepository
  extends BaseRepository<Share>
  implements ISharesRepository
{
  public constructor() {
    super(Share);
  }

  // non-generic methods here
}
