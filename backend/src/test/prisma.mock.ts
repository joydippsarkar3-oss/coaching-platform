/**
 * Every model method is a plain jest.Mock so specs can call
 * `.mockResolvedValue(...)` on any of them. Typing the result as
 * `jest.Mocked<PrismaService>` would expose the real Prisma signatures
 * instead, and TypeScript would reject those calls.
 */
interface MockedModel {
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  createMany: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  upsert: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
  aggregate: jest.Mock;
}

const modelMethods = (): MockedModel => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
});

const MODEL_NAMES = [
  'center',
  'certificate',
  'enrollment',
  'installment',
  'payment',
  'ledgerEntry',
  'exam',
  'examAttempt',
  'examAnswer',
  'question',
  'verificationLog',
  'auditLog',
  'notification',
  'consent',
  'consentRequest',
  'erasureRequest',
  'student',
  'user',
  'roleAssignment',
  'otpCode',
] as const;

type ModelName = (typeof MODEL_NAMES)[number];

export type PrismaMock = Record<ModelName, MockedModel> & {
  $transaction: jest.Mock;
  $executeRaw: jest.Mock;
  $queryRaw: jest.Mock;
};

export function createPrismaMock(): PrismaMock {
  const mock = {
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  } as PrismaMock;

  for (const name of MODEL_NAMES) {
    mock[name] = modelMethods();
  }

  mock.$transaction.mockImplementation((cb: unknown) => {
    if (typeof cb === 'function') {
      return (cb as (tx: PrismaMock) => unknown)(mock);
    }
    // Array of promises (batch mode)
    return Promise.all(cb as Promise<unknown>[]);
  });

  return mock;
}
