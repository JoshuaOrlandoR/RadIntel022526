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

    // DealMaker returns { items: [...] } for collection responses
    const raw = rawInvestors as DealInvestor[] | { items?: DealInvestor[]; data?: DealInvestor[] }
    const investors: DealInvestor[] = Array.isArray(raw) ? raw : (raw.items || raw.data || [])

    // Find an in-progress investor (only states where resumption makes sense)
    const resumableStates = ["invited", "signed", "waiting"]
    const existing = investors.find((inv) =>
      inv.state && resumableStates.includes(inv.state.toLowerCase())
    )

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
