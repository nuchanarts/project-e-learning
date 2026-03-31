import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { authRepository } from './auth.repository';

const SALT_ROUNDS = 12;

function generateTokens(userId: string, email: string, role: string) {
  const accessOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'],
  };
  const refreshOptions: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  };
  const accessToken = jwt.sign({ id: userId, email, role }, process.env.JWT_SECRET!, accessOptions);
  const refreshToken = jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET!,
    refreshOptions,
  );
  return { accessToken, refreshToken };
}

function formatUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  cid?: string | null;
  hospital?: string | null;
  position?: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    cid: user.cid ?? null,
    hospital: user.hospital ?? null,
    position: user.position ?? null,
  };
}

export const authService = {
  async register(
    email: string,
    password: string,
    name: string,
    cid?: string,
    hospital?: string,
    position?: string,
  ) {
    const existing = await authRepository.findByEmail(email);
    if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 });

    if (cid) {
      if (!/^\d{13}$/.test(cid))
        throw Object.assign(new Error('CID must be exactly 13 digits'), { status: 400 });
      const cidExists = await authRepository.findByCid(cid);
      if (cidExists) throw Object.assign(new Error('CID already registered'), { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await authRepository.create({
      email,
      passwordHash,
      name,
      cid,
      hospital,
      position,
    });
    const tokens = generateTokens(user.id, user.email, user.role);
    return { user: formatUser(user), ...tokens };
  },

  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    const tokens = generateTokens(user.id, user.email, user.role);
    return { user: formatUser(user), ...tokens };
  },

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
      return generateTokens(decoded.id, decoded.email, decoded.role);
    } catch {
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }
  },
};
