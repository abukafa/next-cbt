/**
 * Linear Interpolation Grading (Konversi Nilai)
 *
 * Formula: Konversi = KKM + ((N_asli - N_min) / (N_max - N_min)) * (MaxTarget - KKM)
 *
 * @param {number} score - The student's actual score (N_asli)
 * @param {number} minScore - The lowest score among all participants (N_min)
 * @param {number} maxScore - The highest score among all participants (N_max)
 * @param {number} kkm - The configured minimum competency criterion (e.g. 75)
 * @param {number} maxTarget - The maximum target score (default 100)
 * @returns {number} The interpolated score, constrained between KKM and maxTarget.
 */
export function calculateInterpolatedScore(
  score,
  minScore,
  maxScore,
  kkm = 75,
  maxTarget = 100,
) {
  // Convert arguments to floats to prevent string manipulation bugs
  const N_asli = parseFloat(score);
  const N_min = parseFloat(minScore);
  const N_max = parseFloat(maxScore);
  const KKM = parseFloat(kkm);
  const Max = parseFloat(maxTarget);

  // If everyone got the exact same score, variance is 0.
  if (N_max === N_min) {
    // If their actual score is already higher than KKM, they keep their actual score
    // Otherwise, they get the KKM.
    return Math.max(N_asli, KKM);
  }

  // Linear Interpolation
  const konversi = KKM + ((N_asli - N_min) / (N_max - N_min)) * (Max - KKM);

  // Clamp the results between KKM and Max just in case (though math should guarantee it)
  if (konversi < KKM) return KKM;
  if (konversi > Max) return Max;

  return konversi;
}
