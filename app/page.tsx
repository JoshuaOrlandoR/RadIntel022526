"use client"

import { useState, useEffect } from "react"
import { StepOneInvest } from "@/components/step-one-invest"
import { StepTwoDetails } from "@/components/step-two-details"
import { FALLBACK_CONFIG, type InvestmentConfig } from "@/lib/investment-utils"

interface InvestorData {
  investorId: number
  email: string
}

export default function InvestmentPage() {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<InvestmentConfig>(FALLBACK_CONFIG)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState(FALLBACK_CONFIG.presetAmounts[0])
  const [investorData, setInvestorData] = useState<InvestorData | null>(null)

  useEffect(() => {
    fetch("/api/deal")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setConfig(data.config)
          setSelectedAmount(data.config.presetAmounts[0])
        }
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true))
  }, [])

  const handleContinueFromStepOne = (amount: number, investor: InvestorData) => {
    setSelectedAmount(amount)
    setInvestorData(investor)
    setStep(2)
  }

  const handleBackToStepOne = () => {
    setStep(1)
  }

  const handleContinueToPayment = (amount: number) => {
    // Payment flow handled in StepTwoDetails
  }

  if (!configLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#c96b4b] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#888]">Loading deal information...</p>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <StepOneInvest
        initialAmount={selectedAmount}
        onContinue={handleContinueFromStepOne}
        config={config}
      />
    )
  }

  return (
    <StepTwoDetails
      initialAmount={selectedAmount}
      investorId={investorData?.investorId}
      investorEmail={investorData?.email}
      onBack={handleBackToStepOne}
      onContinue={handleContinueToPayment}
      config={config}
    />
  )
}
