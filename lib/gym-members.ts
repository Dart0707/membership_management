export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  registrationDate: string;
  expiryDate: string;
  checkIns: number;
};

export type MemberFormData = Pick<Member, "name" | "email" | "phone" | "plan">;
export type ScanResult = Member & { isJustCheckedIn: boolean };
export type ScanMessage =
  | { type: "SUCCESS" | "EXPIRED" | "ERROR"; text: string }
  | null;

export const DEFAULT_REFERENCE_DATE = "1970-01-01";

export function getDaysRemaining(
  expiryDateStr: string,
  referenceDate = DEFAULT_REFERENCE_DATE
) {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isMemberActive(
  expiryDateStr: string,
  referenceDate = DEFAULT_REFERENCE_DATE
) {
  return getDaysRemaining(expiryDateStr, referenceDate) >= 0;
}

export function calculateExpiryDate(planType: string, startDate: Date | string) {
  const result = new Date(startDate);
  if (planType === "1 Month") {
    result.setMonth(result.getMonth() + 1);
  } else if (planType === "3 Months") {
    result.setMonth(result.getMonth() + 3);
  } else if (planType === "1 Year") {
    result.setFullYear(result.getFullYear() + 1);
  }
  return result.toISOString().split("T")[0];
}
