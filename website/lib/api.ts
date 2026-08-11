// Typed API client — wraps fetch with error handling and type safety

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.example.com/v1";

// ── Response Types ────────────────────────────────────────────────────────────

export interface ApiStats {
  studentsEnrolled: number;
  centersCount: number;
  coursesCount: number;
  statesCount: number;
  placementsAssisted: number;
}

export type CourseCategory =
  | "office"
  | "accounting"
  | "typing"
  | "programming"
  | "hardware"
  | "design";

export interface Course {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: CourseCategory;
  durationMonths: number;
  level: "beginner" | "intermediate" | "advanced";
  eligibility: string;
  centersCount: number;
  feesFrom?: number;
  syllabusUnits: SyllabusUnit[];
  careerOutcomes: string[];
  certificateImageUrl?: string;
  brochureUrl?: string;
}

export interface SyllabusUnit {
  id: string;
  title: string;
  topics: string[];
}

export interface Center {
  id: string;
  slug: string;
  name: string;
  code: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  principalName: string;
  photoUrl?: string;
  photos: string[];
  faculty: FacultyMember[];
  courses: CenterCourse[];
  batchTimings: BatchTiming[];
  testimonialsEnabled: boolean;
  testimonials: Testimonial[];
  toppers: Topper[];
  latitude?: number;
  longitude?: number;
  establishedYear?: number;
  studentsCount?: number;
  isVerified: boolean;
  isFeatured: boolean;
}

export interface FacultyMember {
  id: string;
  name: string;
  qualification: string;
  subject: string;
  photoUrl?: string;
}

export interface CenterCourse {
  courseId: string;
  courseName: string;
  courseSlug: string;
  fee: number;
  durationMonths: number;
}

export interface BatchTiming {
  id: string;
  courseName: string;
  days: string;
  time: string;
  availableSeats: number;
}

export interface Testimonial {
  id: string;
  studentName: string;
  course: string;
  text: string;
  rating: number;
  photoUrl?: string;
  graduationYear?: number;
}

export interface Topper {
  id: string;
  studentName: string;
  course: string;
  grade: string;
  percentage: number;
  year: number;
  photoUrl?: string;
}

export interface VerificationResult {
  found: boolean;
  certificate?: {
    certNo: string;
    studentName: string;
    studentPhotoUrl?: string;
    course: string;
    grade: string;
    percentage: number;
    issueDate: string;
    centerName: string;
    centerCode: string;
    isValid: boolean;
  };
}

export interface StudentResult {
  found: boolean;
  student?: {
    name: string;
    rollNo: string;
    course: string;
    center: string;
    grade: string;
    percentage: number;
    result: "PASS" | "FAIL";
    examDate: string;
  };
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  authorName: string;
  publishedAt: string;
  updatedAt?: string;
  coverImageUrl?: string;
  tags: string[];
  readingTimeMinutes: number;
}

export interface EnquiryPayload {
  name: string;
  phone: string;
  email?: string;
  courseInterest?: string;
  preferredCenter?: string;
  message?: string;
  sourceUrl?: string;
  centerSlug?: string;
}

// ── Fetch Helper ──────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { next?: { revalidate?: number; tags?: string[] } }
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(typeof window === "undefined" && process.env.API_SECRET_KEY
        ? { Authorization: `Bearer ${process.env.API_SECRET_KEY}` }
        : {}),
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status} for ${path}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ── Public API Functions ──────────────────────────────────────────────────────

/** Platform-wide statistics. Cached for 24 hours (ISR). */
export async function getStats(): Promise<ApiStats> {
  return apiFetch<ApiStats>("/stats", { next: { revalidate: 86400, tags: ["stats"] } });
}

/** All courses, optionally filtered. Cached 1 hour. */
export async function getCourses(params?: {
  category?: CourseCategory;
  level?: string;
}): Promise<Course[]> {
  const qs = params
    ? "?" + new URLSearchParams(params as Record<string, string>).toString()
    : "";
  return apiFetch<Course[]>(`/courses${qs}`, {
    next: { revalidate: 3600, tags: ["courses"] },
  });
}

/** Single course by slug. Cached 1 hour. */
export async function getCourse(slug: string): Promise<Course | null> {
  try {
    return await apiFetch<Course>(`/courses/${slug}`, {
      next: { revalidate: 3600, tags: [`course:${slug}`] },
    });
  } catch {
    return null;
  }
}

/** All centers. Cached 1 hour. */
export async function getCenters(params?: {
  state?: string;
  city?: string;
  featured?: boolean;
}): Promise<Center[]> {
  const qs = params
    ? "?" + new URLSearchParams(params as Record<string, string>).toString()
    : "";
  return apiFetch<Center[]>(`/centers${qs}`, {
    next: { revalidate: 3600, tags: ["centers"] },
  });
}

/** Single center by slug. Cached 1 hour. */
export async function getCenter(slug: string): Promise<Center | null> {
  try {
    return await apiFetch<Center>(`/centers/${slug}`, {
      next: { revalidate: 3600, tags: [`center:${slug}`] },
    });
  } catch {
    return null;
  }
}

/** Verify a certificate. Not cached — real-time lookup. */
export async function verifyCertificate(
  certNo: string
): Promise<VerificationResult> {
  return apiFetch<VerificationResult>(`/verify/certificate/${encodeURIComponent(certNo)}`, {
    cache: "no-store",
  });
}

/** Look up student result. Not cached. */
export async function lookupStudentResult(
  query: string
): Promise<StudentResult> {
  return apiFetch<StudentResult>(
    `/results/student?q=${encodeURIComponent(query)}`,
    { cache: "no-store" }
  );
}

/** Blog posts. Cached 1 hour. */
export async function getBlogPosts(params?: {
  category?: string;
  limit?: number;
}): Promise<BlogPost[]> {
  const qs = params
    ? "?" + new URLSearchParams(params as Record<string, string>).toString()
    : "";
  return apiFetch<BlogPost[]>(`/blog${qs}`, {
    next: { revalidate: 3600, tags: ["blog"] },
  });
}

/** Single blog post by slug. Cached 1 hour. */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    return await apiFetch<BlogPost>(`/blog/${slug}`, {
      next: { revalidate: 3600, tags: [`blog:${slug}`] },
    });
  } catch {
    return null;
  }
}

/** Submit an enquiry — always POST, no cache. */
export async function submitEnquiry(
  payload: EnquiryPayload
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>("/enquiries", {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}
