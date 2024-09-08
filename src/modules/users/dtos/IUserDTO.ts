import { User } from '../entities/User';

export interface IUserDTO extends Partial<User> {
  password: string;
}
