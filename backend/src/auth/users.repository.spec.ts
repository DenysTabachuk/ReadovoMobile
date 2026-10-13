import { PrismaService } from '../prisma/prisma.service';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  const userDelegate = {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  };
  const prisma = { user: userDelegate } as unknown as PrismaService;
  const repository = new UsersRepository(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('maps a Prisma user without changing the public contract', async () => {
    userDelegate.findUnique.mockResolvedValue({
      balance: 25,
      createdAt: new Date('2026-10-13T10:00:00.000Z'),
      email: 'reader@example.com',
      id: 'fdd4777f-98d7-44bb-a11e-578db7b77527',
      lessonsCompleted: 2,
      passwordHash: 'hash',
      passwordSalt: 'salt',
      testsCompleted: 3,
      wordsLearned: 4,
    });

    await expect(repository.findByEmail('reader@example.com')).resolves.toEqual(
      {
        balance: 25,
        createdAt: '2026-10-13T10:00:00.000Z',
        email: 'reader@example.com',
        id: 'fdd4777f-98d7-44bb-a11e-578db7b77527',
        lessonsCompleted: 2,
        passwordHash: 'hash',
        passwordSalt: 'salt',
        testsCompleted: 3,
        wordsLearned: 4,
      },
    );
    expect(userDelegate.findUnique).toHaveBeenCalledWith({
      where: { email: 'reader@example.com' },
    });
  });

  it('passes every supplied field through when creating a user', async () => {
    const storedUser = {
      balance: 0,
      createdAt: '2026-10-13T10:00:00.000Z',
      email: 'reader@example.com',
      id: 'fdd4777f-98d7-44bb-a11e-578db7b77527',
      lessonsCompleted: 0,
      passwordHash: 'hash',
      passwordSalt: 'salt',
      testsCompleted: 0,
      wordsLearned: 0,
    };
    userDelegate.create.mockResolvedValue({
      ...storedUser,
      createdAt: new Date(storedUser.createdAt),
    });

    await expect(repository.create(storedUser)).resolves.toEqual(storedUser);
    expect(userDelegate.create).toHaveBeenCalledWith({
      data: {
        ...storedUser,
        createdAt: new Date(storedUser.createdAt),
      },
    });
  });

  it('updates credentials by email', async () => {
    userDelegate.updateMany.mockResolvedValue({ count: 1 });

    await repository.updatePassword(
      'reader@example.com',
      'new-hash',
      'new-salt',
    );

    expect(userDelegate.updateMany).toHaveBeenCalledWith({
      data: { passwordHash: 'new-hash', passwordSalt: 'new-salt' },
      where: { email: 'reader@example.com' },
    });
  });
});
