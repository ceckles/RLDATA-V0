import { NextResponse } from "next/server"

// Store the last webhook in memory (this will reset on deployment)
let lastWebhook: any = null

export async function GET() {
  return NextResponse.json({
    lastWebhook,
    timestamp: lastWebhook ? new Date().toISOString() : null,
  })
}

export async function POST(request: Request) {
  const payload = await request.text()
  lastWebhook = JSON.parse(payload)
  return NextResponse.json({ stored: true })
}
