export type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  activity: Activity;
  isStudent: boolean;
  price: number;
  registrationDate: string;
  expiryDate: string;
  checkIns: number;
};

export type Activity = "Gym" | "Boxing" | "Muay Thai" | "Brazilian Jiu Jitsu";
export type MemberFormData = Pick<Member, "name" | "email" | "phone" | "plan" | "activity" | "isStudent">;
export type ScanResult = Member & { isJustCheckedIn: boolean };
export type ScanMessage =
  | { type: "SUCCESS" | "EXPIRED" | "ERROR"; text: string }
  | null;

export type AttendanceRecord = {
  id: string;
  memberId: string;
  memberName: string;
  activity: Activity;
  date: string;
  checkedInAt: string;
};

export const DEFAULT_REFERENCE_DATE = "1970-01-01";
export const ACTIVITIES: Activity[] = ["Gym", "Boxing", "Muay Thai", "Brazilian Jiu Jitsu"];

export function normalizePhilippinePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("09") && digits.length === 11) return digits;
  return null;
}

const ACTIVITY_PRICES: Record<Activity, { daily: number; studentDaily: number; monthly: number; studentMonthly: number }> = {
  Gym: { daily: 100, studentDaily: 100, monthly: 1000, studentMonthly: 800 },
  Boxing: { daily: 250, studentDaily: 220, monthly: 2800, studentMonthly: 2700 },
  "Muay Thai": { daily: 270, studentDaily: 250, monthly: 3200, studentMonthly: 3000 },
  "Brazilian Jiu Jitsu": { daily: 250, studentDaily: 220, monthly: 2800, studentMonthly: 2700 },
};

export function getPlanPrice(activity: Activity, plan: string, isStudent: boolean) {
  const prices = ACTIVITY_PRICES[activity];
  if (plan === "Daily Pass") return isStudent ? prices.studentDaily : prices.daily;
  if (plan === "1 Month") return isStudent ? prices.studentMonthly : prices.monthly;
  return 0;
}

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
  if (planType === "Daily Pass") {
    return result.toISOString().split("T")[0];
  } else if (planType === "1 Month") {
    result.setMonth(result.getMonth() + 1);
  }
  return result.toISOString().split("T")[0];
}
