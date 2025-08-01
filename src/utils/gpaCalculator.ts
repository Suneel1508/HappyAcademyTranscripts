// GPA Calculation Utilities

export type CourseLevel = 'Regular' | 'Honors' | 'AP' | 'College Level'
export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'P' | 'IP'

// Grade point lookup system for different course levels
const GRADE_POINT_SCALES: Record<CourseLevel, Record<Grade, number>> = {
  'Regular': {
    'A+': 4.33,
    'A': 4.00,
    'A-': 3.67,
    'B+': 3.33,
    'B': 3.00,
    'B-': 2.67,
    'C+': 2.33,
    'C': 2.00,
    'C-': 1.67,
    'D+': 1.33,
    'D': 1.00,
    'D-': 0.67,
    'P': 0.00,
    'IP': 0.00
  },
  'Honors': {
    'A+': 4.67,
    'A': 4.33,
    'A-': 4.00,
    'B+': 3.67,
    'B': 3.33,
    'B-': 3.00,
    'C+': 2.67,
    'C': 2.33,
    'C-': 2.00,
    'D+': 1.67,
    'D': 1.33,
    'D-': 1.00,
    'P': 0.00,
    'IP': 0.00
  },
  'AP': {
    'A+': 5.33,
    'A': 5.00,
    'A-': 4.67,
    'B+': 4.33,
    'B': 4.00,
    'B-': 3.67,
    'C+': 3.33,
    'C': 3.00,
    'C-': 2.67,
    'D+': 2.33,
    'D': 2.00,
    'D-': 1.67,
    'P': 0.00,
    'IP': 0.00
  },
  'College Level': {
    'A+': 5.33,
    'A': 5.00,
    'A-': 4.67,
    'B+': 4.33,
    'B': 4.00,
    'B-': 3.67,
    'C+': 3.33,
    'C': 3.00,
    'C-': 2.67,
    'D+': 2.33,
    'D': 2.00,
    'D-': 1.67,
    'P': 0.00,
    'IP': 0.00
  }
}

// Unweighted grade points (4.0 scale for all courses)
const UNWEIGHTED_GRADE_POINTS: Record<Grade, number> = {
  'A+': 4.00,
  'A': 4.00,
  'A-': 3.67,
  'B+': 3.33,
  'B': 3.00,
  'B-': 2.67,
  'C+': 2.33,
  'C': 2.00,
  'C-': 1.67,
  'D+': 1.33,
  'D': 1.00,
  'D-': 0.67,
  'P': 0.00,
  'IP': 0.00
}

export interface Course {
  id: string
  course_name: string
  school_name: string
  course_level: CourseLevel
  grade: Grade
  credits: number
  semester: string
  year: number
}

export interface CourseWithPoints extends Course {
  weightedPoints: number
  unweightedPoints: number
  gradePoints: number
  unweightedGradePoints: number
}

export interface SemesterGPA {
  semester: string
  year: number
  courses: CourseWithPoints[]
  weightedGPA: number
  unweightedGPA: number
  totalCredits: number
}

export interface GPACalculationResult {
  coursesWithPoints: CourseWithPoints[]
  semesterGPAs: SemesterGPA[]
  cumulativeWeightedGPA: number
  cumulativeUnweightedGPA: number
  totalCredits: number
  totalWeightedPoints: number
  totalUnweightedPoints: number
}

/**
 * Lookup grade points for a specific grade and course level
 */
export function lookupGradePoints(grade: Grade, courseLevel: CourseLevel): number {
  return GRADE_POINT_SCALES[courseLevel][grade]
}

/**
 * Lookup unweighted grade points (4.0 scale)
 */
export function lookupUnweightedGradePoints(grade: Grade): number {
  return UNWEIGHTED_GRADE_POINTS[grade]
}

/**
 * Calculate weighted GPA for a list of courses
 */
export function calculateWeightedGPA(courses: Course[]): number {
  // Filter out courses with grades that should be excluded from GPA calculation
  const gradedCourses = courses.filter(course => course.grade !== 'P' && course.grade !== 'IP')
  
  if (gradedCourses.length === 0) return 0
  
  let totalWeightedPoints = 0
  let totalCredits = 0

  for (const course of gradedCourses) {
    const gradePoints = lookupGradePoints(course.grade, course.course_level)
    const weightedPoints = gradePoints * course.credits
    
    totalWeightedPoints += weightedPoints
    totalCredits += course.credits
  }

  if (totalCredits === 0) return 0
  
  const weightedGPA = totalWeightedPoints / totalCredits
  return Math.round(weightedGPA * 1000) / 1000 // Round to 3 decimal places
}

/**
 * Calculate unweighted GPA for a list of courses (4.0 scale)
 */
export function calculateUnweightedGPA(courses: Course[]): number {
  // Filter out courses with grades that should be excluded from GPA calculation
  const gradedCourses = courses.filter(course => course.grade !== 'P' && course.grade !== 'IP')
  
  if (gradedCourses.length === 0) return 0
  
  let totalUnweightedPoints = 0
  let totalCredits = 0

  for (const course of gradedCourses) {
    const gradePoints = lookupUnweightedGradePoints(course.grade)
    const unweightedPoints = gradePoints * course.credits
    
    totalUnweightedPoints += unweightedPoints
    totalCredits += course.credits
  }

  if (totalCredits === 0) return 0
  
  const unweightedGPA = totalUnweightedPoints / totalCredits
  return Math.round(unweightedGPA * 1000) / 1000 // Round to 3 decimal places
}

/**
 * Calculate comprehensive GPA data including semester breakdowns
 */
export function calculateComprehensiveGPA(courses: Course[]): GPACalculationResult {
  // Add points to each course
  const coursesWithPoints: CourseWithPoints[] = courses.map(course => {
    const gradePoints = lookupGradePoints(course.grade, course.course_level)
    const unweightedGradePoints = lookupUnweightedGradePoints(course.grade)
    const weightedPoints = gradePoints * course.credits
    const unweightedPoints = unweightedGradePoints * course.credits

    return {
      ...course,
      gradePoints,
      unweightedGradePoints,
      weightedPoints,
      unweightedPoints
    }
  })

  // Group courses by semester and year
  const semesterMap = new Map<string, CourseWithPoints[]>()
  
  coursesWithPoints.forEach(course => {
    const key = `${course.semester}-${course.year}`
    if (!semesterMap.has(key)) {
      semesterMap.set(key, [])
    }
    semesterMap.get(key)!.push(course)
  })

  // Calculate semester GPAs
  const semesterGPAs: SemesterGPA[] = Array.from(semesterMap.entries()).map(([key, semesterCourses]) => {
    const [semester, year] = key.split('-')
    
    // Filter out courses with grades that should be excluded from GPA calculation
    const gradedCourses = semesterCourses.filter(course => course.grade !== 'P' && course.grade !== 'IP')
    
    const totalWeightedPoints = gradedCourses.reduce((sum, course) => sum + course.weightedPoints, 0)
    const totalUnweightedPoints = gradedCourses.reduce((sum, course) => sum + course.unweightedPoints, 0)
    const totalCredits = gradedCourses.reduce((sum, course) => sum + course.credits, 0)
    
    const weightedGPA = totalCredits > 0 ? Math.round((totalWeightedPoints / totalCredits) * 1000) / 1000 : 0
    const unweightedGPA = totalCredits > 0 ? Math.round((totalUnweightedPoints / totalCredits) * 1000) / 1000 : 0

    return {
      semester,
      year: parseInt(year),
      courses: semesterCourses,
      weightedGPA,
      unweightedGPA,
      totalCredits
    }
  }).sort((a, b) => {
    // Sort by year first, then by semester
    if (a.year !== b.year) return a.year - b.year
    
    // Custom semester ordering: Fall, Spring, Summer
    const semesterOrder = { 'Fall': 1, 'Spring': 2, 'Summer': 3 }
    const aOrder = semesterOrder[a.semester as keyof typeof semesterOrder] || 4
    const bOrder = semesterOrder[b.semester as keyof typeof semesterOrder] || 4
    
    return aOrder - bOrder
  })

  // Calculate cumulative GPAs
  // Filter out courses with grades that should be excluded from GPA calculation
  const gradedCoursesWithPoints = coursesWithPoints.filter(course => course.grade !== 'P' && course.grade !== 'IP')
  
  const totalWeightedPoints = gradedCoursesWithPoints.reduce((sum, course) => sum + course.weightedPoints, 0)
  const totalUnweightedPoints = gradedCoursesWithPoints.reduce((sum, course) => sum + course.unweightedPoints, 0)
  const totalCredits = gradedCoursesWithPoints.reduce((sum, course) => sum + course.credits, 0)
  
  const cumulativeWeightedGPA = totalCredits > 0 ? Math.round((totalWeightedPoints / totalCredits) * 1000) / 1000 : 0
  const cumulativeUnweightedGPA = totalCredits > 0 ? Math.round((totalUnweightedPoints / totalCredits) * 1000) / 1000 : 0

  // Handle edge case where no valid courses exist
  const displayWeightedGPA = gradedCoursesWithPoints.length === 0 ? 0 : cumulativeWeightedGPA
  const displayUnweightedGPA = gradedCoursesWithPoints.length === 0 ? 0 : cumulativeUnweightedGPA

  return {
    coursesWithPoints,
    semesterGPAs,
    cumulativeWeightedGPA: displayWeightedGPA,
    cumulativeUnweightedGPA: displayUnweightedGPA,
    totalCredits,
    totalWeightedPoints,
    totalUnweightedPoints
  }
}