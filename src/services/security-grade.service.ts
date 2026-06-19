export const getSecurityGrade = (
  riskScore: number
): string => {
  if (riskScore <= 20) {
    return "A";
  }

  if (riskScore <= 40) {
    return "B";
  }

  if (riskScore <= 60) {
    return "C";
  }

  if (riskScore <= 80) {
    return "D";
  }

  return "F";
};