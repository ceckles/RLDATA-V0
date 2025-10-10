import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
const BUCKET_NAME = "bug-reports"

async function ensureBucketExists() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    console.error("[v0] SUPABASE_SERVICE_ROLE_KEY not found")
    throw new Error("Server configuration error: Missing service role key")
  }

  const supabaseAdmin = createServiceClient(supabaseUrl, supabaseServiceKey)

  console.log("[v0] Checking if bucket exists...")

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

  if (listError) {
    console.error("[v0] Error listing buckets:", listError)
    throw new Error(`Failed to list buckets: ${listError.message}`)
  }

  console.log(
    "[v0] Existing buckets:",
    buckets?.map((b) => b.name),
  )

  const bucketExists = buckets?.some((bucket: any) => bucket.name === BUCKET_NAME)

  if (!bucketExists) {
    console.log("[v0] Bucket doesn't exist, creating...")
    // Create bucket if it doesn't exist
    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_IMAGE_TYPES,
    })

    if (createError) {
      console.error("[v0] Error creating bucket:", createError)
      throw new Error(`Failed to create storage bucket: ${createError.message}`)
    }
    console.log("[v0] Successfully created bug-reports storage bucket")
  } else {
    console.log("[v0] Bucket already exists")
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] User authenticated:", user?.id)

    if (authError || !user) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const browserData = formData.get("browserData") as string
    const screenshot = formData.get("screenshot") as File | null

    console.log("[v0] Form data received:", { title, description, hasScreenshot: !!screenshot })

    // Validate required fields
    if (!title || !description || !browserData) {
      return NextResponse.json({ error: "Title, description, and browser data are required" }, { status: 400 })
    }

    let screenshotUrl: string | null = null

    // Handle screenshot upload if provided
    if (screenshot && screenshot.size > 0) {
      console.log("[v0] Processing screenshot:", {
        name: screenshot.name,
        size: screenshot.size,
        type: screenshot.type,
      })

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

      try {
        console.log("[v0] Ensuring bucket exists...")
        await ensureBucketExists()
        console.log("[v0] Bucket ready")
      } catch (bucketError: any) {
        console.error("[v0] Bucket error:", bucketError)
        return NextResponse.json(
          {
            error: "Failed to initialize storage",
            details: bucketError.message,
          },
          { status: 500 },
        )
      }

      const fileExt = screenshot.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      console.log("[v0] Uploading file:", fileName)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, screenshot, {
          contentType: screenshot.type,
          upsert: false,
        })

      if (uploadError) {
        console.error("[v0] Upload error:", uploadError)
        return NextResponse.json(
          {
            error: "Failed to upload screenshot",
            details: uploadError.message,
            hint: "Check if the storage bucket exists and has proper RLS policies",
          },
          { status: 500 },
        )
      }

      console.log("[v0] Upload successful:", uploadData.path)

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path)

      screenshotUrl = publicUrl
      console.log("[v0] Public URL:", publicUrl)
    }

    // Insert bug report
    console.log("[v0] Inserting bug report...")
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
      console.error("[v0] Insert error:", insertError)
      return NextResponse.json({ error: "Failed to submit bug report", details: insertError.message }, { status: 500 })
    }

    console.log("[v0] Bug report created successfully:", bugReport.id)
    return NextResponse.json({ success: true, bugReport }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
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
      console.error("[v0] Auth error:", authError)
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
  } catch (error: any) {
    console.error("[v0] Error in bug reports fetch:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
