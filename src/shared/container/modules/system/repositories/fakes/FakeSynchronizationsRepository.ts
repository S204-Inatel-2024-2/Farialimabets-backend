import { Synchronization } from '@modules/system/entities/Synchronization';
import { ISynchronizationsRepositoryDTO } from '@modules/system/repositories/ISynchronizationsRepository';
import { FakeBaseRepository } from '@shared/container/modules/repositories/fakes/FakeBaseRepository';

export class FakeSynchronizationsRepository
  extends FakeBaseRepository<Synchronization>
  implements ISynchronizationsRepositoryDTO
{
  public constructor() {
    super(Synchronization);
  }

  // non-generic methods here
}
