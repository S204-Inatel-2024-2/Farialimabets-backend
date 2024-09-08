import { CryptoProvider } from '@shared/container/providers/CryptoProvider/implementations/CryptoProvider';
import { GenerateKeyService } from './GenerateKeyService';

let generateKey: GenerateKeyService;
let cryptoProvider: CryptoProvider;

describe('GenerateKeyService', () => {
  beforeEach(() => {
    cryptoProvider = new CryptoProvider();
    generateKey = new GenerateKeyService(cryptoProvider);
  });

  it('Should be able to generate a key', async () => {
    const getKeys = await generateKey.execute();

    expect(getKeys.kty).toBe('RSA');
    expect(getKeys.e).toBe('AQAB');
    expect(getKeys.use).toBe('sig');
    expect(getKeys.n).toBeTruthy();
  });

  it('Should throw an error if generating the keys fails', async () => {
    jest.spyOn(cryptoProvider, 'generateKeys').mockImplementation(() => {
      throw new Error('Test error');
    });

    await expect(generateKey.execute()).rejects.toThrow('Test error');
  });
});
