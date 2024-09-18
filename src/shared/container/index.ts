import './providers';
import { container } from 'tsyringe';
import { IUsersRepository } from '@modules/users/repositories/IUsersRepository';
import { UsersRepository } from '@modules/users/repositories/UsersRepository';
import { IWalletsRepository } from '@modules/finances/repositories/IWalletsRepository';
import { WalletsRepository } from '@modules/finances/repositories/WalletsRepository';

container.registerSingleton<IUsersRepository>(
  'UsersRepository',
  UsersRepository,
);

container.registerSingleton<IWalletsRepository>(
  'WalletsRepository',
  WalletsRepository,
);
