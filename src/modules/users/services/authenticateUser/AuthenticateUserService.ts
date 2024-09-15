import { IUsersRepository } from "@modules/users/repositories/IUsersRepository";
import { IHashProviderDTO } from "@shared/container/providers/HashProvider/models/IHashProvider";
import { ICryptoProviderDTO } from "@shared/container/providers/CryptoProvider/models/ICryptoProvider";
import { ICacheProvider } from "@shared/container/providers/CacheProvider/models/ICacheProvider";
import { IConnection } from "@shared/typeorm";
import { Body, Route } from "tsoa";
import { injectable, inject } from "tsyringe";
import { AppError } from "@shared/errors/AppError";
import { IResponseDTO } from "@dtos/IResponseDTO";
import { IAuthDTO } from "@modules/users/dtos/IAuthDTO";

@Route('/login')
@injectable()
export class AuthenticateUserService{
  public constructor(
    @inject('UsersRepository')
    private readonly usersRepository: IUsersRepository,

    @inject('HashProvider')
    private readonly hashProvider: IHashProviderDTO,

    @inject('CryptoProvider')
    private readonly cryptoProvider: ICryptoProviderDTO,

    @inject('CacheProvider')
    private readonly cacheProvider: ICacheProvider,

    @inject('Connection')
    private readonly connection: IConnection,
  ){}


  public async execute(
  @Body() payload: IAuthDTO): Promise<IResponseDTO<{
    jwt_token: string;
    refresh_token: string;
  }>> {
    const trx = this.connection.mysql.createQueryRunner();

    await trx.startTransaction();
    try {
      
      const {email, password} = payload;
      
      if (!password || !email) {
        throw new AppError('BAD_REQUEST', 'Email or password are blank', 400)
      }
  
      const checkUser = await this.usersRepository.findBy(
        {
          where: {
            email,
          },
          select: {id: true, password: true}
        }, trx
      );
    
      if (!checkUser) throw new AppError('NOT_FOUND', 'User not found', 404)
  
      const logged = await this.hashProvider.compareHash(password, checkUser.password)
      
      let tokens: {
        jwt_token: string
        refresh_token: string
      } 
  
      if (!logged) {
        throw new AppError('BAD_REQUEST', 'Email or password are incorrect', 400)
      }
      tokens = this.cryptoProvider.generateJwt({id: checkUser.id}, '192')
  
      if (trx.isTransactionActive) await trx.commitTransaction();
      
      return {
        code: 201,
        message_code: 'AUTHENTICATED',
        message: 'User logged succesfully',
        data: tokens,
      };
      
    } catch (error: unknown) {
      if (trx.isTransactionActive) await trx.rollbackTransaction();
      throw error;
    } finally {
      if (!trx.isReleased) await trx.release();
    }
  }
}