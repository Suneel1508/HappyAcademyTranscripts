/*
  # Update Students table schema to match PDF structure

  1. New Fields Added to Students Table
    - `address` (VARCHAR(255) NOT NULL) - Student's address
    - `date_of_birth` (DATE NOT NULL) - Student's date of birth
    - `guardian_name` (VARCHAR(255) NULL) - Parent/guardian name
    - `student_number` (VARCHAR(255) UNIQUE NOT NULL) - Unique student ID number
    - `gender` (ENUM('Male', 'Female', 'Other') NULL) - Student's gender
    - `ssn` (VARCHAR(255) NULL) - Social Security Number
    - `curriculum_track` (VARCHAR(255) NULL) - Academic track/program

  2. Security
    - Maintain existing RLS policies
    - Add unique constraint on student_number

  3. Data Integrity
    - Use safe column additions with IF NOT EXISTS checks
    - Maintain existing data structure
*/

-- Create gender enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
    CREATE TYPE gender_enum AS ENUM ('Male', 'Female', 'Other');
  END IF;
END $$;

-- Add new fields to students table (assuming it exists from previous migrations)
-- If students table doesn't exist, we'll create it with all fields

DO $$
BEGIN
  -- Check if students table exists, if not create it
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
    CREATE TABLE students (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      first_name text NOT NULL,
      last_name text NOT NULL,
      address varchar(255) NOT NULL,
      date_of_birth date NOT NULL,
      guardian_name varchar(255),
      student_number varchar(255) UNIQUE NOT NULL,
      gender gender_enum,
      ssn varchar(255),
      curriculum_track varchar(255),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  ELSE
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'address') THEN
      ALTER TABLE students ADD COLUMN address varchar(255) NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'date_of_birth') THEN
      ALTER TABLE students ADD COLUMN date_of_birth date NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'guardian_name') THEN
      ALTER TABLE students ADD COLUMN guardian_name varchar(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'student_number') THEN
      ALTER TABLE students ADD COLUMN student_number varchar(255) UNIQUE NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'gender') THEN
      ALTER TABLE students ADD COLUMN gender gender_enum;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'ssn') THEN
      ALTER TABLE students ADD COLUMN ssn varchar(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'curriculum_track') THEN
      ALTER TABLE students ADD COLUMN curriculum_track varchar(255);
    END IF;
  END IF;
END $$;

-- Enable RLS on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for students table
CREATE POLICY "Admin users can read all students"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin users can insert students"
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

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to students table
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure transcripts table exists and links to students
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    CREATE TABLE courses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      transcript_id uuid NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
      course_name text NOT NULL,
      school_name text NOT NULL,
      course_level text NOT NULL CHECK (course_level IN ('Regular', 'Honors', 'AP', 'College Level')),
      grade text NOT NULL CHECK (grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'P')),
      credits numeric(4,2) NOT NULL DEFAULT 1.0,
      semester text,
      year integer,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Enable RLS on courses table
    ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
    
    -- Create RLS policies for courses table
    CREATE POLICY "Admin users can read all courses"
      ON courses
      FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "Admin users can insert courses"
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
      
    -- Add updated_at trigger to courses table
    CREATE TRIGGER update_courses_updated_at
      BEFORE UPDATE ON courses
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_student_number ON students(student_number);
CREATE INDEX IF NOT EXISTS idx_students_last_name ON students(last_name);
CREATE INDEX IF NOT EXISTS idx_students_first_name ON students(first_name);
CREATE INDEX IF NOT EXISTS idx_courses_transcript_id ON courses(transcript_id);
CREATE INDEX IF NOT EXISTS idx_courses_school_name ON courses(school_name);