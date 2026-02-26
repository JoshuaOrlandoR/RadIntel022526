"use client"

import { useState } from "react"
import { ArrowLeft, Check, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import {
  FALLBACK_CONFIG,
  calculateInvestment,
  formatCurrency,
  formatNumber,
  type InvestmentConfig,
} from "@/lib/investment-utils"

interface StepTwoDetailsProps {
  initialAmount: number
  investorId?: number
  investorEmail?: string
  onBack: () => void
  onContinue: (amount: number) => void
  config?: InvestmentConfig
}

type Section = "investment" | "contact" | "confirmation" | "payment"

export function StepTwoDetails({ initialAmount, investorId, investorEmail, onBack, onContinue, config = FALLBACK_CONFIG }: StepTwoDetailsProps) {
  // Guard: if no investorId, redirect back to Step 1
  if (!investorId || !investorEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="text-center p-6">
          <p className="text-[#666] mb-4">Please start from the beginning.</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-[#c96b4b] text-white rounded-lg font-medium hover:bg-[#b85d40] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const [amount, setAmount] = useState(initialAmount)
  const [shares, setShares] = useState(() => {
    const calc = calculateInvestment(initialAmount, config)
    return calc.baseShares
  })
  const [expandedSection, setExpandedSection] = useState<Section>("investment")
  const [completedSections, setCompletedSections] = useState<Section[]>([])

  // Contact form state
  const [investorType, setInvestorType] = useState("individual")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState(investorEmail || "")
  // Type-specific fields
  const [jointFirstName, setJointFirstName] = useState("")
  const [jointLastName, setJointLastName] = useState("")
  const [corporationName, setCorporationName] = useState("")
  const [trustName, setTrustName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [contactErrors, setContactErrors] = useState<{ firstName?: string; lastName?: string; email?: string }>({})
  const [contactTouched, setContactTouched] = useState<{ firstName?: boolean; lastName?: boolean; email?: boolean }>({})

  const calculation = calculateInvestment(amount, config)



  const validateContact = (): boolean => {
    const errors: typeof contactErrors = {}
    if (!firstName.trim()) errors.firstName = "First name is required"
    if (!lastName.trim()) errors.lastName = "Last name is required"
    // Email is pre-filled from Step 1, no need to validate
    setContactErrors(errors)
    setContactTouched({ firstName: true, lastName: true })
    return Object.keys(errors).length === 0
  }

  const isContactComplete = (() => {
    // Email is pre-filled from Step 1, just need name fields
    const baseComplete = firstName.trim() !== "" && lastName.trim() !== ""
    if (!baseComplete) return false
    switch (investorType) {
      case "joint": return jointFirstName.trim() !== "" && jointLastName.trim() !== ""
      case "corporation": return corporationName.trim() !== ""
      case "trust": return trustName.trim() !== ""
      default: return true
    }
  })()

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value.replace(/[,$]/g, "")) || 0
    setAmount(numValue)
    const calc = calculateInvestment(numValue, config)
    setShares(calc.baseShares)
  }

  const handleSharesChange = (value: string) => {
    const numValue = parseInt(value.replace(/,/g, "")) || 0
    setShares(numValue)
    const newAmount = numValue * config.sharePrice
    setAmount(newAmount)
  }

  const handleSectionContinue = (currentSection: Section) => {
    if (!completedSections.includes(currentSection)) {
      setCompletedSections([...completedSections, currentSection])
    }
    
    const currentIndex = sectionOrder.indexOf(currentSection)
    if (currentIndex < sectionOrder.length - 1) {
      setExpandedSection(sectionOrder[currentIndex + 1])
    }
  }

  const sectionOrder: Section[] = ["investment", "contact", "confirmation", "payment"]

  const isSectionAccessible = (section: Section): boolean => {
    // A section is accessible if it's completed, or if all prior sections are completed
    if (completedSections.includes(section)) return true
    const idx = sectionOrder.indexOf(section)
    const priorSections = sectionOrder.slice(0, idx)
    return priorSections.every((s) => completedSections.includes(s))
  }

  const toggleSection = (section: Section) => {
    if (isSectionAccessible(section)) {
      setExpandedSection(section)
    }
  }

  const isSectionComplete = (section: Section) => completedSections.includes(section)

  return (
    <div className="step2-page min-h-screen flex items-start justify-center px-3 py-4 md:p-4 md:pt-8 md:pb-8 bg-[#f9fafb]">
      <div className="step2-container w-full max-w-xl">
        {/* Back Button & Progress */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-[#c96b4b] font-medium hover:text-[#b85d40] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Deal
          </button>
          <span className="text-xs text-[#888] font-medium">Step 2 of 2</span>
        </div>
        {/* Main Card */}
        <div className="step2-card bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border-2 border-[#c96b4b]">
          
          {/* Section 1: Investment Amount */}
          <div className="step2-section step2-section--investment border-b border-[#f3f4f6]">
            <button
              type="button"
              onClick={() => toggleSection("investment")}
              className="step2-section__header w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-transparent border-none cursor-pointer"
            >
              <div className="step2-section__title-group flex items-center gap-2 md:gap-3">
                {isSectionComplete("investment") ? (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#c96b4b] text-white text-xs font-bold">1</span>
                )}
                <span className="step2-section__title text-base md:text-lg font-semibold text-[#1a1a1a]">Investment Amount</span>
              </div>
              {expandedSection === "investment" ? (
                <ChevronUp className="step2-section__chevron w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="step2-section__chevron w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === "investment" && (
              <div className="step2-section__content px-4 md:px-6 pb-4 md:pb-6">
                {/* Share Price Info */}
                <div className="step2-share-price flex items-center gap-2 mb-2">
                  <RefreshCw className="step2-share-price__icon w-4 h-4 text-gray-400" />
                  <span className="step2-share-price__text text-gray-700">
                    1 {config.securityType || "Common Stock"} = <span className="step2-share-price__value font-semibold">${config.sharePrice.toFixed(2)} USD</span>
                  </span>
                </div>
                
                <p className="step2-share-price__note text-sm text-gray-500 mb-4">
                  Investment amount will be rounded up if required
                </p>

                {/* Amount Input */}
                <input
                  type="text"
                  value={`$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="step2-input step2-input--amount w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-lg mb-3 focus:outline-none focus:border-[#c96b4b] focus:ring-[3px] focus:ring-[#c96b4b]/15 transition-all"
                />

                {/* Shares Input */}
                <input
                  type="text"
                  value={formatNumber(shares)}
                  onChange={(e) => handleSharesChange(e.target.value)}
                  className="step2-input step2-input--shares w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 text-lg mb-3 focus:outline-none focus:border-[#c96b4b] focus:ring-[3px] focus:ring-[#c96b4b]/15 transition-all"
                />

                {/* Bonus Info */}
                {calculation.bonusPercent > 0 && (
                  <div className="step2-bonus-info bg-[#fff5f2] border border-[#f5c4b8] rounded-lg p-3 mb-4">
                    <p className="step2-bonus-info__text text-sm text-[#c96b4b]">
                      You qualify for <span className="step2-bonus-info__highlight font-semibold">{calculation.bonusPercent}% bonus</span> = +{formatNumber(calculation.bonusShares)} free shares!
                    </p>
                  </div>
                )}

                {/* Validation Messages */}
                {amount > 0 && amount < config.minInvestment && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-red-600 font-medium">
                      Minimum investment amount is {formatCurrency(config.minInvestment, 2)}
                    </p>
                  </div>
                )}
                {config.maxInvestment && amount > config.maxInvestment && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-red-600 font-medium">
                      Maximum investment amount is {formatCurrency(config.maxInvestment, 0)}
                    </p>
                  </div>
                )}

                {/* Continue Button */}
                <button
                  type="button"
                  disabled={amount < config.minInvestment || (!!config.maxInvestment && amount > config.maxInvestment)}
                  onClick={() => handleSectionContinue("investment")}
                  className="step2-btn step2-btn--continue w-full py-3.5 rounded-lg text-lg font-semibold bg-[#c96b4b] text-white hover:bg-[#b85d40] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Contact Information */}
          <div className="step2-section step2-section--contact border-b border-[#f3f4f6]">
            <button
              type="button"
              onClick={() => toggleSection("contact")}
              disabled={!isSectionAccessible("contact")}
              className={`step2-section__header w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-transparent border-none ${isSectionAccessible("contact") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
            >
              <div className="step2-section__title-group flex items-center gap-2 md:gap-3">
                {isSectionComplete("contact") ? (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isSectionAccessible("contact") ? "bg-[#c96b4b] text-white" : "bg-gray-200 text-gray-400"}`}>2</span>
                )}
                <span className="step2-section__title text-base md:text-lg font-semibold text-[#1a1a1a]">Contact Information</span>
              </div>
              {expandedSection === "contact" ? (
                <ChevronUp className="step2-section__chevron w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="step2-section__chevron w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === "contact" && (
              <div className="step2-section__content px-4 md:px-6 pb-4 md:pb-6">
                {/* Investor Type */}
                <div className="mb-4">
                  <label htmlFor="investor-type" className="text-sm text-gray-500 mb-1.5 block">I am investing as:</label>
                  <select
                    id="investor-type"
                    value={investorType}
                    onChange={(e) => {
                      setInvestorType(e.target.value)
                      // Clear all fields when type changes so user re-enters with correct context
                      setFirstName("")
                      setLastName("")
                      setJointFirstName("")
                      setJointLastName("")
                      setCorporationName("")
                      setTrustName("")
                      setContactErrors({})
                      setContactTouched({})
                    }}
                    aria-label="Investor Type"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[#1a1a1a] text-sm bg-white focus:outline-none focus:border-[#c96b4b] focus:ring-2 focus:ring-[#c96b4b]/15"
                  >
                    <option value="individual">Individual</option>
                    <option value="joint">Joint</option>
                    <option value="corporation">Corporation</option>
                    <option value="trust">Trust</option>
                  </select>
                  {investorType !== "individual" && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      Additional details for this investor type will be collected on the next step.
                    </p>
                  )}
                </div>

                <div className="step2-contact-fields space-y-3 md:space-y-4 mb-6">
                  <div>
                    <div className="step2-contact-field py-2 border-b border-[#f3f4f6]">
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value)
                          if (contactTouched.firstName) {
                            setContactErrors((prev) => ({ ...prev, firstName: e.target.value.trim() ? undefined : "First name is required" }))
                          }
                        }}
                        onBlur={() => {
                          setContactTouched((prev) => ({ ...prev, firstName: true }))
                          if (!firstName.trim()) setContactErrors((prev) => ({ ...prev, firstName: "First name is required" }))
                        }}
                        placeholder={investorType === "corporation" ? "Signing Officer First Name *" : investorType === "trust" ? "Trustee First Name *" : "First Name *"}
                        className="step2-contact-field__input text-left bg-transparent border-none text-[#1a1a1a] text-base focus:outline-none w-full placeholder:text-gray-400"
                      />
                    </div>
                    {contactTouched.firstName && contactErrors.firstName && (
                      <p className="text-xs text-red-500 mt-1">{contactErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <div className="step2-contact-field py-2 border-b border-[#f3f4f6]">
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value)
                          if (contactTouched.lastName) {
                            setContactErrors((prev) => ({ ...prev, lastName: e.target.value.trim() ? undefined : "Last name is required" }))
                          }
                        }}
                        onBlur={() => {
                          setContactTouched((prev) => ({ ...prev, lastName: true }))
                          if (!lastName.trim()) setContactErrors((prev) => ({ ...prev, lastName: "Last name is required" }))
                        }}
                        placeholder={investorType === "corporation" ? "Signing Officer Last Name *" : investorType === "trust" ? "Trustee Last Name *" : "Last Name *"}
                        className="step2-contact-field__input text-left bg-transparent border-none text-[#1a1a1a] text-base focus:outline-none w-full placeholder:text-gray-400"
                      />
                    </div>
                    {contactTouched.lastName && contactErrors.lastName && (
                      <p className="text-xs text-red-500 mt-1">{contactErrors.lastName}</p>
                    )}
                  </div>
                  <div>
                    <div className="step2-contact-field py-2 border-b border-[#f3f4f6]">
                      <input
                        type="email"
                        value={email}
                        readOnly
                        placeholder="Email *"
                        className="step2-contact-field__input text-left bg-transparent border-none text-[#1a1a1a] text-base focus:outline-none w-full placeholder:text-gray-400 cursor-not-allowed opacity-75"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Email was provided in the previous step</p>
                  </div>

                  {/* Joint: joint holder name fields */}
                  {investorType === "joint" && (
                    <>
                      <div className="pt-2">
                        <p className="text-xs text-gray-400 mb-2">Joint Holder Information</p>
                      </div>
                      <div>
                        <div className="step2-contact-field py-2 border-b border-[#f3f4f6]">
                          <input
                            type="text"
                            value={jointFirstName}
                            onChange={(e) => setJointFirstName(e.target.value)}
                            placeholder="Joint Holder First Name *"
                            className="step2-contact-field__input text-left bg-transparent border-none text-[#1a1a1a] text-base focus:outline-none w-full placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="step2-contact-field py-2 border-b border-[#f3f4f6]">
                          <input
                            type="text"
                            value={jointLastName}
                            onChange={(e) => setJointLastName(e.target.value)}
                            placeholder="Joint Holder Last Name *"
                            className="step2-contact-field__input text-left bg-transparent border-none text-[#1a1a1a] text-base focus:outline-none w-full placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Corporation: corporation name */}
                  {investorType === "corporation" && (
                    <div>
                      <div className="step2-contact-field py-2 border-b border-[#f3f4f6]">
                        <input
                          type="text"
                          value={corporationName}
                          onChange={(e) => setCorporationName(e.target.value)}
                          placeholder="Corporation Name *"
                          className="step2-contact-field__input text-left bg-transparent border-none text-[#1a1a1a] text-base focus:outline-none w-full placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Trust: trust name */}
                  {investorType === "trust" && (
                    <div>
                      <div className="step2-contact-field py-2 border-b border-[#f3f4f6]">
                        <input
                          type="text"
                          value={trustName}
                          onChange={(e) => setTrustName(e.target.value)}
                          placeholder="Trust Name *"
                          className="step2-contact-field__input text-left bg-transparent border-none text-[#1a1a1a] text-base focus:outline-none w-full placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!isContactComplete}
                  onClick={() => {
                    if (validateContact()) {
                      handleSectionContinue("contact")
                    }
                  }}
                  className="step2-btn step2-btn--continue w-full py-3.5 rounded-lg text-lg font-semibold bg-[#c96b4b] text-white hover:bg-[#b85d40] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
            
            {/* Show summary when collapsed but completed */}
            {expandedSection !== "contact" && isSectionComplete("contact") && (
              <div className="step2-contact-summary px-4 md:px-6 pb-4">
                <div className="step2-contact-summary__rows space-y-1">
                  <div className="step2-contact-summary__row flex justify-between text-sm">
                    <span className="step2-contact-summary__label text-gray-500">Type</span>
                    <span className="step2-contact-summary__value text-[#1a1a1a] capitalize">{investorType}</span>
                  </div>
                  <div className="step2-contact-summary__row flex justify-between text-sm">
                    <span className="step2-contact-summary__label text-gray-500">
                      {investorType === "corporation" ? "Signing Officer" : investorType === "trust" ? "Trustee" : "Name"}
                    </span>
                    <span className="step2-contact-summary__value text-[#1a1a1a]">{firstName && lastName ? `${firstName} ${lastName}` : "—"}</span>
                  </div>
                  <div className="step2-contact-summary__row flex justify-between text-sm">
                    <span className="step2-contact-summary__label text-gray-500">Email</span>
                    <span className="step2-contact-summary__value text-[#1a1a1a]">{email || "—"}</span>
                  </div>
                  {investorType === "joint" && (
                    <div className="step2-contact-summary__row flex justify-between text-sm">
                      <span className="step2-contact-summary__label text-gray-500">Joint Holder</span>
                      <span className="step2-contact-summary__value text-[#1a1a1a]">{jointFirstName && jointLastName ? `${jointFirstName} ${jointLastName}` : "—"}</span>
                    </div>
                  )}
                  {investorType === "corporation" && (
                    <div className="step2-contact-summary__row flex justify-between text-sm">
                      <span className="step2-contact-summary__label text-gray-500">Corporation</span>
                      <span className="step2-contact-summary__value text-[#1a1a1a]">{corporationName || "—"}</span>
                    </div>
                  )}
                  {investorType === "trust" && (
                    <div className="step2-contact-summary__row flex justify-between text-sm">
                      <span className="step2-contact-summary__label text-gray-500">Trust</span>
                      <span className="step2-contact-summary__value text-[#1a1a1a]">{trustName || "—"}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Investor Confirmation */}
          <div className="step2-section step2-section--confirmation border-b border-[#f3f4f6]">
            <button
              type="button"
              onClick={() => toggleSection("confirmation")}
              disabled={!isSectionAccessible("confirmation")}
              className={`step2-section__header w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-transparent border-none ${isSectionAccessible("confirmation") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
            >
              <div className="step2-section__title-group flex items-center gap-2 md:gap-3">
                {isSectionComplete("confirmation") ? (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isSectionAccessible("confirmation") ? "bg-[#c96b4b] text-white" : "bg-gray-200 text-gray-400"}`}>3</span>
                )}
                <span className="step2-section__title text-base md:text-lg font-semibold text-[#1a1a1a]">Investor Confirmation</span>
              </div>
              {expandedSection === "confirmation" ? (
                <ChevronUp className="step2-section__chevron w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="step2-section__chevron w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === "confirmation" && (
              <div className="step2-section__content px-4 md:px-6 pb-4 md:pb-6">
                <p className="step2-confirmation__text text-sm text-gray-500 mb-4">
                  By continuing, I confirm that I have reviewed the offering materials and understand
                  the risks associated with this investment.
                </p>
                
                <button
                  type="button"
                  onClick={() => handleSectionContinue("confirmation")}
                  className="step2-btn step2-btn--continue w-full py-3.5 rounded-lg text-lg font-semibold bg-[#c96b4b] text-white hover:bg-[#b85d40] transition-colors"
                >
                  I Confirm & Continue
                </button>
              </div>
            )}
          </div>

          {/* Section 4: Payment */}
          <div className="step2-section step2-section--payment">
            <button
              type="button"
              onClick={() => toggleSection("payment")}
              disabled={!isSectionAccessible("payment")}
              className={`step2-section__header w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-transparent border-none ${isSectionAccessible("payment") ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
            >
              <div className="step2-section__title-group flex items-center gap-2 md:gap-3">
                {isSectionComplete("payment") ? (
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isSectionAccessible("payment") ? "bg-[#c96b4b] text-white" : "bg-gray-200 text-gray-400"}`}>4</span>
                )}
                <span className="step2-section__title text-base md:text-lg font-semibold text-[#1a1a1a]">Payment</span>
              </div>
              {expandedSection === "payment" ? (
                <ChevronUp className="step2-section__chevron w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="step2-section__chevron w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === "payment" && (
              <div className="step2-section__content px-4 md:px-6 pb-4 md:pb-6">
                <p className="step2-payment__text text-sm text-gray-500 mb-4">
                  {"You'll be redirected to complete your investment details and payment on our secure checkout."}
                </p>
                
                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-600">{submitError}</p>
                  </div>
                )}

                {submitSuccess ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-lg font-semibold text-green-700">Investment Submitted</p>
                    <p className="text-sm text-green-600 mt-1">Your investment of {formatCurrency(amount)} has been successfully recorded. You will receive an email with payment instructions shortly.</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={async () => {
                      setSubmitError("")
                      setIsSubmitting(true)
                      try {
                        const res = await fetch("/api/investor/complete", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            investorId,
                            email,
                            firstName,
                            lastName,
                            investorType,
                            ...(investorType === "joint" && { jointFirstName, jointLastName }),
                            ...(investorType === "corporation" && { corporationName }),
                            ...(investorType === "trust" && { trustName }),
                          }),
                        })
                        const data = await res.json()
                        if (!res.ok) {
                          setSubmitError(data.error || "Failed to complete investment. Please try again.")
                        } else {
                          if (data.paymentUrl) {
                            // Redirect to DealMaker's hosted payment page
                            window.location.href = data.paymentUrl
                          } else {
                            // Payment URL not available, show success with note
                            setSubmitSuccess(true)
                            onContinue(amount)
                          }
                        }
                      } catch {
                        setSubmitError("Network error. Please check your connection and try again.")
                      } finally {
                        setIsSubmitting(false)
                      }
                    }}
                    className="step2-btn step2-btn--complete w-full py-3.5 rounded-lg text-lg font-semibold bg-[#c96b4b] text-white hover:bg-[#b85d40] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Processing..." : "Continue to Checkout"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Links -- Client to provide document URLs
        <div className="step2-footer text-center mt-4 md:mt-6">
          <div className="step2-footer__links flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 text-sm">
            <a href="CONTRACT_URL" target="_blank" rel="noopener noreferrer" className="step2-footer__link text-[#c96b4b] hover:underline">Download Contract</a>
            <span className="step2-footer__separator text-gray-300 hidden md:inline">&bull;</span>
            <a href="CIRCULAR_URL" target="_blank" rel="noopener noreferrer" className="step2-footer__link text-[#c96b4b] hover:underline">Download Offering Circular</a>
            <span className="step2-footer__separator text-gray-300 hidden md:inline">&bull;</span>
            <a href="DOCS_URL" target="_blank" rel="noopener noreferrer" className="step2-footer__link text-[#c96b4b] hover:underline">Additional documents</a>
          </div>
        </div>
        */}
      </div>
    </div>
  )
}
