import jwt from 'jsonwebtoken';
import { authService } from '../auth.service';
import { authRepository } from '../auth.repository';
import { bmsProvider } from '../bmsProvider';

jest.mock('../auth.repository');
jest.mock('../bmsProvider');

const providerResult = {
  sub: 'moph-sub-123',
  name: 'นพ. สมชาย ใจดี',
  organizations: [{ hcode: '12345', hname: 'รพ.สต.ทดสอบ', position: 'แพทย์', positionId: '0001' }],
};

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
  jest.clearAllMocks();
});

describe('authService.loginWithMophCode', () => {
  it('logs in an existing MOPH user matched by providerSub', async () => {
    (bmsProvider.exchangeCode as jest.Mock).mockResolvedValue(providerResult);
    (authRepository.findByProviderSub as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'X',
      role: 'USER',
      isActive: true,
      passwordHash: null,
      cid: null,
      hospital: null,
      position: null,
      avatarUrl: null,
    });

    const result = await authService.loginWithMophCode('the-code');

    expect(result.status).toBe('logged_in');
    if (result.status !== 'logged_in') throw new Error('expected logged_in');
    expect(result.accessToken).toBeDefined();
    expect(authRepository.findByProviderSub).toHaveBeenCalledWith('moph-sub-123');
  });

  it('returns need_profile + a signed registrationToken for a new MOPH user', async () => {
    (bmsProvider.exchangeCode as jest.Mock).mockResolvedValue(providerResult);
    (authRepository.findByProviderSub as jest.Mock).mockResolvedValue(null);

    const result = await authService.loginWithMophCode('the-code');

    expect(result.status).toBe('need_profile');
    if (result.status !== 'need_profile') throw new Error('expected need_profile');
    expect(result.prefill.name).toBe('นพ. สมชาย ใจดี');
    const decoded = jwt.verify(result.registrationToken, 'test-secret') as any;
    expect(decoded.sub).toBe('moph-sub-123');
    expect(decoded.typ).toBe('moph_reg');
  });

  it('rejects an inactive existing account', async () => {
    (bmsProvider.exchangeCode as jest.Mock).mockResolvedValue(providerResult);
    (authRepository.findByProviderSub as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'X',
      role: 'USER',
      isActive: false,
      passwordHash: null,
    });

    await expect(authService.loginWithMophCode('the-code')).rejects.toMatchObject({ status: 403 });
  });
});

describe('authService.completeMophRegistration', () => {
  function makeRegToken(overrides: Record<string, unknown> = {}, expiresIn = '10m') {
    return jwt.sign(
      {
        typ: 'moph_reg',
        sub: 'moph-sub-123',
        name: 'นพ. สมชาย ใจดี',
        organizations: providerResult.organizations,
        ...overrides,
      },
      'test-secret',
      { expiresIn } as jwt.SignOptions,
    );
  }

  it('creates a MOPH user with no password and returns tokens', async () => {
    (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (authRepository.findByCid as jest.Mock).mockResolvedValue(null);
    (authRepository.create as jest.Mock).mockImplementation(async (d: any) => ({
      id: 'u2',
      role: 'USER',
      isActive: true,
      avatarUrl: null,
      ...d,
    }));

    const result = await authService.completeMophRegistration({
      registrationToken: makeRegToken(),
      email: 'staff@hospital.go.th',
      cid: '1234567890123',
      hcode: '12345',
    });

    expect(result.accessToken).toBeDefined();
    const createArg = (authRepository.create as jest.Mock).mock.calls[0][0];
    expect(createArg.passwordHash).toBeNull();
    expect(createArg.authProvider).toBe('moph');
    expect(createArg.providerSub).toBe('moph-sub-123');
    expect(createArg.hospcode).toBe('12345');
    expect(createArg.hospital).toBe('รพ.สต.ทดสอบ');
    expect(createArg.email).toBe('staff@hospital.go.th');
  });

  it('throws 409 if the chosen email already exists', async () => {
    (authRepository.findByEmail as jest.Mock).mockResolvedValue({ id: 'x' });
    await expect(
      authService.completeMophRegistration({
        registrationToken: makeRegToken(),
        email: 'dupe@x.com',
        hcode: '12345',
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('throws 409 if the chosen cid already exists', async () => {
    (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (authRepository.findByCid as jest.Mock).mockResolvedValue({ id: 'x' });
    await expect(
      authService.completeMophRegistration({
        registrationToken: makeRegToken(),
        email: 'new@x.com',
        cid: '1234567890123',
        hcode: '12345',
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('throws 401 for an invalid/expired registration token', async () => {
    await expect(
      authService.completeMophRegistration({
        registrationToken: 'garbage.token.here',
        email: 'a@b.com',
        hcode: '12345',
      }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('rejects a token that is not a moph_reg token', async () => {
    const wrongToken = jwt.sign({ typ: 'access', sub: 'x' }, 'test-secret');
    await expect(
      authService.completeMophRegistration({
        registrationToken: wrongToken,
        email: 'a@b.com',
        hcode: '12345',
      }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
