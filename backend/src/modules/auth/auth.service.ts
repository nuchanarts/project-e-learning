import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { authRepository } from './auth.repository';

const SALT_ROUNDS = 12;

function generateTokens(userId: string, email: string, role: string) {
  const accessOptions: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'] };
  const refreshOptions: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'] };
  const accessToken = jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET!,
    accessOptions
  );
  const refreshToken = jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET!,
    refreshOptions
  );
  return { accessToken, refreshToken };
}

export const authService = {
  async register(email: string, password: string, name: string) {
    const existing = await authRepository.findByEmail(email);
    if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await authRepository.create({ email, passwordHash, name });
    const tokens = generateTokens(user.id, user.email, user.role);
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens };
  },

  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const tokens = generateTokens(user.id, user.email, user.role);
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, ...tokens };
  },

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
      const tokens = generateTokens(decoded.id, decoded.email, decoded.role);
      return tokens;
    } catch {
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }
  },
};
