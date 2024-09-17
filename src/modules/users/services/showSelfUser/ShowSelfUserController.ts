import { IResponseDTO } from '@dtos/IResponseDTO';
import { IUserDTO } from '@modules/users/dtos/IUserDTO';
import { User } from '@modules/users/entities/User';
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { ShowSelfUserService } from './ShowSelfUserService';

export class ShowSelfUserController {
  public async handle(
    request: Request<IUserDTO>,
    response: Response<IResponseDTO<User>>,
  ) {
    const showSelfUser = container.resolve(ShowSelfUserService);

    const user_id = request.auth.sub;

    const user = await showSelfUser.execute(user_id);

    return response.status(user.code).send(user);
  }
}
