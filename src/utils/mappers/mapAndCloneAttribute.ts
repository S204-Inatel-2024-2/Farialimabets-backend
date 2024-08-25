import { IObjectDTO } from '@dtos/IObjectDTO';

/**
 * CLONE VALUES -> Receives as parameter a key array and another object of type { [key: string]: unknown }, returns an array of objects with the same value, is useful for queries find WHERE + OR.
 * @param attribute IObjectDTO
 * @returns Promise: Array<IObjectDTO>
 * @param params Array<string>
 */
export function mapAndCloneAttribute<Entity>(
  attribute: Partial<Entity>,
  params: Array<keyof Entity>,
): Array<Partial<IObjectDTO>> {
  const objectArray = params.map(param => {
    return {
      [param]: Object.values(attribute)[0],
    };
  });
  return objectArray;
}
