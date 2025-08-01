import React, { useState, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, FileText, Download, Eye, Edit, Calendar, User, GraduationCap } from 'lucide-react'
import { supabase, type Student, type Transcript } from '../lib/supabase'

const StudentTranscriptsPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>()
  const location = useLocation()
  const [student, setStudent] = useState<Student | null>(location.state?.student || null)
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (studentId) {
      fetchStudentData()
      fetchStudentTranscripts()
    }
  }, [studentId])

  const fetchStudentData = async () => {
    if (student) return // Already have student data from navigation state
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (error) throw error
      setStudent(data)
    } catch (err) {
      console.error('Error fetching student:', err)
      setError('Failed to load student information')
    }
  }

  const fetchStudentTranscripts = async () => {
    try {
      const { data, error } = await supabase
        .from('transcripts')
        .select('*')
        .eq('data->>student->>id', studentId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTranscripts(data || [])
    } catch (err) {
      console.error('Error fetching transcripts:', err)
      setError('Failed to load transcripts')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (transcript: Transcript) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          transcriptId: transcript.id,
          studentInfo: transcript.data.student,
          courses: transcript.data.courses,
          gpaData: transcript.data.gpa
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${transcript.student_name?.replace(' ', '_')}_Transcript.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Student not found</h2>
          <Link to="/students" className="text-blue-600 hover:text-blue-700">
            Return to Students
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link 
                to="/students" 
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {student.last_name}, {student.first_name}
                </h1>
                <p className="text-gray-600">Student transcripts and records</p>
              </div>
            </div>
            <Link
              to="/create-transcript"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              Create New Transcript
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Information Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex items-center mb-4">
            <User className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Student Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Student Number</p>
              <p className="text-gray-900">{student.student_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
              <p className="text-gray-900">
                {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Gender</p>
              <p className="text-gray-900">{student.gender || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Guardian</p>
              <p className="text-gray-900">{student.guardian_name || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">SSN</p>
              <p className="text-gray-900">{student.ssn || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Curriculum Track</p>
              <p className="text-gray-900">{student.curriculum_track || 'Not specified'}</p>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="text-gray-900">{student.address}</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Transcripts List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <GraduationCap className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Transcripts ({transcripts.length})
                </h2>
              </div>
            </div>
          </div>
          
          {transcripts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transcripts yet</h3>
              <p className="text-gray-600 mb-6">
                Create the first transcript for {student.first_name} {student.last_name}
              </p>
              <Link
                to="/create-transcript"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <FileText className="w-4 h-4 mr-2" />
                Create First Transcript
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transcripts.map((transcript) => (
                <div key={transcript.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <FileText className="w-5 h-5 text-gray-400 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {transcript.name}
                        </h3>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Calendar className="w-4 h-4 mr-1" />
                        Created on {new Date(transcript.created_at).toLocaleDateString()}
                      </div>
                      {transcript.data?.gpa && (
                        <p className="text-sm text-gray-600">
                          Cumulative GPA: {transcript.data.gpa.cumulativeWeightedGPA?.toFixed(3) || '0.000'}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleDownloadPDF(transcript)}
                        className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                      <Link
                        to={`/create-transcript?edit=${transcript.id}`}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                      <button className="inline-flex items-center px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors duration-200">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default StudentTranscriptsPage