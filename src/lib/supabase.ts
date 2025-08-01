import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export type Student = {
  id: string
  first_name: string
  last_name: string
  address: string
  date_of_birth: string
  guardian_name?: string
  student_number: string
  gender?: 'Male' | 'Female' | 'Other'
  ssn?: string
  curriculum_track?: string
  created_at: string
  updated_at: string
}

export type Transcript = {
  id: string
  name: string
  student_name?: string
  student_ssn?: string
  data: any
  created_by?: string
  created_at: string
  updated_at: string
}

export type CourseLevel = 'Regular' | 'Honors' | 'AP' | 'College Level'
export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'P'

export type Course = {
  id: string
  transcript_id: string
  course_name: string
  school_name: string
  course_level: CourseLevel
  grade: Grade
  credits: number
  semester?: string
  year?: number
  created_at: string
  updated_at: string
}