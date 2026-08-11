// API response envelope and all endpoint response types

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface LoginOtpRequest {
  phone: string
}

export interface LoginOtpVerifyRequest {
  phone: string
  otp: string
}

export interface LoginResponse {
  tokens: TokenPair
  user: {
    id: string
    name: string
    phone: string
    role: string
    centerId: string
    centerName: string
    centerLogo?: string
  }
}

export interface DashboardStats {
  todayCollections: number        // paise
  newAdmissionsToday: number
  enquiriesOverdue: number
  attendancePercent: number
  admissionsLast2Months: MonthTile[]
  revenueLast2Months: MonthTile[]
  actionFeedItems: ActionFeedItem[]
}

export interface MonthTile {
  month: string   // "Aug 2026"
  value: number
  label: string
}

export interface ActionFeedItem {
  id: string
  type: 'certificates_ready' | 'installments_overdue' | 'followups_due' | 'generic'
  message: string
  count: number
  severity: 'info' | 'warning' | 'error'
}

export interface EnquiryListParams {
  stage?: string
  page?: number
  pageSize?: number
  search?: string
}

export interface CreateEnquiryRequest {
  name: string
  phone: string
  courseInterest: string
  source: string
  followUpDate?: string
  notes?: string
}

export interface AdmissionWizardPayload {
  studentId?: string
  studentDetails?: {
    name: string
    phone: string
    email?: string
    dob: string
    gender: string
    address: string
    photo?: string
    guardianName?: string
    guardianPhone?: string
    guardianRelation?: string
  }
  consentOtp?: string
  courseId: string
  batchId: string
  feePlanId: string
  discountAmount?: number
  paymentMode: 'upi' | 'cash'
  firstPaymentAmount: number
}

export interface FeeInstallment {
  id: string
  dueDate: string
  amount: number   // paise
  lateFee: number  // paise
  status: 'pending' | 'paid' | 'overdue' | 'waived'
  paidAt?: string
  paidAmount?: number
}

export interface CollectPaymentRequest {
  studentId: string
  installmentId: string
  amount: number   // paise
  mode: 'upi' | 'cash'
}

export interface CollectPaymentResponse {
  receiptId: string
  receiptUrl: string
  upiQrData?: string
}

export interface ExamScheduleRequest {
  examId: string
  date: string
  time: string
  labSeats: number
}

export interface CertificateIssuanceRequest {
  studentIds: string[]
}

export interface DuesAgingBuckets {
  bucket0to7Days: number   // paise total
  bucket8to30Days: number
  bucket31PlusDays: number
  studentCount0to7: number
  studentCount8to30: number
  studentCount31Plus: number
}
