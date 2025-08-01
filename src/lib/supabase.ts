import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export type User = {
  user_id: number
  username: string
  hashed_password: string
  created_at: string
}

export type Student = {
  student_id: number
  first_name: string
  last_name: string
  student_id_number?: string
  date_of_birth?: string
  created_at: string
  updated_at: string
}

export type Transcript = {
  transcript_id: number
  student_id: number
  date_created: string
  last_updated: string
}

export type CourseLevel = 'Regular' | 'Honors' | 'AP' | 'College Level'
export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'P'

export type Course = {
  course_id: number
  transcript_id: number
  course_name: string
  school_name?: string
  course_level: CourseLevel
  grade: Grade
  credits: number
  semester?: string
  year?: number
}