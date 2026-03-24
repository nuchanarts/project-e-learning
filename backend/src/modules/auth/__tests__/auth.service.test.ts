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
    (authRepository.create as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    const result = await authService.register('test@example.com', 'password123', 'Test User');
    expect(result.user.email).toBe('test@example.com');
    expect(result.accessToken).toBeDefined();
  });

  it('should throw 409 if email already exists', async () => {
    (authRepository.findByEmail as jest.Mock).mockResolvedValue(mockUser);
    await expect(authService.register('test@example.com', 'pass', 'Name'))
      .rejects.toMatchObject({ status: 409 });
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
});
