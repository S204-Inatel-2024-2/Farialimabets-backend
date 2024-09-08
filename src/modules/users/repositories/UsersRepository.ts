import { User } from '@modules/users/entities/User';
import { IUsersRepository } from '@modules/users/repositories/IUsersRepository';
import { BaseRepository } from '@shared/container/modules/repositories/BaseRepository';

export class UsersRepository
  extends BaseRepository<User>
  implements IUsersRepository
{
  public constructor() {
    super(User);
  }

  // non-generic methods here
}
