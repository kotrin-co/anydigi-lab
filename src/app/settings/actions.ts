'use server'

import { auth } from '@/lib/auth'
import { signToken } from '@/lib/jwt'

export async function generateMcpToken(formData: FormData) {
  const session = await auth()

  if (!session?.user?.email) throw new Error('Unauthorized')

  const days = parseInt(formData.get('days') as string) || 7
  const token = await signToken(session.user.email, days)

  return { token, expiresInDays: days }
}