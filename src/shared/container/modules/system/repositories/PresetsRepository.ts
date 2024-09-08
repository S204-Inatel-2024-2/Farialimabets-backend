import { Preset } from '@modules/system/entities/Preset';
import { IPresetsRepositoryDTO } from '@modules/system/repositories/IPresetsRepository';
import { BaseRepository } from '@shared/container/modules/repositories/BaseRepository';

export class PresetsRepository
  extends BaseRepository<Preset>
  implements IPresetsRepositoryDTO
{
  public constructor() {
    super(Preset);
  }

  // non-generic methods here
}
