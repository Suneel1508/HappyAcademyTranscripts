/*
  # Comprehensive Database Schema for Transcript System

  1. New Tables
    - `students`
      - `student_id` (serial, primary key)
      - `first_name` (varchar(255), not null)
      - `last_name` (varchar(255), not null)
      - `student_id_number` (varchar(255), unique, nullable)
      - `date_of_birth` (date, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `transcripts`
      - `transcript_id` (serial, primary key)
      - `student_id` (integer, foreign key to students)
      - `date_created` (timestamptz, default now())
      - `last_updated` (timestamptz, default now())

    - `courses`
      - `course_id` (serial, primary key)
      - `transcript_id` (integer, foreign key to transcripts)
      - `course_name` (varchar(255), not null)
      - `school_name` (varchar(255), nullable)
      - `course_level` (enum: Regular, Honors, AP, College Level)
      - `grade` (enum: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, P)
      - `credits` (decimal(5,2), not null)
      - `semester` (varchar(255), nullable)
      - `year` (integer, nullable)

  2. Relationships
    - One Student can have multiple Transcripts (1:many)
    - One Transcript can have multiple Courses (1:many)

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users
</sql>

-- Create custom types for enums
CREATE TYPE course_level_enum AS ENUM ('Regular', 'Honors', 'AP', 'College Level');
CREATE TYPE grade_enum AS ENUM ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'P');

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  student_id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  student_id_number VARCHAR(255) UNIQUE,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcripts Table
CREATE TABLE IF NOT EXISTS transcripts (
  transcript_id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  date_created TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_transcripts_student
    FOREIGN KEY (student_id) 
    REFERENCES students(student_id) 
    ON DELETE CASCADE
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
  course_id SERIAL PRIMARY KEY,
  transcript_id INTEGER NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  school_name VARCHAR(255),
  course_level course_level_enum NOT NULL,
  grade grade_enum NOT NULL,
  credits DECIMAL(5, 2) NOT NULL,
  semester VARCHAR(255),
  year INTEGER,
  CONSTRAINT fk_courses_transcript
    FOREIGN KEY (transcript_id) 
    REFERENCES transcripts(transcript_id) 
    ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_student_id_number ON students(student_id_number);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_transcripts_student_id ON transcripts(student_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_date_created ON transcripts(date_created DESC);
CREATE INDEX IF NOT EXISTS idx_courses_transcript_id ON courses(transcript_id);
CREATE INDEX IF NOT EXISTS idx_courses_year_semester ON courses(year, semester);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policies for students table
CREATE POLICY "Admin users can read all students"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can create students"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin users can update students"
  ON students
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can delete students"
  ON students
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for transcripts table
CREATE POLICY "Admin users can read all transcripts"
  ON transcripts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can create transcripts"
  ON transcripts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin users can update transcripts"
  ON transcripts
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can delete transcripts"
  ON transcripts
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for courses table
CREATE POLICY "Admin users can read all courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can create courses"
  ON courses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin users can update courses"
  ON courses
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can delete courses"
  ON courses
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger function for updating last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcripts_last_updated
    BEFORE UPDATE ON transcripts
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();