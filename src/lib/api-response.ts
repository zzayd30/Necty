import { NextResponse } from 'next/server'

export type ApiResponse<T = undefined> = {
  success: boolean
  status: number
  message: string
  data?: T
}

type ApiResponseOptions<T> = {
  success: boolean
  status: number
  message: string
  data?: T
}

function buildApiResponse<T>({ success, status, message, data }: ApiResponseOptions<T>) {
  const response: ApiResponse<T> = {
    success,
    status,
    message,
  }

  if (data !== undefined) {
    response.data = data
  }

  return response
}

export function apiSuccess<T>(data: T, message: string, status = 200) {
  return NextResponse.json(buildApiResponse({ success: true, status, message, data }), {
    status,
  })
}

export function apiSuccessNoData(message: string, status = 200) {
  return NextResponse.json(buildApiResponse({ success: true, status, message }), {
    status,
  })
}

export function apiError(message: string, status = 500) {
  return NextResponse.json(buildApiResponse({ success: false, status, message }), {
    status,
  })
}