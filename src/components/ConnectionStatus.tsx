import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface ConnectionStatusProps {
  onClose: () => void
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onClose }) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking')
  const [details, setDetails] = useState<string>('')

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      console.log('Checking Supabase connection...')
      console.log('VITE_SUPABASE_URL:', supabaseUrl)
      console.log('VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey)

      if (!supabaseUrl || !supabaseAnonKey) {
        setStatus('disconnected')
        setDetails('Environment variables not found. Please connect to Supabase.')
        return
      }

      if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your-anon-key')) {
        setStatus('disconnected')
        setDetails('Environment variables contain placeholder values. Please connect to Supabase.')
        return
      }

      // Test the connection by calling a simple edge function
      const functionUrl = `${supabaseUrl}/functions/v1/admin-login`
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
      })

      if (response.status === 401 || response.status === 400) {
        // These are expected responses for invalid credentials, meaning the connection works
        setStatus('connected')
        setDetails('Supabase is connected and edge functions are working!')
      } else if (response.status === 404) {
        setStatus('error')
        setDetails('Edge function not found. Please deploy the admin-login function.')
      } else {
        setStatus('connected')
        setDetails('Supabase connection successful!')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      setStatus('error')
      setDetails(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      case 'connected':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'disconnected':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'border-blue-200 bg-blue-50'
      case 'connected':
        return 'border-green-200 bg-green-50'
      case 'disconnected':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'checking':
        return 'Checking Connection...'
      case 'connected':
        return 'Supabase Connected'
      case 'disconnected':
        return 'Supabase Not Connected'
      case 'error':
        return 'Connection Error'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
          <div className="flex items-center mb-3">
            {getStatusIcon()}
            <h3 className="ml-3 text-lg font-semibold text-gray-900">
              {getStatusTitle()}
            </h3>
          </div>
          <p className="text-gray-700 text-sm">
            {details}
          </p>
        </div>

        {status !== 'checking' && (
          <div className="mt-6 flex justify-between">
            <button
              onClick={checkConnection}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Test Again
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        )}

        {status === 'disconnected' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>To connect Supabase:</strong><br />
              1. Click the "Connect to Supabase" button in the top right<br />
              2. Follow the setup instructions<br />
              3. Your environment variables will be configured automatically
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConnectionStatus