import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, Users, Shield, ArrowRight } from 'lucide-react'

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-8">
            Transcript Generator
          </h1>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <p className="text-xl text-gray-700 mb-6 leading-relaxed">
              Welcome to the Transcript Generator - a powerful administrative tool designed to 
              streamline the creation and management of academic transcripts. This secure platform 
              provides authorized administrators with comprehensive tools to generate, customize, 
              and manage student transcripts efficiently.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col items-center p-4">
                <FileText className="w-12 h-12 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Generate Transcripts</h3>
                <p className="text-gray-600 text-sm">Create professional academic transcripts with customizable templates</p>
              </div>
              
              <div className="flex flex-col items-center p-4">
                <Users className="w-12 h-12 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Manage Students</h3>
                <p className="text-gray-600 text-sm">Organize student records and academic information</p>
              </div>
              
              <div className="flex flex-col items-center p-4">
                <Shield className="w-12 h-12 text-purple-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Secure Access</h3>
                <p className="text-gray-600 text-sm">Protected admin-only access with secure authentication</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Use</h2>
            <div className="text-left max-w-2xl mx-auto space-y-3">
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</span>
                <p className="text-gray-700">Click the "Log In" button below to access the admin dashboard</p>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</span>
                <p className="text-gray-700">Enter your administrator credentials to authenticate</p>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</span>
                <p className="text-gray-700">Access the dashboard to manage transcripts and student records</p>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">4</span>
                <p className="text-gray-700">Generate professional transcripts using our intuitive tools</p>
              </div>
            </div>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Log In to Admin Dashboard
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HomePage