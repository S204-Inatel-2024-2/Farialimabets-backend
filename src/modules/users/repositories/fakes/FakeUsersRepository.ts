import { User } from '@modules/users/entities/User';
import { IUsersRepository } from '@modules/users/repositories/IUsersRepository';
import { FakeBaseRepository } from '@shared/container/modules/repositories/fakes/FakeBaseRepository';

export class FakeUsersRepository
  extends FakeBaseRepository<User>
  implements IUsersRepository
{
  public constructor() {
    super(User);
  }

  // non-generic methods here
}
