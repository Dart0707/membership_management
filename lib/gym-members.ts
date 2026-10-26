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

export const INITIAL_MEMBERS: Member[] = [
  {
    id: "GYM-8492-A",
    name: "Sarah Jenkins",
    email: "sarah.j@example.com",
    phone: "+1 (555) 234-5678",
    plan: "3 Months",
    registrationDate: "2026-08-01",
    expiryDate: "2026-11-01",
    checkIns: 14,
  },
  {
    id: "GYM-1039-B",
    name: "Marcus Vance",
    email: "marcus.v@example.com",
    phone: "+1 (555) 876-5432",
    plan: "1 Month",
    registrationDate: "2026-09-01",
    expiryDate: "2026-10-01",
    checkIns: 8,
  },
  {
    id: "GYM-5521-C",
    name: "Elena Rostova",
    email: "elena.r@example.com",
    phone: "+1 (555) 432-1098",
    plan: "1 Year",
    registrationDate: "2026-01-15",
    expiryDate: "2027-01-15",
    checkIns: 42,
  },
];

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
