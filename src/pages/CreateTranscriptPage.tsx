import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface Course {
  id: string
  course_name: string
  school_name: string
  course_level: 'Regular' | 'Honors' | 'AP' | 'College Level'
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'P'
  credits: number
  semester: string
  year: number
}

interface StudentInfo {
  first_name: string
  last_name: string
  student_id_number: string
}

const CreateTranscriptPage: React.FC = () => {
  const { user } = useAuth()
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    first_name: '',
    last_name: '',
    student_id_number: ''
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
    'Happy Academy High School',
    'Central High School',
    'Westfield Academy',
    'Lincoln High School',
    'Roosevelt Preparatory',
    'Other'
  ]

  const courseLevels: Course['course_level'][] = ['Regular', 'Honors', 'AP', 'College Level']
  const grades: Course['grade'][] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'P']

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
                Save Transcript
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={studentInfo.last_name}
                      onChange={(e) => updateStudentInfo('last_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Student ID Number
                    </label>
                    <input
                      type="text"
                      value={studentInfo.student_id_number}
                      onChange={(e) => updateStudentInfo('student_id_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter student ID"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter course name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            School Name
                          </label>
                          <select
                            value={course.school_name}
                            onChange={(e) => updateCourse(course.id, 'school_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select school</option>
                            {schoolOptions.map(school => (
                              <option key={school} value={school}>{school}</option>
                            ))}
                          </select>
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Semester
                          </label>
                          <input
                            type="text"
                            value={course.semester}
                            onChange={(e) => updateCourse(course.id, 'semester', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Fall, Spring"
                          />
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
                {/* Transcript Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">OFFICIAL TRANSCRIPT</h1>
                  <div className="w-24 h-0.5 bg-gray-900 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-700">Happy Academy</p>
                  <p className="text-sm text-gray-700">123 Education Street, Learning City, LC 12345</p>
                  <p className="text-sm text-gray-700">Phone: (555) 123-4567</p>
                </div>

                {/* Student Information */}
                <div className="mb-6">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1 pr-4 font-semibold text-gray-900 w-32">Student Name:</td>
                        <td className="py-1 text-gray-800">
                          {studentInfo.last_name || '[Last Name]'}, {studentInfo.first_name || '[First Name]'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-4 font-semibold text-gray-900">Student ID:</td>
                        <td className="py-1 text-gray-800">
                          {studentInfo.student_id_number || '[Student ID]'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-4 font-semibold text-gray-900">Date Issued:</td>
                        <td className="py-1 text-gray-800">
                          {new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Course Table */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">ACADEMIC RECORD</h3>
                  
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-t-2 border-b-2 border-gray-900">
                        <th className="text-left py-2 px-1 font-bold text-gray-900">COURSE</th>
                        <th className="text-left py-2 px-1 font-bold text-gray-900">SCHOOL</th>
                        <th className="text-center py-2 px-1 font-bold text-gray-900">LEVEL</th>
                        <th className="text-center py-2 px-1 font-bold text-gray-900">GRADE</th>
                        <th className="text-center py-2 px-1 font-bold text-gray-900">CREDITS</th>
                        <th className="text-center py-2 px-1 font-bold text-gray-900">TERM</th>
                        <th className="text-center py-2 px-1 font-bold text-gray-900">YEAR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course, index) => (
                        <tr key={course.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-2 px-1 text-gray-800 border-b border-gray-200">
                            {course.course_name || '[Course Name]'}
                          </td>
                          <td className="py-2 px-1 text-gray-800 border-b border-gray-200">
                            {course.school_name || '[School]'}
                          </td>
                          <td className="py-2 px-1 text-center text-gray-800 border-b border-gray-200">
                            {course.course_level}
                          </td>
                          <td className="py-2 px-1 text-center text-gray-800 border-b border-gray-200 font-semibold">
                            {course.grade}
                          </td>
                          <td className="py-2 px-1 text-center text-gray-800 border-b border-gray-200">
                            {course.credits.toFixed(1)}
                          </td>
                          <td className="py-2 px-1 text-center text-gray-800 border-b border-gray-200">
                            {course.semester || '[Term]'}
                          </td>
                          <td className="py-2 px-1 text-center text-gray-800 border-b border-gray-200">
                            {course.year}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-300">
                  <div className="flex justify-between items-center text-xs text-gray-600">
                    <div>
                      <p>Transcript generated on {new Date().toLocaleDateString()}</p>
                      <p>Generated by: {user?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Happy Academy</p>
                      <p>Registrar's Office</p>
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