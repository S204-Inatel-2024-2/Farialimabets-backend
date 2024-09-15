import { User } from '../entities/User';

export interface IAuthDTO extends Partial<User> {
  email: string;
  password: string;
}
