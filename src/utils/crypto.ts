import crypto from 'crypto';

export function generateMd5Hash(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex');
}
