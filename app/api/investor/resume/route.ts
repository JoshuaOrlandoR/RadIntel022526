import { NextResponse } from "next/server"
import {
  searchDealInvestors,
  getInvestorAccessLink,
  isDealmakerConfigured,
  type DealInvestor,
} from "@/lib/dealmaker"

export async function POST(request: Request) {
  if (!isDealmakerConfigured()) {
    return NextResponse.json(
      { error: "DealMaker is not configured." },
      { status: 503 }
    )
  }

  const dealId = process.env.DEALMAKER_DEAL_ID!
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 }
    )
  }

  try {
    const rawInvestors = await searchDealInvestors(dealId, email)
    console.log("[v0] Raw investor search response:", JSON.stringify(rawInvestors, null, 2))

    // DealMaker may return paginated { data: [...] } or a bare array
    const raw = rawInvestors as DealInvestor[] | { data: DealInvestor[] }
    const investors: DealInvestor[] = Array.isArray(raw) ? raw : (raw.data || [])
    console.log("[v0] Parsed investors array:", JSON.stringify(investors, null, 2))
    console.log("[v0] Investor states found:", investors.map((inv) => inv.state))

    // Find the most recent in-progress investor
    const resumableStates = ["invited", "signed", "waiting", "accepted", "draft", "active", "pending"]
    const existing = investors.find((inv) =>
      inv.state && resumableStates.includes(inv.state.toLowerCase())
    )
    console.log("[v0] Matching investor:", existing ? JSON.stringify(existing) : "none found")

    if (!existing) {
      return NextResponse.json({ found: false })
    }

    // Get the access link for the existing investor
    let accessLink: string | null = null
    try {
      const link = await getInvestorAccessLink(dealId, existing.id)
      accessLink = link.access_link || null
    } catch {
      // If we can't get the access link, still report the investor was found
    }

    return NextResponse.json({
      found: true,
      investorId: existing.id,
      state: existing.state,
      accessLink,
    })
  } catch (error) {
    console.error("Failed to search investors:", error)
    return NextResponse.json(
      { error: "Unable to look up your investment. Please try again." },
      { status: 500 }
    )
  }
}
