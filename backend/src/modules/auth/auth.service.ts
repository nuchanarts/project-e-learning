import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { authRepository } from './auth.repository';
import { bmsProvider } from './bmsProvider';

const PROVIDER_LOGIN_MSG = 'บัญชีนี้เข้าสู่ระบบผ่าน MOPH กรุณาใช้ปุ่ม "เข้าสู่ระบบด้วย MOPH"';
const MOPH_REG_TTL = '10m';

// Never store the raw MOPH provider id — match on a one-way hash instead.
const hashProviderSub = (sub: string) => crypto.createHash('sha256').update(sub).digest('hex');

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
  avatarUrl?: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    cid: user.cid ?? null,
    hospital: user.hospital ?? null,
    position: user.position ?? null,
    avatarUrl: user.avatarUrl ?? null,
  };
}

export const authService = {
  async register(
    email: string,
    password: string,
    name: string,
    cid: string,
    hospital: string,
    position: string,
    hospcode: string,
  ) {
    const existing = await authRepository.findByEmail(email);
    if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 });

    if (!cid) throw Object.assign(new Error('เลขบัตรประชาชนจำเป็นต้องระบุ'), { status: 400 });
    if (!/^\d{13}$/.test(cid))
      throw Object.assign(new Error('เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก'), { status: 400 });
    const cidExists = await authRepository.findByCid(cid);
    if (cidExists)
      throw Object.assign(new Error('เลขบัตรประชาชนนี้ถูกใช้งานแล้ว'), { status: 409 });

    if (!hospcode || !/^\d{5}$/.test(hospcode))
      throw Object.assign(new Error('รหัสสถานพยาบาลต้องเป็นตัวเลข 5 หลัก'), { status: 400 });
    if (!hospital?.trim())
      throw Object.assign(new Error('กรุณาระบุชื่อสถานพยาบาล'), { status: 400 });
    if (!position?.trim()) throw Object.assign(new Error('กรุณาระบุตำแหน่งงาน'), { status: 400 });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await authRepository.create({
      email,
      passwordHash,
      name,
      cid,
      hospital,
      hospcode,
      position,
    });
    const tokens = generateTokens(user.id, user.email, user.role);
    return { user: formatUser(user), ...tokens };
  },

  async login(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    if (user.providerSubHash) throw Object.assign(new Error(PROVIDER_LOGIN_MSG), { status: 400 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

    if ((user as any).isActive === false)
      throw Object.assign(new Error('บัญชีถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ'), {
        status: 403,
      });

    const tokens = generateTokens(user.id, user.email, user.role);
    return { user: formatUser(user), ...tokens };
  },

  async validateCredentials(email: string, password: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    if (user.providerSubHash) throw Object.assign(new Error(PROVIDER_LOGIN_MSG), { status: 400 });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    if ((user as any).isActive === false)
      throw Object.assign(new Error('บัญชีถูกระงับการใช้งาน'), { status: 403 });
    return user;
  },

  async loginByEmail(email: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    const tokens = generateTokens(user.id, user.email, user.role);
    return { user: formatUser(user), ...tokens };
  },

  async updateProfile(
    userId: string,
    data: { name?: string; hospital?: string; position?: string; avatarUrl?: string | null },
  ) {
    const user = await authRepository.updateById(userId, data);
    return formatUser(user);
  },

  async loginByCid(hospcode: string, cid: string) {
    if (!/^\d{5}$/.test(hospcode))
      throw Object.assign(new Error('รหัสสถานพยาบาลต้องเป็นตัวเลข 5 หลัก'), { status: 400 });
    if (!/^\d{13}$/.test(cid))
      throw Object.assign(new Error('เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก'), { status: 400 });
    const users = await authRepository.findByHospcodeAndCid(hospcode, cid);
    if (users.length === 0)
      throw Object.assign(
        new Error('ไม่พบบัญชีผู้ใช้ กรุณาตรวจสอบรหัสสถานพยาบาลและเลขบัตรประชาชน'),
        { status: 401 },
      );
    if (users.length > 1)
      throw Object.assign(new Error('พบบัญชีซ้ำ กรุณาติดต่อผู้ดูแลระบบ'), { status: 409 });
    const user = users[0];
    if (!user.isActive) throw Object.assign(new Error('บัญชีถูกระงับการใช้งาน'), { status: 403 });
    const tokens = generateTokens(user.id, user.email, user.role);
    return { user: formatUser(user), ...tokens };
  },

  async forgotPassword(email: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) return; // ไม่เปิดเผยว่าอีเมลมีอยู่หรือไม่
    const { otpService } = await import('./otp.service');
    await otpService.sendOtp(email);
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const { otpService } = await import('./otp.service');
    const valid = await otpService.verifyOtp(email, otp);
    if (!valid) throw Object.assign(new Error('รหัส OTP ไม่ถูกต้องหรือหมดอายุ'), { status: 400 });
    if (newPassword.length < 6)
      throw Object.assign(new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'), { status: 400 });
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await authRepository.updatePasswordByEmail(email, passwordHash);
  },

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
      return generateTokens(decoded.id, decoded.email, decoded.role);
    } catch {
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }
  },

  // Step 1 of MOPH login: exchange the OAuth code, then either log the user in
  // (returning account matched by providerSub) or ask them to complete their profile.
  async loginWithMophCode(code: string) {
    const provider = await bmsProvider.exchangeCode(code);
    const existing = await authRepository.findByProviderSubHash(hashProviderSub(provider.sub));

    if (existing) {
      if (existing.isActive === false)
        throw Object.assign(new Error('บัญชีถูกระงับการใช้งาน'), { status: 403 });
      const tokens = generateTokens(existing.id, existing.email, existing.role);
      return { status: 'logged_in' as const, user: formatUser(existing), ...tokens };
    }

    // New account: hold the trusted provider data inside a short-lived signed token
    // so the client can carry it to the complete-profile form without tampering.
    const registrationToken = jwt.sign(
      {
        typ: 'moph_reg',
        sub: provider.sub,
        name: provider.name,
        organizations: provider.organizations,
        cid: provider.cid,
        email: provider.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: MOPH_REG_TTL } as SignOptions,
    );

    return {
      status: 'need_profile' as const,
      registrationToken,
      prefill: {
        name: provider.name,
        organizations: provider.organizations,
        cid: provider.cid ?? null,
        email: provider.email ?? null,
      },
    };
  },

  // Step 2 of MOPH login (new accounts only): verify the registration token, merge
  // the trusted provider data with the email/cid the user supplied, then create the row.
  async completeMophRegistration(input: {
    registrationToken: string;
    email: string;
    cid?: string;
    hcode?: string;
  }) {
    let payload: any;
    try {
      payload = jwt.verify(input.registrationToken, process.env.JWT_SECRET!);
    } catch {
      throw Object.assign(new Error('เซสชันลงทะเบียนหมดอายุ กรุณาเข้าสู่ระบบ MOPH ใหม่'), {
        status: 401,
      });
    }
    if (payload.typ !== 'moph_reg')
      throw Object.assign(new Error('โทเคนลงทะเบียนไม่ถูกต้อง'), { status: 401 });

    const email = input.email?.trim();
    if (!email) throw Object.assign(new Error('กรุณาระบุอีเมล'), { status: 400 });
    if (await authRepository.findByEmail(email))
      throw Object.assign(new Error('อีเมลนี้ถูกใช้งานแล้ว'), { status: 409 });

    const cid = input.cid?.trim() || undefined;
    if (cid) {
      if (!/^\d{13}$/.test(cid))
        throw Object.assign(new Error('เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก'), { status: 400 });
      if (await authRepository.findByCid(cid))
        throw Object.assign(new Error('เลขบัตรประชาชนนี้ถูกใช้งานแล้ว'), { status: 409 });
    }

    // Pick the org the user chose (multi-org staff), else the first one.
    const orgs: any[] = payload.organizations ?? [];
    const org = orgs.find((o) => o.hcode === input.hcode) ?? orgs[0];

    // MOPH accounts have no password — store a random unusable hash.
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), SALT_ROUNDS);

    const user = await authRepository.create({
      email,
      passwordHash,
      name: payload.name,
      cid: cid ?? null,
      hospcode: org?.hcode ?? null,
      hospital: org?.hname ?? null,
      position: org?.position ?? null,
      providerSubHash: hashProviderSub(payload.sub),
    });

    const tokens = generateTokens(user.id, user.email, user.role);
    return { user: formatUser(user), ...tokens };
  },
};
