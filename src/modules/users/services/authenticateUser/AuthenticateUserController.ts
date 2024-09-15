import { IAuthDTO } from "@modules/users/dtos/IAuthDTO";
import { container } from "tsyringe";
import { AuthenticateUserService } from "./AuthenticateUserService";
import { IResponseDTO } from "@dtos/IResponseDTO";
import {Request, Response} from 'express';

export class AuthenticateUserController{
  public async handle(
    request: Request<never, never, IAuthDTO>,
    response: Response<IResponseDTO<{jwt_token: string, refresh_token: string}>>
  ){
    const userData = request.body;

    const authenticateUser = container.resolve(AuthenticateUserService);

    const user = await authenticateUser.execute(userData);

    return response.status(user.code).send(user);
  }
}