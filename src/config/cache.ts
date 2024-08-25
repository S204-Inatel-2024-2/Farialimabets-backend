import { RedisOptions } from 'ioredis';

interface ICacheConfigDTO {
  readonly driver: 'redis';
  readonly config: {
    readonly redis: RedisOptions & { readonly keyPrefix: string };
  };
}

export const cacheConfig = Object.freeze<ICacheConfigDTO>({
  driver: 'redis',
  config: {
    redis: {
      port: Number(process.env.REDIS_PORT),
      host: process.env.REDIS_HOST,
      password: process.env.REDIS_PASSWORD,
      keyPrefix: process.env.REDIS_PREFIX,
    },
  },
});
