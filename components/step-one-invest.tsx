"use client"

import { useState } from "react"
import { ArrowUpDown } from "lucide-react"
import {
  FALLBACK_CONFIG,
  calculateInvestment,
  getNextTierInfo,
  alignToSharePrice,
  formatCurrency,
  formatNumber,
  type InvestmentConfig,
} from "@/lib/investment-utils"

interface StepOneInvestProps {
  onContinue: (amount: number) => void
  initialAmount?: number
  config?: InvestmentConfig
}

export function StepOneInvest({ onContinue, initialAmount, config = FALLBACK_CONFIG }: StepOneInvestProps) {
  // `amount` is ALWAYS stored in dollars -- the single source of truth
  const [amount, setAmount] = useState(initialAmount || config.presetAmounts[0])
  const [displayMode, setDisplayMode] = useState<"dollars" | "shares">("dollars")
  // Raw string the user is typing into the main input (only used while focused)
  const [rawInput, setRawInput] = useState("")
  const [isInputFocused, setIsInputFocused] = useState(false)

  const calculation = calculateInvestment(amount, config)
  const isAboveMin = amount >= config.minInvestment
  const isBelowMax = !config.maxInvestment || amount <= config.maxInvestment
  const isValidAmount = isAboveMin && isBelowMax
  const nextTier = getNextTierInfo(amount, config)
  const showUpsell = nextTier && nextTier.amountNeeded <= 2000 && amount < 25000

  // Formatted display value for the main input (when NOT focused)
  const displayValue = (() => {
    if (displayMode === "dollars") {
      return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return `${calculation.baseShares.toLocaleString("en-US")} shares`
  })()

  // Subtitle below the main input
  const subtitleText = (() => {
    if (displayMode === "dollars") {
      return `${formatNumber(calculation.baseShares)} Shares of RAD Intel`
    }
    return formatCurrency(amount, 2)
  })()

  const handleInputFocus = () => {
    setIsInputFocused(true)
    // Pre-fill raw input with the numeric value for the current mode
    if (displayMode === "dollars") {
      setRawInput(amount > 0 ? amount.toString() : "")
    } else {
      setRawInput(calculation.baseShares > 0 ? calculation.baseShares.toString() : "")
    }
  }

  const handleInputBlur = () => {
    setIsInputFocused(false)
    setRawInput("")
  }

  const handleInputChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, "")
    setRawInput(cleanValue)
    const numValue = parseFloat(cleanValue) || 0

    if (displayMode === "dollars") {
      // User is typing a dollar amount -- align to whole shares
      const aligned = numValue > 0 ? alignToSharePrice(numValue, config.sharePrice) : 0
      setAmount(aligned)
    } else {
      // User is typing a share count -- convert to dollars
      const wholeShares = Math.max(0, Math.round(numValue))
      setAmount(parseFloat((wholeShares * config.sharePrice).toFixed(2)))
    }
  }

  const toggleDisplayMode = () => {
    const newMode = displayMode === "dollars" ? "shares" : "dollars"
    setDisplayMode(newMode)
    // Always unfocus and clear raw input so displayValue takes over
    setIsInputFocused(false)
    setRawInput("")
    // Blur the actual input element to prevent stale rawInput
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const handlePresetClick = (presetAmount: number) => {
    setAmount(presetAmount)
    setDisplayMode("dollars")
    // If the input is focused, update rawInput so it reflects the new preset immediately
    if (isInputFocused) {
      setRawInput(presetAmount.toString())
    } else {
      setRawInput("")
    }
  }

  const handleUpsellAccept = () => {
    if (nextTier) {
      setAmount(nextTier.threshold)
    }
  }

  return (
    <div className="step1-page min-h-screen flex items-center justify-center p-4 pb-24 md:pb-4 bg-[#faf9f7]">
      <div className="step1-container w-full max-w-[460px]">
        {/* Progress Indicator - Mobile */}
        <div className="step1-progress mb-4 md:hidden">
          <div className="step1-progress__header flex items-center justify-between text-xs text-[#888] mb-2">
            <span className="step1-progress__step font-medium text-[#c96b4b]">Step 1 of 2</span>
            <span>Investment Amount</span>
          </div>
          <div className="step1-progress__bar h-1 bg-[#e8e4e0] rounded-full">
            <div className="step1-progress__fill h-full bg-[#c96b4b] rounded-full w-1/2" />
          </div>
        </div>

        {/* Main Card */}
        <div className="step1-card bg-white rounded-xl border-2 border-[#c96b4b] p-6 md:p-8">
          <h1 className="step1-title font-serif text-2xl md:text-[1.625rem] font-bold text-center text-[#1a1a1a] mb-6 md:mb-8 leading-tight text-balance">
            How much would you like<br />to invest?
          </h1>

          {/* Main Amount Input */}
          <div className="step1-input-row flex gap-2 mb-1">
            <div className="step1-input-row__field flex-1">
              <input
                type="text"
                inputMode="decimal"
                value={isInputFocused ? rawInput : displayValue}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={displayMode === "dollars" ? "Enter amount" : "Enter shares"}
                className="step1-input w-full px-4 py-3 text-[0.9375rem] border border-[#e0e0e0] rounded-lg bg-white text-[#1a1a1a] focus:outline-none focus:border-[#c96b4b] focus:ring-2 focus:ring-[#c96b4b]/20"
              />
            </div>
            <button
              type="button"
              onClick={toggleDisplayMode}
              className="step1-input-toggle w-12 h-12 flex items-center justify-center bg-[#c96b4b] text-white rounded-lg hover:bg-[#b85d40] transition-colors"
              aria-label={`Switch to ${displayMode === "dollars" ? "shares" : "dollars"} mode`}
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* Subtitle & Constraints */}
          <div className="step1-shares-info mb-5">
            <p className="step1-shares-info__count text-[#777] text-[0.9375rem]">
              {subtitleText}
            </p>
            <p className="step1-shares-info__minimum text-[#999] text-[0.8125rem]">
              Minimum investment {formatCurrency(config.minInvestment, 2)}
              {config.maxInvestment ? ` | Maximum ${formatCurrency(config.maxInvestment, 0)}` : ""}
            </p>
            {amount > 0 && !isAboveMin && (
              <p className="text-red-500 text-[0.8125rem] font-medium mt-1">
                Minimum investment is {formatCurrency(config.minInvestment, 2)}
              </p>
            )}
            {!isBelowMax && config.maxInvestment && (
              <p className="text-red-500 text-[0.8125rem] font-medium mt-1">
                Maximum investment is {formatCurrency(config.maxInvestment, 0)}
              </p>
            )}
            {/* Share alignment notice */}
            {isInputFocused && displayMode === "dollars" && rawInput && parseFloat(rawInput) > 0 && amount !== parseFloat(rawInput) && (
              <p className="text-xs text-[#c96b4b] font-medium mt-1">
                Adjusted to {formatCurrency(amount)} for {formatNumber(calculation.baseShares)} whole shares at {formatCurrency(config.sharePrice)}/share
              </p>
            )}
          </div>

          {/* Upsell Prompt */}
          {showUpsell && nextTier && (
            <div className="step1-upsell bg-[#fff8f5] border border-[#f5ddd5] rounded-lg p-3 mb-4">
              <p className="step1-upsell__text text-[0.8125rem] text-[#994d38] mb-2">
                Add {formatCurrency(nextTier.amountNeeded, 0)} more to unlock{" "}
                <span className="step1-upsell__highlight font-semibold">{nextTier.bonusPercent}% bonus</span>{" "}
                (+{formatNumber(Math.floor((calculation.baseShares + Math.floor(nextTier.amountNeeded / config.sharePrice)) * (nextTier.bonusPercent / 100)))} extra shares)
              </p>
              <button
                type="button"
                onClick={handleUpsellAccept}
                className="step1-upsell__action text-xs font-medium text-[#c96b4b] underline hover:text-[#b85d40]"
              >
                Yes, increase to {formatCurrency(nextTier.threshold, 0)}
              </button>
            </div>
          )}

          {/* Preset Buttons */}
          <div className="step1-presets flex flex-col gap-2.5 mb-5">
            {config.presetAmounts.map((preset) => {
              const presetCalc = calculateInvestment(preset, config)
              const isSelected = Math.abs(amount - preset) < 1
              const hasBonus = presetCalc.bonusPercent > 0

              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`step1-preset w-full py-3 md:py-3.5 px-4 rounded-full text-left transition-colors border-2 ${
                    isSelected
                      ? "step1-preset--selected bg-[#f9ebe6] border-[#c96b4b]"
                      : "step1-preset--unselected bg-[#f8f5f2] border-transparent hover:bg-[#f5f0ec]"
                  }`}
                >
                  <div className="step1-preset__content flex items-center justify-between">
                    {/* Left side: Radio + Amount + Shares */}
                    <div className="step1-preset__left flex items-center gap-2.5">
                      <div className={`step1-radio w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "step1-radio--selected border-[#c96b4b]" : "border-[#ccc]"
                      }`}>
                        {isSelected && <div className="step1-radio__dot w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[#c96b4b]" />}
                      </div>
                      <div>
                        <div className="step1-preset__amount text-[0.9375rem] md:text-[1.0625rem] font-semibold text-[#1a1a1a]">
                          {formatCurrency(preset, 2)}
                        </div>
                        <div className="step1-preset__shares text-[0.6875rem] md:text-xs text-[#888]">
                          {formatNumber(presetCalc.baseShares)} Shares
                        </div>
                      </div>
                    </div>

                    {/* Right side: Bonus pills */}
                    {hasBonus && (
                      <div className="step1-preset__bonus flex items-center gap-1 md:gap-1.5 flex-shrink-0">
                        <span className="step1-bonus-pill step1-bonus-pill--primary text-[0.625rem] md:text-[0.75rem] font-semibold py-1 px-2 md:py-1.5 md:px-3 rounded-full whitespace-nowrap text-center leading-snug bg-[#c96b4b] text-white">
                          +{formatNumber(presetCalc.bonusShares)}<br />
                          <span className="text-[0.5rem] md:text-[0.625rem] font-medium">Bonus Shares</span>
                        </span>
                        <span className="step1-bonus-pill step1-bonus-pill--secondary text-[0.625rem] md:text-[0.75rem] font-semibold py-1 px-2 md:py-1.5 md:px-3 rounded-full whitespace-nowrap text-center leading-snug bg-[#f5ddd5] text-[#994d38]">
                          {presetCalc.bonusPercent}%<br />
                          <span className="text-[0.5rem] md:text-[0.625rem] font-medium">Bonus</span>
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Total Shares */}
          <div className="step1-total flex items-center justify-between py-2 mb-2">
            <span className="step1-total__label text-sm text-[#666]">Total Shares</span>
            <span className="step1-total__value text-xl font-semibold text-[#1a1a1a]">{formatNumber(calculation.totalShares)}</span>
          </div>

          {/* Disclaimer */}
          <p className="step1-disclaimer text-[0.6875rem] text-[#999] mb-4 leading-relaxed">
            All shares assume conversion of convertible notes into stock at ~{formatCurrency(config.sharePrice, 2)}/share. Final share price will be based on a number of factors.
          </p>

          {/* Continue Button - Hidden on mobile, shown in sticky bar */}
          <button
            type="button"
            onClick={() => onContinue(amount)}
            disabled={!isValidAmount}
            className="step1-continue step1-continue--desktop hidden md:block w-full py-3 rounded-lg text-[0.9375rem] font-medium bg-[#c96b4b] text-white hover:bg-[#b85d40] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
        </div>
      </div>

      {/* Sticky Mobile Summary Bar */}
      <div className="step1-mobile-bar fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8e4e0] p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] z-50 md:hidden">
        <div className="step1-mobile-bar__summary flex items-center justify-between mb-2">
          <div className="step1-mobile-bar__text text-xs text-[#666]">
            {calculation.bonusPercent > 0 ? (
              <span>
                Investing {formatCurrency(amount, 2)} &rarr; {calculation.bonusPercent}% bonus &rarr; {formatNumber(calculation.bonusShares)} bonus shares
              </span>
            ) : (
              <span>
                Investing {formatCurrency(amount, 2)} &rarr; {formatNumber(calculation.totalShares)} shares
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onContinue(amount)}
          disabled={!isValidAmount}
          className="step1-mobile-bar__btn w-full py-3 rounded-lg text-sm font-medium bg-[#c96b4b] text-white hover:bg-[#b85d40] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
