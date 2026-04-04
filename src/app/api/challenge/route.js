import { NextResponse } from 'next/server'
import { createChallenge } from '@/lib/challenge'

export async function GET() {
  const challenge = createChallenge()
  return NextResponse.json(challenge)
}
