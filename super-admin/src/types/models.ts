import dayjs from 'dayjs';

// ─── Auth ────────────────────────────────────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'HO_STAFF';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  twoFaEnabled: boolean;
  lastLogin: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  otp?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ─── Center ──────────────────────────────────────────────────────────────────

export type CenterStatus = 'PROSPECT' | 'ACTIVE' | 'FROZEN' | 'CLOSED';
export type PackageTier = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ELITE';

export interface Center {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  status: CenterStatus;
  packageTier: PackageTier;
  enrollmentDate: string;
  agreementExpiryDate: string;
  admissionsThisMonth: number;
  revenueThisMonth: number; // paise
  collectionPct: number;
  kycComplete: boolean;
  provisioned: boolean;
  territory: string;
}

export interface CenterKycChecklist {
  centerId: string;
  panCard: boolean;
  aadhaar: boolean;
  addressProof: boolean;
  bankDetails: boolean;
  agreementSigned: boolean;
  centerPhotos: boolean;
  franchiseFeeReceipt: boolean;
}

// ─── Course / Catalog ─────────────────────────────────────────────────────────

export type NsqfLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type CourseStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Course {
  id: string;
  nameEn: string;
  nameHi: string;
  category: string;
  durationWeeks: number;
  nsqfLevel: NsqfLevel;
  status: CourseStatus;
  eligibility: string;
  certificateTemplateId?: string;
  syllabusUnits: SyllabusUnit[];
  admissionCharge: number; // paise
  certificateCharge: number; // paise
  royaltyPct: number;
}

export interface SyllabusUnit {
  id: string;
  title: string;
  order: number;
  topics: string[];
}

export interface CourseGrant {
  centerId: string;
  courseId: string;
  granted: boolean;
  feeMin: number; // paise
  feeMax: number; // paise
  hoAdmissionCharge: number; // paise
  hoCertificateCharge: number; // paise
}

// ─── Questions ───────────────────────────────────────────────────────────────

export type QuestionType = 'MCQ' | 'TF' | 'FILL' | 'MATCH' | 'NUMERIC' | 'SUBJECTIVE';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionStatus = 'DRAFT' | 'REVIEW' | 'LIVE';

export interface Question {
  id: string;
  bankId: string;
  textEn: string;
  textHi: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  marks: number;
  status: QuestionStatus;
  options?: QuestionOption[];
  answerKey: string;
  explanation?: string;
  usageCount: number;
  hoLocked: boolean;
  tags: string[];
}

export interface QuestionOption {
  id: string;
  textEn: string;
  textHi: string;
  isCorrect: boolean;
}

export interface QuestionBank {
  id: string;
  name: string;
  courseId: string;
  subject: string;
  totalQuestions: number;
  liveQuestions: number;
  hoLocked: boolean;
}

// ─── Exams ───────────────────────────────────────────────────────────────────

export type ExamType = 'PRACTICE' | 'MOCK' | 'FINAL' | 'SCHOLARSHIP';
export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'CLOSED';
export type AntiCheatLevel = 'NONE' | 'BASIC' | 'STRICT';
export type ResultPolicy = 'INSTANT' | 'MODERATED';

export interface ExamBlueprint {
  topic: string;
  easy: number;
  medium: number;
  hard: number;
}

export interface Exam {
  id: string;
  name: string;
  courseId: string;
  type: ExamType;
  status: ExamStatus;
  blueprint: ExamBlueprint[];
  durationMinutes: number;
  marksPerQuestion: number;
  negativeMarking: boolean;
  negativeFraction: number;
  windowStart: string;
  windowEnd: string;
  antiCheatLevel: AntiCheatLevel;
  resultPolicy: ResultPolicy;
  bankLocked: boolean;
  publicRegistration: boolean;
}

// ─── Certificates ─────────────────────────────────────────────────────────────

export type CertificateStatus = 'PENDING' | 'APPROVED' | 'ISSUED' | 'REVOKED';

export interface Certificate {
  id: string;
  certNo: string;
  studentName: string;
  studentId: string;
  courseId: string;
  courseName: string;
  centerId: string;
  centerName: string;
  grade: string;
  requestedAt: string;
  issuedAt?: string;
  status: CertificateStatus;
  autoRule: boolean;
  verifyUrl: string;
  revokedReason?: string;
}

export type DocType = 'CERTIFICATE' | 'MARKSHEET' | 'ID_CARD' | 'TYPING_CERT';

export interface CertificateTemplate {
  id: string;
  name: string;
  docType: DocType;
  htmlContent: string;
  variables: string[];
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  debit: number; // paise
  credit: number; // paise
  balance: number; // paise
  reference?: string;
}

export interface HoCharge {
  courseId: string;
  courseName: string;
  admissionCharge: number; // paise
  certificateCharge: number; // paise
  royaltyPct: number;
}

export interface Settlement {
  id: string;
  centerId: string;
  centerName: string;
  gateway: string;
  splitPct: number;
  amount: number; // paise
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  scheduledAt: string;
}

// ─── Comms ───────────────────────────────────────────────────────────────────

export type MetaApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type WhatsAppChannel = 'UTILITY' | 'MARKETING';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: WhatsAppChannel;
  language: 'en' | 'hi';
  body: string;
  variables: string[];
  metaStatus: MetaApprovalStatus;
  costPerMsg: number; // paise
}

export interface Broadcast {
  id: string;
  templateId: string;
  scope: 'NETWORK' | 'SEGMENT' | 'CENTER';
  packageTiers?: PackageTier[];
  centerIds?: string[];
  scheduledAt?: string;
  sentAt?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'FAILED';
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

// ─── Users / RBAC ────────────────────────────────────────────────────────────

export interface HoStaff {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  lastLogin?: string;
  twoFaEnabled: boolean;
  active: boolean;
  createdAt: string;
}

export interface ActiveSession {
  id: string;
  userId: string;
  device: string;
  ip: string;
  lastSeen: string;
  current: boolean;
}

export const PERMISSION_MODULES = [
  'CATALOG',
  'FINANCE',
  'CENTERS',
  'COMMS',
  'CERTIFICATES',
  'SUPPORT',
  'USERS',
  'AUDIT',
  'SETTINGS',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  ip: string;
  payload?: Record<string, unknown>;
}

export interface RetentionJob {
  id: string;
  name: string;
  category: string;
  retentionYears: number;
  lastRunAt: string;
  nextRunAt: string;
  status: 'OK' | 'WARNING' | 'ERROR';
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardKpis {
  activeCenters: number;
  studentsEnrolledMtd: number;
  networkRevenueMtd: number; // paise
  certificatesIssuedMtd: number;
}

export interface MonthlyAdmission {
  month: string;
  admissions: number;
}

export interface CenterRevenue {
  centerName: string;
  revenue: number; // paise
}

export interface CenterLeaderboard {
  rank: number;
  centerId: string;
  centerName: string;
  city: string;
  admissionsThisMonth: number;
  revenueThisMonth: number; // paise
  collectionPct: number;
  status: CenterStatus;
}

export interface NetworkAlert {
  id: string;
  type: 'LOW_COLLECTION' | 'AGREEMENT_EXPIRY' | 'PENDING_CERT' | 'KYC_INCOMPLETE';
  priority: 'P1' | 'P2' | 'P3';
  centerId?: string;
  centerName?: string;
  message: string;
  createdAt: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export type PaymentGateway = 'RAZORPAY' | 'CASHFREE';

export interface PlatformSettings {
  branding: {
    logoUrl: string;
    accentColor: string;
    pwaName: string;
    pwaIconUrl: string;
  };
  payment: {
    gateway: PaymentGateway;
    razorpayKeyId: string;
    razorpayKeySecret: string;
    cashfreeAppId: string;
    cashfreeSecretKey: string;
    splitByTier: Record<PackageTier, number>;
  };
  waba: {
    wabaId: string;
    phoneNumberId: string;
    apiToken: string;
  };
  sms: {
    senderId: string;
    gateway: string;
    dltEntityId: string;
  };
  featureFlags: Record<string, Record<PackageTier, boolean>>;
  appVersion: {
    minimum: string;
    forceUpdate: boolean;
    updateMessage: string;
  };
}

// Re-export dayjs for convenient use
export { dayjs };
