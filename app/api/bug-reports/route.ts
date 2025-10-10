import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const browserData = formData.get("browserData") as string
    const screenshot = formData.get("screenshot") as File | null

    // Validate required fields
    if (!title || !description || !browserData) {
      return NextResponse.json({ error: "Title, description, and browser data are required" }, { status: 400 })
    }

    let screenshotUrl: string | null = null

    // Handle screenshot upload if provided
    if (screenshot && screenshot.size > 0) {
      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(screenshot.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed." },
          { status: 400 },
        )
      }

      // Validate file size
      if (screenshot.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 })
      }

      const fileExt = screenshot.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("bug-reports")
        .upload(fileName, screenshot, {
          contentType: screenshot.type,
          upsert: false,
        })

      if (uploadError) {
        console.error("[v0] Error uploading screenshot:", uploadError)
        return NextResponse.json({ error: "Failed to upload screenshot" }, { status: 500 })
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("bug-reports").getPublicUrl(uploadData.path)

      screenshotUrl = publicUrl
    }

    // Insert bug report
    const { data: bugReport, error: insertError } = await supabase
      .from("bug_reports")
      .insert({
        user_id: user.id,
        title,
        description,
        screenshot_url: screenshotUrl,
        browser_data: JSON.parse(browserData),
        status: "submitted",
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error inserting bug report:", insertError)
      return NextResponse.json({ error: "Failed to submit bug report" }, { status: 500 })
    }

    return NextResponse.json({ success: true, bugReport }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in bug report submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRoles } = await supabase.from("user_roles").select("roles(name)").eq("user_id", user.id)

    const isAdmin = userRoles?.some((ur: any) => ur.roles?.name === "admin")

    let query = supabase
      .from("bug_reports")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    // Non-admins can only see their own reports
    if (!isAdmin) {
      query = query.eq("user_id", user.id)
    }

    const { data: bugReports, error } = await query

    if (error) {
      console.error("[v0] Error fetching bug reports:", error)
      return NextResponse.json({ error: "Failed to fetch bug reports" }, { status: 500 })
    }

    return NextResponse.json({ bugReports }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in bug reports fetch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
