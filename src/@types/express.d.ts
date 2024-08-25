declare namespace Express {
  export interface Request {
    readonly files: Record<string, Array<Express.Multer.File>>;
    readonly auth: import('jsonwebtoken').JwtPayload & {
      readonly sub: string;
    };
  }
}
