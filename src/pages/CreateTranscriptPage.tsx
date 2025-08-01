import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, Download } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { calculateComprehensiveGPA, type Course as GPACourse } from '../utils/gpaCalculator'

interface Course {
  id: string
  course_name: string
  school_name: string
  course_level: 'Regular' | 'Honors' | 'AP' | 'College Level'
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'P' | 'IP'
  credits: number
  semester: string
  year: number
}

interface StudentInfo {
  first_name: string
  last_name: string
  address: string
  date_of_birth: string
  guardian_name: string
  student_number: string
  gender: 'Male' | 'Female' | 'Other' | ''
  ssn: string
  curriculum_track: string
}

const CreateTranscriptPage: React.FC = () => {
  const { user } = useAuth()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [savedTranscriptId, setSavedTranscriptId] = useState<string | null>(null)
  
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    first_name: '',
    last_name: '',
    address: '',
    date_of_birth: '',
    guardian_name: '',
    student_number: '',
    gender: '',
    ssn: '',
    curriculum_track: ''
  })

  const [courses, setCourses] = useState<Course[]>([
    {
      id: '1',
      course_name: '',
      school_name: '',
      course_level: 'Regular',
      grade: 'A',
      credits: 1,
      semester: '',
      year: new Date().getFullYear()
    }
  ])

  // Calculate GPA data
  const gpaData = calculateComprehensiveGPA(courses as GPACourse[])

  // Group courses by school and then by semester
  const groupedCourses = courses.reduce((acc, course) => {
    if (!course.school_name) return acc
    
    if (!acc[course.school_name]) {
      acc[course.school_name] = {}
    }
    
    const semesterKey = `${course.semester} ${course.year}`
    if (!acc[course.school_name][semesterKey]) {
      acc[course.school_name][semesterKey] = []
    }
    
    acc[course.school_name][semesterKey].push(course)
    return acc
  }, {} as Record<string, Record<string, Course[]>>)

  const addNewCourse = () => {
    const newCourse: Course = {
      id: Date.now().toString(),
      course_name: '',
      school_name: '',
      course_level: 'Regular',
      grade: 'A',
      credits: 1,
      semester: '',
      year: new Date().getFullYear()
    }
    setCourses([...courses, newCourse])
  }

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter(course => course.id !== id))
    }
  }

  const updateCourse = (id: string, field: keyof Course, value: any) => {
    setCourses(courses.map(course => 
      course.id === id ? { ...course, [field]: value } : course
    ))
  }

  const updateStudentInfo = (field: keyof StudentInfo, value: string) => {
    setStudentInfo(prev => ({ ...prev, [field]: value }))
  }

  const schoolOptions = [
    'Legend College Preparatory',
    'Happy Academy High School',
    'Central High School',
    'Westfield Academy',
    'Lincoln High School',
    'Roosevelt Preparatory',
    'Other'
  ]

  const courseLevels: Course['course_level'][] = ['Regular', 'Honors', 'AP', 'College Level']
  const grades: Course['grade'][] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'P', 'IP']

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate student information
    if (!studentInfo.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }
    if (!studentInfo.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }
    if (!studentInfo.address.trim()) {
      newErrors.address = 'Address is required'
    }
    if (!studentInfo.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required'
    }
    if (!studentInfo.student_number.trim()) {
      newErrors.student_number = 'Student number is required'
    }

    // Validate courses
    courses.forEach((course, index) => {
      if (!course.course_name.trim()) {
        newErrors[`course_${course.id}_name`] = `Course ${index + 1} name is required`
      }
      if (!course.school_name.trim()) {
        newErrors[`course_${course.id}_school`] = `Course ${index + 1} school is required`
      }
      if (!course.semester.trim()) {
        newErrors[`course_${course.id}_semester`] = `Course ${index + 1} semester is required`
      }
      if (course.credits <= 0) {
        newErrors[`course_${course.id}_credits`] = `Course ${index + 1} credits must be greater than 0`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveTranscript = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Create transcript record
      const transcriptData = {
        name: `${studentInfo.first_name} ${studentInfo.last_name} - Transcript`,
        student_name: `${studentInfo.first_name} ${studentInfo.last_name}`,
        student_ssn: studentInfo.ssn,
        data: {
          student: studentInfo,
          courses: courses,
          gpa: gpaData
        },
        created_by: user?.id
      }

      const { data: transcript, error: transcriptError } = await supabase
        .from('transcripts')
        .insert([transcriptData])
        .select()
        .single()

      if (transcriptError) {
        throw transcriptError
      }

      // Save courses
      const coursesData = courses.map(course => ({
        transcript_id: transcript.id,
        course_name: course.course_name,
        school_name: course.school_name,
        course_level: course.course_level,
        grade: course.grade,
        credits: course.credits,
        semester: course.semester,
        year: course.year
      }))

      const { error: coursesError } = await supabase
        .from('courses')
        .insert(coursesData)

      if (coursesError) {
        throw coursesError
      }

      setSavedTranscriptId(transcript.id)
      alert('Transcript saved successfully!')
    } catch (error) {
      console.error('Error saving transcript:', error)
      alert(`Error saving transcript: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!validateForm()) {
      return
    }

    setIsDownloading(true)
    try {
      let transcriptId = savedTranscriptId

      // Save transcript first if not already saved
      if (!transcriptId) {
        await handleSaveTranscript()
        transcriptId = savedTranscriptId
      }

      if (!transcriptId) {
        throw new Error('Failed to save transcript')
      }

      // Generate PDF
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          transcriptId: transcriptId,
          studentInfo: studentInfo,
          courses: courses,
          gpaData: gpaData
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${studentInfo.first_name}_${studentInfo.last_name}_Transcript.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link 
                to="/dashboard" 
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Transcript</h1>
                <p className="text-gray-600">Generate a professional academic transcript</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Transcript'}
              </button>
            </div>
                onClick={handleDownloadPDF}
                disabled={isDownloading}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Input Form */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Enter Student and Course Information</h2>
              
              {/* Student Information */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={studentInfo.first_name}
                      onChange={(e) => updateStudentInfo('first_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter first name"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={studentInfo.last_name}
                      onChange={(e) => updateStudentInfo('last_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter last name"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={studentInfo.address}
                      onChange={(e) => updateStudentInfo('address', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter address"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={studentInfo.date_of_birth}
                      onChange={(e) => updateStudentInfo('date_of_birth', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.date_of_birth ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.date_of_birth && (
                      <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guardian Name
                    </label>
                    <input
                      type="text"
                      value={studentInfo.guardian_name}
                      onChange={(e) => updateStudentInfo('guardian_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter guardian name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student Number
                    </label>
                    <input
                      type="text"
                      value={studentInfo.student_number}
                      onChange={(e) => updateStudentInfo('student_number', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.student_number ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter student number"
                    />
                    {errors.student_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.student_number}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={studentInfo.gender}
                      onChange={(e) => updateStudentInfo('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SSN
                    </label>
                    <input
                      type="text"
                      value={studentInfo.ssn}
                      onChange={(e) => updateStudentInfo('ssn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter SSN"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Curriculum Track
                    </label>
                    <input
                      type="text"
                      value={studentInfo.curriculum_track}
                      onChange={(e) => updateStudentInfo('curriculum_track', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter curriculum track"
                    />
                  </div>
                </div>
              </div>

              {/* Courses */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Course Information</h3>
                  <button
                    onClick={addNewCourse}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add New Course
                  </button>
                </div>

                <div className="space-y-6">
                  {courses.map((course, index) => (
                    <div key={course.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">Course {index + 1}</h4>
                        {courses.length > 1 && (
                          <button
                            onClick={() => removeCourse(course.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Course Name
                          </label>
                          <input
                            type="text"
                            value={course.course_name}
                            onChange={(e) => updateCourse(course.id, 'course_name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors[`course_${course.id}_name`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="Enter course name"
                          />
                          {errors[`course_${course.id}_name`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`course_${course.id}_name`]}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            School Name
                          </label>
                          <select
                            value={course.school_name}
                            onChange={(e) => updateCourse(course.id, 'school_name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors[`course_${course.id}_school`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select school</option>
                            {schoolOptions.map(school => (
                              <option key={school} value={school}>{school}</option>
                            ))}
                          </select>
                          {errors[`course_${course.id}_school`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`course_${course.id}_school`]}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Course Level
                          </label>
                          <select
                            value={course.course_level}
                            onChange={(e) => updateCourse(course.id, 'course_level', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {courseLevels.map(level => (
                              <option key={level} value={level}>{level}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grade
                          </label>
                          <select
                            value={course.grade}
                            onChange={(e) => updateCourse(course.id, 'grade', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {grades.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Credits
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={course.credits}
                            onChange={(e) => updateCourse(course.id, 'credits', parseFloat(e.target.value) || 0)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors[`course_${course.id}_credits`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                          {errors[`course_${course.id}_credits`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`course_${course.id}_credits`]}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Semester
                          </label>
                          <select
                            value={course.semester}
                            onChange={(e) => updateCourse(course.id, 'semester', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors[`course_${course.id}_semester`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select semester</option>
                            <option value="1st Semester">1st Semester</option>
                            <option value="2nd Semester">2nd Semester</option>
                          </select>
                          {errors[`course_${course.id}_semester`] && (
                            <p className="mt-1 text-sm text-red-600">{errors[`course_${course.id}_semester`]}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Year
                          </label>
                          <input
                            type="number"
                            min="1900"
                            max="2030"
                            value={course.year}
                            onChange={(e) => updateCourse(course.id, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Live Preview */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-8">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                <p className="text-sm text-gray-600">Real-time transcript preview</p>
              </div>
              
              <div className="p-8 bg-white" style={{ fontFamily: 'Times, serif' }}>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="border-2 border-black p-3 mb-4">
                    <h1 className="text-lg font-bold text-black" style={{ letterSpacing: '2px' }}>
                      LEGEND COLLEGE PREPARATORY TRANSCRIPT
                    </h1>
                  </div>
                  <div className="text-xs text-black leading-tight mb-6">
                    <p>21050 McClellan Road, Cupertino CA 95014&nbsp;&nbsp;&nbsp;Tel: 4088650366&nbsp;&nbsp;&nbsp;Email: transcript@legendcp.com&nbsp;&nbsp;&nbsp;CEEB Code: 054732</p>
                  </div>
                </div>

                {/* Student Information - Two Column Layout */}
                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-8 text-xs">
                    {/* Left Column */}
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="font-bold w-24">Student Name:</span>
                        <span>{studentInfo.last_name || '[Last Name]'}, {studentInfo.first_name || '[First Name]'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-bold w-24">Address:</span>
                        <span>{studentInfo.address || '[Address]'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-bold w-24">Date of Birth:</span>
                        <span>{studentInfo.date_of_birth ? new Date(studentInfo.date_of_birth).toLocaleDateString() : '[Date of Birth]'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-bold w-24">Guardian:</span>
                        <span>{studentInfo.guardian_name || '[Guardian Name]'}</span>
                      </div>
                    </div>
                    
                    {/* Right Column */}
                    <div className="space-y-2">
                      <div className="flex">
                        <span className="font-bold w-24">Student Number:</span>
                        <span>{studentInfo.student_number || '[Student Number]'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-bold w-24">Gender:</span>
                        <span>{studentInfo.gender || '[Gender]'}</span>
                      </div>
                      <div className="flex">
                        <span className="font-bold w-24">SSN:</span>
                        <span>{studentInfo.ssn || '[SSN]'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GPA Summary Table */}
                <div className="mb-6">
                  <table className="w-full border-2 border-black text-xs">
                    <tbody>
                      <tr>
                        <td className="border border-black bg-gray-100 font-bold p-2 w-1/2">GPA Summary</td>
                        <td className="border border-black bg-gray-100 font-bold p-2 w-1/2">Total Credit Completed</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2">Cumulative GPA (Weighted): {gpaData.cumulativeWeightedGPA.toFixed(3)}</td>
                        <td className="border border-black p-2">{gpaData.totalCredits.toFixed(0)} LEGEND COLLEGE PREPARATORY</td>
                      </tr>
                      <tr>
                        <td className="border border-black bg-gray-100 font-bold p-2">Enrollment Summary</td>
                        <td className="border border-black bg-gray-100 font-bold p-2">Total Credit Transferred</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-2">
                          <table className="w-full text-xs">
                            <thead>
                              <tr>
                                <th className="text-left font-bold">Start/End Date</th>
                                <th className="text-left font-bold">Grade</th>
                                <th className="text-left font-bold">School</th>
                              </tr>
                            </thead>
                            <tbody>
                              {gpaData.semesterGPAs.map((semester, index) => (
                                <tr key={index}>
                                  <td>{semester.year}</td>
                                  <td>{semester.year - 2006}</td>
                                  <td>Legend College Preparatory</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                        <td className="border border-black p-2">
                          {/* Transfer credits would go here */}
                          <div className="space-y-1">
                            <div>150 Leigh High School</div>
                            <div>50 Foothill College</div>
                            <div>10 De Anza College</div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Course Listing by School and Semester */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-black mb-3 text-center" style={{ letterSpacing: '1px' }}>
                    LEGEND COLLEGE PREPARATORY TRANSCRIPT
                  </h3>
                  
                  {Object.keys(groupedCourses).length === 0 ? (
                    <div className="text-center text-xs text-gray-500 py-4">
                      No courses added yet
                    </div>
                  ) : (
                    Object.entries(groupedCourses).map(([schoolName, semesters]) => (
                      <div key={schoolName} className="mb-4">
                        {/* School Header */}
                        <h4 className="text-xs font-bold text-black mb-2 bg-gray-100 px-2 py-1">
                          {schoolName}
                        </h4>
                        
                        {Object.entries(semesters).map(([semesterKey, semesterCourses]) => (
                          <div key={semesterKey} className="mb-3">
                            {/* Semester Header */}
                            <h5 className="text-xs font-bold text-black mb-1 pl-2">
                              {semesterKey}
                            </h5>
                            
                            {/* Course Table */}
                            <table className="w-full text-xs border-collapse border border-black mb-2">
                              <thead>
                                <tr className="border-b border-black">
                                  <th className="text-left py-1 px-1 font-bold text-black border-r border-black" style={{ width: '15%' }}>Grade Level</th>
                                  <th className="text-left py-1 px-1 font-bold text-black border-r border-black" style={{ width: '15%' }}>School Year</th>
                                  <th className="text-left py-1 px-1 font-bold text-black border-r border-black" style={{ width: '35%' }}>Course Title</th>
                                  <th className="text-center py-1 px-1 font-bold text-black border-r border-black" style={{ width: '10%' }}>H/AP</th>
                                  <th className="text-center py-1 px-1 font-bold text-black border-r border-black" style={{ width: '10%' }}>Grade</th>
                                  <th className="text-center py-1 px-1 font-bold text-black" style={{ width: '15%' }}>Credits</th>
                                </tr>
                              </thead>
                              <tbody>
                                {semesterCourses.map((course) => (
                                  <tr key={course.id} className="border-b border-black">
                                    <td className="py-1 px-1 text-black border-r border-black text-xs">
                                      {course.year ? `Grade ${course.year - 2006}` : '[Grade]'}
                                    </td>
                                    <td className="py-1 px-1 text-black border-r border-black text-xs">
                                      {course.year || '[Year]'}
                                    </td>
                                    <td className="py-1 px-1 text-black border-r border-black text-xs">
                                      {course.course_name || '[Course Name]'}
                                    </td>
                                    <td className="py-1 px-1 text-center text-black border-r border-black text-xs">
                                      {course.course_level === 'Honors' ? 'H' : 
                                       course.course_level === 'AP' ? 'AP' : ''}
                                    </td>
                                    <td className="py-1 px-1 text-center text-black border-r border-black text-xs font-bold">
                                      {course.grade}
                                    </td>
                                    <td className="py-1 px-1 text-center text-black text-xs">
                                      {course.credits.toFixed(1)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            
                            {/* Semester GPA */}
                            <div className="text-right text-xs text-black mb-2">
                              <span className="font-bold">
                                Sem. GPA (Weighted): {calculateWeightedGPA(semesterCourses as GPACourse[]).toFixed(3)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-3 border-t border-black">
                  <div className="flex justify-between items-start text-xs text-black">
                    <div>
                      <p>Transcript generated on {new Date().toLocaleDateString()}</p>
                      <p>Generated by: {user?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Legend College Preparatory</p>
                      <p>Registrar's Office</p>
                      <div className="mt-4 pt-2 border-t border-black">
                        <p className="mb-2">Principal Signature:</p>
                        <div className="border-b border-black w-32 mb-2"></div>
                        <p>Date: _______________</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CreateTranscriptPage