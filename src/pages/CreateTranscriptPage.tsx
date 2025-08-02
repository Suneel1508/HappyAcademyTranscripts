import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, Download } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { calculateComprehensiveGPA, lookupGradePoints, type Course as GPACourse } from '../utils/gpaCalculator'

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

interface TranscriptInfo {
  school_name: string
  school_address: string
  school_phone: string
  school_email: string
  ceeb_code: string
  principal_name: string
  signature_date: string
}

const CreateTranscriptPage: React.FC = () => {
  const { user } = useAuth()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [savedTranscriptId, setSavedTranscriptId] = useState<string | null>(null)
  
  const [transcriptInfo, setTranscriptInfo] = useState<TranscriptInfo>({
    school_name: 'Happy Academy High School',
    school_address: '21050 McClellan Road, Cupertino CA 95014',
    school_phone: '4088650366',
    school_email: 'transcript@legendcp.com',
    ceeb_code: '054732',
    principal_name: 'Sangeetha Padman',
    signature_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  })

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

  // Calculate school-specific credits
  const transcriptSchoolCredits = courses
    .filter(course => course.school_name === transcriptInfo.school_name)
    .reduce((sum, course) => sum + course.credits, 0)

  const transferCredits = courses
    .filter(course => course.school_name !== transcriptInfo.school_name)
    .reduce((acc, course) => {
      if (!acc[course.school_name]) {
        acc[course.school_name] = 0
      }
      acc[course.school_name] += course.credits
      return acc
    }, {} as Record<string, number>)

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

  const updateTranscriptInfo = (field: keyof TranscriptInfo, value: string) => {
    setTranscriptInfo(prev => ({ ...prev, [field]: value }))
  }

  // Function to mask SSN - show only last 4 digits
  const maskSSN = (ssn: string): string => {
    if (!ssn || ssn.length < 4) return ssn
    const lastFour = ssn.slice(-4)
    const masked = 'XXX-XX-' + lastFour
    return masked
  }

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
      // First, save or update student record
      const studentData = {
        first_name: studentInfo.first_name,
        last_name: studentInfo.last_name,
        address: studentInfo.address,
        date_of_birth: studentInfo.date_of_birth,
        guardian_name: studentInfo.guardian_name || null,
        student_number: studentInfo.student_number,
        gender: studentInfo.gender || null,
        ssn: studentInfo.ssn || null,
        curriculum_track: studentInfo.curriculum_track || null
      }

      // Check if student already exists
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('student_number', studentInfo.student_number)

      let studentId
      if (existingStudent) {
        // Update existing student
        const { data: updatedStudent, error: updateError } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', existingStudent.id)
          .select()
          .single()

        if (updateError) throw updateError
        studentId = updatedStudent.id
      } else {
        // Create new student
        const { data: newStudent, error: insertError } = await supabase
          .from('students')
          .insert([studentData])
          .select()
          .single()

        if (insertError) throw insertError
        studentId = newStudent.id
      }

      // Create transcript record
      const transcriptData = {
        name: `${studentInfo.first_name} ${studentInfo.last_name} - ${transcriptInfo.school_name}`,
        student_name: `${studentInfo.first_name} ${studentInfo.last_name}`,
        student_ssn: studentInfo.ssn,
        data: {
          student: { ...studentInfo, id: studentId },
          transcript: transcriptInfo,
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
      // Always save transcript first to ensure it's in database
      await handleSaveTranscript()
      
      if (!savedTranscriptId) {
        throw new Error('Failed to save transcript before generating PDF')
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
          transcriptId: savedTranscriptId,
          studentInfo: studentInfo,
          transcriptInfo: transcriptInfo,
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
      a.download = `${studentInfo.first_name}_${studentInfo.last_name}_${transcriptInfo.school_name.replace(/\s+/g, '_')}_Transcript.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('PDF downloaded successfully! Transcript has been saved to your records.')
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
              <button
                onClick={handleSaveTranscript}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Transcript'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
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
              
              {/* Transcript Information */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Transcript Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Name (Transcript Issuing School)
                    </label>
                    <input
                      type="text"
                      value={transcriptInfo.school_name}
                      onChange={(e) => updateTranscriptInfo('school_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter school name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Address
                    </label>
                    <input
                      type="text"
                      value={transcriptInfo.school_address}
                      onChange={(e) => updateTranscriptInfo('school_address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter school address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Phone
                    </label>
                    <input
                      type="text"
                      value={transcriptInfo.school_phone}
                      onChange={(e) => updateTranscriptInfo('school_phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Email
                    </label>
                    <input
                      type="email"
                      value={transcriptInfo.school_email}
                      onChange={(e) => updateTranscriptInfo('school_email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEEB Code
                    </label>
                    <input
                      type="text"
                      value={transcriptInfo.ceeb_code}
                      onChange={(e) => updateTranscriptInfo('ceeb_code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter CEEB code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Principal Name
                    </label>
                    <input
                      type="text"
                      value={transcriptInfo.principal_name}
                      onChange={(e) => updateTranscriptInfo('principal_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter principal name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signature Date
                    </label>
                    <input
                      type="date"
                      value={transcriptInfo.signature_date.split(',')[0] ? new Date(transcriptInfo.signature_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const date = new Date(e.target.value)
                        const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        updateTranscriptInfo('signature_date', formattedDate)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

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
                      SSN (Optional)
                    </label>
                    <input
                      type="text"
                      value={studentInfo.ssn}
                      onChange={(e) => updateStudentInfo('ssn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter SSN (optional)"
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
                          <input
                            type="text"
                            value={course.school_name}
                            onChange={(e) => updateCourse(course.id, 'school_name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors[`course_${course.id}_school`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="Enter school name"
                          />
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
              <div className="transcript-preview">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="transcript-header">
                    <h1 className="text-lg font-bold text-black" style={{ letterSpacing: '2px' }}>
                      {transcriptInfo.school_name.toUpperCase()} TRANSCRIPT
                    </h1>
                  </div>
                  <div className="transcript-contact">
                    <p>{transcriptInfo.school_address}&nbsp;&nbsp;&nbsp;Tel: {transcriptInfo.school_phone}&nbsp;&nbsp;&nbsp;Email: {transcriptInfo.school_email}&nbsp;&nbsp;&nbsp;CEEB Code: {transcriptInfo.ceeb_code}</p>
                  </div>
                </div>

                {/* Student Information */}
                <div className="mb-6">
                  <div className="transcript-student-info">
                    {/* Left Column */}
                    <div className="space-y-2">
                      <div className="transcript-student-row">
                        <span className="transcript-student-label">Student Name:</span>
                        <span>{studentInfo.last_name || '[Last Name]'}, {studentInfo.first_name || '[First Name]'}</span>
                      </div>
                      <div className="transcript-student-row">
                        <span className="transcript-student-label">Address:</span>
                        <span>{studentInfo.address || '[Address]'}</span>
                      </div>
                      <div className="transcript-student-row">
                        <span className="transcript-student-label">Date of Birth:</span>
                        <span>{studentInfo.date_of_birth ? new Date(studentInfo.date_of_birth).toLocaleDateString() : '[Date of Birth]'}</span>
                      </div>
                      <div className="transcript-student-row">
                        <span className="transcript-student-label">Guardian:</span>
                        <span>{studentInfo.guardian_name || '[Guardian Name]'}</span>
                      </div>
                    </div>
                    
                    {/* Right Column */}
                    <div className="space-y-2">
                      <div className="transcript-student-row">
                        <span className="transcript-student-label">Student Number:</span>
                        <span>{studentInfo.student_number || '[Student Number]'}</span>
                      </div>
                      <div className="transcript-student-row">
                        <span className="transcript-student-label">Gender:</span>
                        <span>{studentInfo.gender || '[Gender]'}</span>
                      </div>
                      {studentInfo.ssn && (
                        <div className="transcript-student-row">
                          <span className="transcript-student-label">SSN:</span>
                          <span>{maskSSN(studentInfo.ssn)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* GPA Summary Table */}
                <div className="mb-6">
                  <table className="transcript-table">
                    <tbody>
                      <tr>
                        <th className="w-1/2">GPA Summary</th>
                        <th className="w-1/2">Total Credit Completed</th>
                      </tr>
                      <tr>
                        <td>Cumulative GPA (Weighted): {gpaData.cumulativeWeightedGPA === 0 && gpaData.totalCredits === 0 ? 'N/A' : gpaData.cumulativeWeightedGPA.toFixed(3)}</td>
                        <td>{transcriptSchoolCredits.toFixed(0)} {transcriptInfo.school_name.toUpperCase()}</td>
                      </tr>
                      <tr>
                        <th>Enrollment Summary</th>
                        <th>Total Credit Transferred</th>
                      </tr>
                      <tr>
                        <td>
                          <table className="w-full text-xs border-0">
                            <thead>
                              <tr>
                                <th className="text-left font-bold border-0 p-1">Start/End Date</th>
                                <th className="text-left font-bold border-0 p-1">Grade</th>
                                <th className="text-left font-bold border-0 p-1">School</th>
                              </tr>
                            </thead>
                            <tbody>
                              {gpaData.semesterGPAs.map((semester, index) => (
                                <tr key={index}>
                                  <td className="border-0 p-1">{semester.year}</td>
                                  <td className="border-0 p-1">{semester.year - 2006}</td>
                                  <td className="border-0 p-1">{transcriptInfo.school_name}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                        <td>
                          <div className="space-y-1">
                            {Object.entries(transferCredits).map(([school, credits]) => (
                              <div key={school}>{credits.toFixed(0)} {school}</div>
                            ))}
                            {Object.keys(transferCredits).length === 0 && (
                              <div className="text-gray-500 text-xs">No transfer credits</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Course Listing by School and Semester */}
                <div className="mb-6">
                  {Object.keys(groupedCourses).length === 0 ? (
                    <div className="text-center text-xs text-gray-500 py-4">
                      No courses added yet
                    </div>
                  ) : (
                    Object.entries(groupedCourses).map(([schoolName, semesters]) => (
                      <div key={schoolName} className="mb-4">
                        {/* School Header with Border */}
                        <div className="border-2 border-black mb-4">
                          <h4 className="text-sm font-bold text-black text-center py-2 bg-gray-100">
                            {schoolName}
                          </h4>
                          
                          {/* Side-by-side semester layout */}
                          <div className="grid grid-cols-2 border-t border-black">
                            {/* 1st Semester Column */}
                            <div className="border-r border-black">
                              <div className="bg-gray-100 px-2 py-1 border-b border-black">
                                <span className="text-xs font-bold">1st Semester:</span>
                              </div>
                              
                              {/* 1st Semester Header Row */}
                              <div className="grid grid-cols-6 text-xs font-bold border-b border-black bg-white">
                                <div className="px-1 py-1 border-r border-black">Grade Level</div>
                                <div className="px-1 py-1 border-r border-black">School Year</div>
                                <div className="px-1 py-1 border-r border-black">Course Title</div>
                                <div className="px-1 py-1 border-r border-black">H/AP</div>
                                <div className="px-1 py-1 border-r border-black">Grade</div>
                                <div className="px-1 py-1">Credits</div>
                              </div>
                              
                              {/* 1st Semester Courses */}
                              {Object.entries(semesters)
                                .filter(([semKey]) => semKey.includes('1st Semester'))
                                .map(([semesterKey, semesterCourses]) => (
                                  <div key={semesterKey}>
                                    {semesterCourses.map((course) => (
                                      <div key={course.id} className="grid grid-cols-6 text-xs border-b border-gray-300">
                                        <div className="px-1 py-1 border-r border-black">
                                          {course.year ? course.year - 2006 : '[Grade]'}
                                        </div>
                                        <div className="px-1 py-1 border-r border-black">
                                          '{course.year ? course.year.toString().slice(-2) : '[YY]'}-{course.year ? (course.year + 1).toString().slice(-2) : '[YY]'}
                                        </div>
                                        <div className="px-1 py-1 border-r border-black">
                                          {course.course_name || '[Course Name]'}
                                        </div>
                                        <div className="px-1 py-1 border-r border-black text-center">
                                          {course.course_level === 'Honors' ? 'H' : 
                                           course.course_level === 'AP' ? 'AP' : 
                                           course.course_level === 'College Level' ? 'CL' : ''}
                                        </div>
                                        <div className="px-1 py-1 border-r border-black text-center font-bold">
                                          {course.grade}
                                        </div>
                                        <div className="px-1 py-1 text-center">
                                          {course.credits}
                                        </div>
                                      </div>
                                    ))}
                                    {/* 1st Semester GPA */}
                                    <div className="bg-gray-100 px-2 py-1 text-xs font-bold border-b border-black">
                                      Sem. GPA (Weighted): {(() => {
                                        const firstSemCourses = semesterCourses.filter(c => c.grade !== 'P' && c.grade !== 'IP');
                                        if (firstSemCourses.length === 0) return '0.00';
                                        const totalPoints = firstSemCourses.reduce((sum, c) => {
                                          const gradePoints = lookupGradePoints(c.grade, c.course_level);
                                          return sum + (gradePoints * c.credits);
                                        }, 0);
                                        const totalCredits = firstSemCourses.reduce((sum, c) => sum + c.credits, 0);
                                        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
                                      })()}
                                    </div>
                                  </div>
                                ))}
                            </div>
                            
                            {/* 2nd Semester Column */}
                            <div>
                              <div className="bg-gray-100 px-2 py-1 border-b border-black">
                                <span className="text-xs font-bold">2nd Semester:</span>
                              </div>
                              
                              {/* 2nd Semester Header Row */}
                              <div className="grid grid-cols-6 text-xs font-bold border-b border-black bg-white">
                                <div className="px-1 py-1 border-r border-black">Grade Level</div>
                                <div className="px-1 py-1 border-r border-black">School Year</div>
                                <div className="px-1 py-1 border-r border-black">Course Title</div>
                                <div className="px-1 py-1 border-r border-black">H/AP</div>
                                <div className="px-1 py-1 border-r border-black">Grade</div>
                                <div className="px-1 py-1">Credits</div>
                              </div>
                              
                              {/* 2nd Semester Courses */}
                              {Object.entries(semesters)
                                .filter(([semKey]) => semKey.includes('2nd Semester'))
                                .map(([semesterKey, semesterCourses]) => (
                                  <div key={semesterKey}>
                                    {semesterCourses.map((course) => (
                                      <div key={course.id} className="grid grid-cols-6 text-xs border-b border-gray-300">
                                        <div className="px-1 py-1 border-r border-black">
                                          {course.year ? course.year - 2006 : '[Grade]'}
                                        </div>
                                        <div className="px-1 py-1 border-r border-black">
                                          '{course.year ? course.year.toString().slice(-2) : '[YY]'}-{course.year ? (course.year + 1).toString().slice(-2) : '[YY]'}
                                        </div>
                                        <div className="px-1 py-1 border-r border-black">
                                          {course.course_name || '[Course Name]'}
                                        </div>
                                        <div className="px-1 py-1 border-r border-black text-center">
                                          {course.course_level === 'Honors' ? 'H' : 
                                           course.course_level === 'AP' ? 'AP' : 
                                           course.course_level === 'College Level' ? 'CL' : ''}
                                        </div>
                                        <div className="px-1 py-1 border-r border-black text-center font-bold">
                                          {course.grade}
                                        </div>
                                        <div className="px-1 py-1 text-center">
                                          {course.credits}
                                        </div>
                                      </div>
                                    ))}
                                    {/* 2nd Semester GPA */}
                                    <div className="bg-gray-100 px-2 py-1 text-xs font-bold border-b border-black">
                                      Sem. GPA (Weighted): {(() => {
                                        const secondSemCourses = semesterCourses.filter(c => c.grade !== 'P' && c.grade !== 'IP');
                                        if (secondSemCourses.length === 0) return '0.00';
                                        const totalPoints = secondSemCourses.reduce((sum, c) => {
                                          const gradePoints = lookupGradePoints(c.grade, c.course_level);
                                          return sum + (gradePoints * c.credits);
                                        }, 0);
                                        const totalCredits = secondSemCourses.reduce((sum, c) => sum + c.credits, 0);
                                        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
                                      })()}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                        
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-3 border-t border-black">
                  <div className="flex justify-between items-center text-xs text-black">
                    {/* Left side - Comments/Legend Box */}
                    <div className="border-2 border-black p-4" style={{ width: '350px', height: '180px' }}>
                      <div className="bg-gray-100 border-b border-black pb-2 mb-3 -mx-4 -mt-4 px-4 pt-2">
                        <h4 className="font-bold">Comments</h4>
                      </div>
                      <div className="space-y-2">
                        <p className="font-bold">UNOFFICIAL TRANSCRIPT</p>
                        <p>CL-College Level</p>
                        <p>IP- In Progress</p>
                        <p>P- Pass</p>
                        <p>F- Fail</p>
                        <div className="mt-8 text-center text-gray-400 border border-gray-300 rounded p-4">
                          <p className="text-xs">School Stamp Area</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - Principal Signature */}
                    <div className="text-center" style={{ width: '250px' }}>
                      <div className="border-b border-black w-full mb-2" style={{ height: '1px' }}></div>
                      <p className="mb-1">Principal Signature: {transcriptInfo.principal_name}</p>
                      <p>Date: {transcriptInfo.signature_date}</p>
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