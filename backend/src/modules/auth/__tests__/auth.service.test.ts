import { authService } from '../auth.service';
import { authRepository } from '../auth.repository';
import bcrypt from 'bcrypt';

jest.mock('../auth.repository');
jest.mock('bcrypt');

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hashed',
  name: 'Test User',
  role: 'USER' as const,
  isActive: true,
  cid: '1234567890123',
  hospcode: '12345',
  hospital: 'รพ.สต.ทดสอบ',
  position: 'นักวิชาการสาธารณสุข',
  avatarUrl: null,
  authProvider: 'local',
  providerSub: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
  jest.clearAllMocks();
});

describe('authService.register', () => {
  it('should register a new user', async () => {
    (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (authRepository.findByCid as jest.Mock).mockResolvedValue(null);
    (authRepository.create as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    const result = await authService.register(
      'test@example.com',
      'password123',
      'Test User',
      '1234567890123',
      'รพ.สต.ทดสอบ',
      'นักวิชาการสาธารณสุข',
      '12345',
    );
    expect(result.user.email).toBe('test@example.com');
    expect(result.accessToken).toBeDefined();
  });

  it('should throw 409 if email already exists', async () => {
    (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
    await expect(
      authService.register(
        'test@example.com',
        'pass',
        'Name',
        '1234567890123',
        'รพ.สต.ทดสอบ',
        'นักวิชาการ',
        '12345',
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe('authService.login', () => {
  it('should login with valid credentials', async () => {
    (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await authService.login('test@example.com', 'password123');
    expect(result.user.email).toBe('test@example.com');
    expect(result.accessToken).toBeDefined();
  });

  it('should throw 401 for invalid password', async () => {
    (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(authService.login('test@example.com', 'wrong'))
      .rejects.toMatchObject({ status: 401 });
  });

  it('should throw 401 for non-existent user', async () => {
    (authRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    await expect(authService.login('nobody@example.com', 'pass'))
      .rejects.toMatchObject({ status: 401 });
  });

  it('should throw 400 when the account has no password (MOPH user)', async () => {
    (authRepository.findByEmail as jest.Mock).mockResolvedValue({ ...mockUser, passwordHash: null });
    await expect(authService.login('test@example.com', 'whatever'))
      .rejects.toMatchObject({ status: 400 });
  });
});
