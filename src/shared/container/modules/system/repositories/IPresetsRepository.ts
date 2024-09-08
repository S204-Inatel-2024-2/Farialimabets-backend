import { Preset } from '@modules/system/entities/Preset';
import { IBaseRepositoryDTO } from '@shared/container/modules/repositories/IBaseRepository';

export interface IPresetsRepositoryDTO extends IBaseRepositoryDTO<Preset> {
  // non-generic methods here
}
