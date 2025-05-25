import * as jwt from 'jsonwebtoken';

export function signJWT(payload: string | object | Buffer, secret: string, expiresIn: string = '7d'): string {
  try {
    // Use type assertion to bypass TypeScript overload issues
    const token = (jwt as any).sign(payload, secret, { expiresIn });
    return token as string;
  } catch (error) {
    throw new Error(`JWT signing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function verifyJWT(token: string, secret: string): any {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error(`JWT verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 