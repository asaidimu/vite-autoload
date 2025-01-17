import { createHash } from 'crypto';

export function generateMd5Hash(input: string): string {
  return createHash('md5').update(input).digest('hex');
}
