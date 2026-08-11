// Domain model types

export type UserRole = 'center_admin' | 'center_staff' | 'center_accountant'

export interface User {
  id: string
  name: string
  phone: string
  email?: string
  role: UserRole
  centerId: string
  createdAt: string
}

export interface Center {
  id: string
  name: string
  code: string
  logo?: string
  address: string
  phone: string
  email: string
  kycStatus: 'pending' | 'submitted' | 'approved' | 'rejected'
  onboardingChecklist: OnboardingChecklist
}

export interface OnboardingChecklist {
  profileComplete: boolean
  coursesAdded: boolean
  feePlansAdded: boolean
  firstAdmissionDone: boolean
}

export type EnquiryStage = 'new' | 'contacted' | 'visited' | 'admitted' | 'lost'

export interface Enquiry {
  id: string
  name: string
  phone: string
  courseInterest: string
  source: string
  stage: EnquiryStage
  followUpDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
  isDuplicate?: boolean
}

export interface Student {
  id: string
  name: string
  phone: string
  email?: string
  dob: string
  gender: 'male' | 'female' | 'other'
  address: string
  photoUrl?: string
  guardianName?: string
  guardianPhone?: string
  guardianRelation?: string
  centerId: string
  createdAt: string
}

export interface Enrollment {
  id: string
  studentId: string
  courseId: string
  courseName: string
  batchId: string
  batchName: string
  feePlanId: string
  status: 'active' | 'completed' | 'dropped' | 'on_hold'
  admittedAt: string
  completedAt?: string
  totalFees: number   // paise
  paidAmount: number  // paise
  dueAmount: number   // paise
}

export interface Batch {
  id: string
  name: string
  courseId: string
  courseName: string
  startDate: string
  endDate?: string
  schedule: string
  totalSeats: number
  filledSeats: number
  status: 'upcoming' | 'active' | 'completed'
  instructorName?: string
}

export interface Course {
  id: string
  name: string
  code: string
  duration: string
  fees: number  // paise
  description?: string
  isActive: boolean
}

export interface FeePlan {
  id: string
  name: string
  courseId: string
  installments: FeePlanInstallment[]
  totalAmount: number  // paise
  maxDiscountPercent: number
}

export interface FeePlanInstallment {
  sequence: number
  dueAfterDays: number
  amount: number  // paise
}

export interface AttendanceRecord {
  date: string
  studentId: string
  studentName: string
  enrollmentId: string
  status: 'present' | 'absent' | 'late' | 'holiday'
  markedBy?: string
}

export interface Exam {
  id: string
  name: string
  courseId: string
  courseName: string
  duration: number   // minutes
  totalMarks: number
  passingMarks: number
  isScheduled: boolean
  scheduledDate?: string
  scheduledTime?: string
  labSeats?: number
}

export interface ExamAttempt {
  id: string
  studentId: string
  studentName: string
  examId: string
  startCode: string
  status: 'not_started' | 'in_progress' | 'completed' | 'flagged' | 'cancelled'
  startedAt?: string
  completedAt?: string
  score?: number
  isFlagged: boolean
  flagReason?: string
}

export interface Certificate {
  id?: string
  studentId: string
  studentName: string
  enrollmentId: string
  courseName: string
  isEligible: boolean
  eligibilityReasons: string[]
  status: 'not_requested' | 'pending' | 'issued'
  issuedAt?: string
  certificateUrl?: string
  hoFee: number  // paise
}

export interface StaffMember {
  id: string
  name: string
  phone: string
  email?: string
  role: UserRole
  isActive: boolean
  joinedAt: string
  permissions: string[]
}
