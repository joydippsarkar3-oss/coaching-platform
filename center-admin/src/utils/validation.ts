import { z } from 'zod'

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')

export const otpSchema = z
  .string()
  .length(6, 'OTP must be 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits')

export const emailSchema = z
  .string()
  .email('Enter a valid email address')
  .optional()
  .or(z.literal(''))

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name is too long')

export const createEnquirySchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  courseInterest: z.string().min(1, 'Select a course'),
  source: z.string().min(1, 'Select a source'),
  followUpDate: z.string().optional(),
  notes: z.string().max(500).optional(),
})

export const studentDetailsSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().min(5, 'Enter full address'),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianRelation: z.string().optional(),
})

export type CreateEnquiryFormValues = z.infer<typeof createEnquirySchema>
export type StudentDetailsFormValues = z.infer<typeof studentDetailsSchema>
