export function evaluateAudioRigSynergy(iem, source, cable, useCaseProfile, discountPct = 5) {
  let score = 100;
  const warnings = [];

  // 1. Socket Compatibility (IEM <-> Cable: 2-Pin vs MMCX)
  if (cable && cable.connectorType !== "N/A" && iem.connectorType !== cable.connectorType) {
    score -= 40;
    warnings.push(
      `Socket mismatch: ${iem.title} uses ${iem.connectorType}, but ${cable.title} uses ${cable.connectorType}.`
    );
  }

  // 2. Output Jack Compatibility (Cable <-> DAC/DAP: 4.4mm vs 3.5mm-Only)
  if (cable && cable.outputPort === "4.4mm" && source.outputPort === "3.5mm-Only") {
    score -= 35;
    warnings.push(
      `Jack mismatch: 4.4mm Balanced cable cannot plug into ${source.title} (3.5mm-Only output).`
    );
  }

  // 3. Power Headroom Check (High-Power / Planar IEM <-> Source)
  if (iem.powerLevel === "high" && source.powerLevel !== "high") {
    score -= 20;
    warnings.push(
      `Underpowered pairing: ${iem.title} needs a High-Power DAC/DAP for full bass & dynamic headroom.`
    );
  }

  // 4. Use-Case Fit Check
  if (useCaseProfile === "stage_monitoring" && !cable) {
    score -= 5;
    warnings.push("Recommendation: Include a braided upgrade cable for stage durability.");
  }

  // 5. Bundle Margin Protection (Retail vs Unit Cost after Discount)
  const items = [iem, source, cable].filter(Boolean);
  const grossRetail = items.reduce((sum, item) => sum + Number(item.retailPrice), 0);
  const totalCost = items.reduce((sum, item) => sum + Number(item.unitCost), 0);
  const discountedPrice = grossRetail * (1 - Number(discountPct) / 100);
  const netProfit = discountedPrice - totalCost;
  const netMarginPct = discountedPrice > 0 ? (netProfit / discountedPrice) * 100 : 0;

  if (netMarginPct < 15) {
    score -= 25;
    warnings.push(
      `Critical margin erosion: ${discountPct}% discount drops net margin to ${netMarginPct.toFixed(1)}% (below 15% floor).`
    );
  } else if (netMarginPct < 25) {
    score -= 10;
    warnings.push(
      `Low margin alert: Net margin is ${netMarginPct.toFixed(1)}% (recommended minimum is 25%).`
    );
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  const grade = finalScore >= 85 ? "A (Reference)" : finalScore >= 72 ? "B (Verified)" : "C (Needs Fix)";

  return {
    synergyScore: finalScore,
    grade,
    status: finalScore >= 72 ? "ACTIVE" : "DRAFT",
    grossRetail: Number(grossRetail.toFixed(2)),
    discountedPrice: Number(discountedPrice.toFixed(2)),
    netMarginPct: Number(netMarginPct.toFixed(1)),
    warnings,
  };
}