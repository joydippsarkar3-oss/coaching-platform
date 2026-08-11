import { PrismaService } from '../common/prisma/prisma.service';

const modelMethods = () => ({
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

export function createPrismaMock(): jest.Mocked<PrismaService> {
  const mock: any = {
    center: modelMethods(),
    certificate: modelMethods(),
    enrollment: modelMethods(),
    installment: modelMethods(),
    payment: modelMethods(),
    ledgerEntry: modelMethods(),
    exam: modelMethods(),
    examAttempt: modelMethods(),
    examAnswer: modelMethods(),
    question: modelMethods(),
    verificationLog: modelMethods(),
    auditLog: modelMethods(),
    notification: modelMethods(),
    consent: modelMethods(),
    student: modelMethods(),
    otpCode: modelMethods(),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  };

  mock.$transaction = jest.fn().mockImplementation((cb: any) => {
    if (typeof cb === 'function') {
      return cb(mock);
    }
    // Array of promises (batch mode)
    return Promise.all(cb);
  });

  return mock as jest.Mocked<PrismaService>;
}
