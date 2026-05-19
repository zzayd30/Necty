'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function ConfirmPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('Verifying your email and setting up your secure session...')

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function handleHashAuth() {
      try {
        // 1. Get hash fragment from window location
        const hash = window.location.hash
        if (!hash) {
          // If no hash, check if there is already an active session
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            if (active) {
              setStatus('success')
              setMessage('Session active! Redirecting to onboarding...')
              router.push('/onboarding')
              router.refresh()
            }
            return
          }
          throw new Error('No authentication tokens found in the verification link.')
        }

        // 2. Parse access_token and refresh_token
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const errorDescription = params.get('error_description')

        if (errorDescription) {
          throw new Error(errorDescription.replace(/\+/g, ' '))
        }

        if (!accessToken || !refreshToken) {
          throw new Error('Invalid or incomplete verification link.')
        }

        // 3. Set session manually
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) throw error

        if (data.session) {
          if (active) {
            setStatus('success')
            setMessage('Email verified successfully! Redirecting to onboarding...')
            toast.success('Email verified successfully!')
            setTimeout(() => {
              router.push('/onboarding')
              router.refresh()
            }, 1500)
          }
        } else {
          throw new Error('Failed to establish session.')
        }
      } catch (err: any) {
        if (active) {
          setStatus('error')
          setMessage(err.message ?? 'Verification failed or expired.')
          toast.error(err.message ?? 'Verification failed.')
          setTimeout(() => {
            router.push('/login')
          }, 4000)
        }
      }
    }

    handleHashAuth()

    return () => {
      active = false
    }
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <h2 className="text-xl font-semibold text-slate-800">Verifying Email</h2>
            <p className="text-sm text-slate-600">{message}</p>
          </div>
        )}
        {status === 'success' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Success!</h2>
            <p className="text-sm text-slate-600">{message}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Verification Failed</h2>
            <p className="text-sm text-red-600">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
