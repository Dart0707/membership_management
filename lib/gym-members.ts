export type Activity = "Gym" | "Boxing" | "Muay Thai" | "Brazilian Jiu Jitsu";

export type MembershipPlan = {
  title: string; // Primary Key (always unique)
  description: string;
  activity: Activity | "ALL";
  promoType: "daily_pass" | "time_based";
  passCount: number | null;
  durationDays: number;
  price: number;
  studentPrice: number | null;
  isCustom: boolean;
};

export type Member = {
  id: string;
  name: string;
  address: string;
  email?: string; // Historical email is preserved, but no longer collected.
  phone: string;
  plan: string; // Foreign Key referencing MembershipPlan.title
  activity: Activity;
  isStudent: boolean;
  price: number;
  registrationDate: string;
  expiryDate: string;
  checkIns: number;
  remainingPasses: number | null;
  lastPassDate?: string | null;
  lastCheckInDate?: string | null;
};

export type MemberFormData = Pick<
  Member,
  "name" | "address" | "phone" | "plan" | "activity" | "isStudent"
>;
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

export const DEFAULT_MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    title: "Daily Pass",
    description: "Valid today",
    activity: "ALL",
    promoType: "daily_pass",
    passCount: 1,
    durationDays: 0,
    price: 100,
    studentPrice: 100,
    isCustom: false,
  },
  {
    title: "1 Month",
    description: "Short term",
    activity: "ALL",
    promoType: "time_based",
    passCount: null,
    durationDays: 30,
    price: 1000,
    studentPrice: 800,
    isCustom: false,
  },
];

export function normalizePhilippinePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("09") && digits.length === 11) return digits;
  return null;
}

const ACTIVITY_PRICES: Record<
  Activity,
  { daily: number; studentDaily: number; monthly: number; studentMonthly: number }
> = {
  Gym: { daily: 100, studentDaily: 100, monthly: 1000, studentMonthly: 800 },
  Boxing: { daily: 250, studentDaily: 220, monthly: 2800, studentMonthly: 2700 },
  "Muay Thai": { daily: 270, studentDaily: 250, monthly: 3200, studentMonthly: 3000 },
  "Brazilian Jiu Jitsu": { daily: 250, studentDaily: 220, monthly: 2800, studentMonthly: 2700 },
};

export function getPlanPrice(
  activity: Activity,
  planTitle: string,
  isStudent: boolean,
  plans: MembershipPlan[] = DEFAULT_MEMBERSHIP_PLANS
) {
  const prices = ACTIVITY_PRICES[activity];
  if (planTitle === "Daily Pass") return isStudent ? prices.studentDaily : prices.daily;
  if (planTitle === "1 Month") return isStudent ? prices.studentMonthly : prices.monthly;

  const customPlan = plans.find((p) => p.title === planTitle);
  if (customPlan) {
    if (isStudent && customPlan.studentPrice !== null && customPlan.studentPrice !== undefined) {
      return customPlan.studentPrice;
    }
    return customPlan.price;
  }
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
  referenceDate = DEFAULT_REFERENCE_DATE,
  remainingPasses?: number | null,
  lastPassDate?: string | null
) {
  const dateValid = getDaysRemaining(expiryDateStr, referenceDate) >= 0;
  if (!dateValid) return false;
  if (remainingPasses !== null && remainingPasses !== undefined) {
    return remainingPasses > 0 || lastPassDate === referenceDate;
  }
  return true;
}

export function calculateExpiryDate(
  planType: string,
  startDate: Date | string,
  plans: MembershipPlan[] = DEFAULT_MEMBERSHIP_PLANS
) {
  const result = new Date(startDate);
  if (planType === "Daily Pass") {
    return result.toISOString().split("T")[0];
  } else if (planType === "1 Month") {
    result.setMonth(result.getMonth() + 1);
    return result.toISOString().split("T")[0];
  }

  const matchedPlan = plans.find((p) => p.title === planType);
  if (matchedPlan) {
    if (matchedPlan.durationDays === 0) {
      return result.toISOString().split("T")[0];
    }
    result.setDate(result.getDate() + matchedPlan.durationDays);
  }
  return result.toISOString().split("T")[0];
}
export function getGymDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Manila",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
}

export function consumeDailyPass(member: Member, date: string): Member {
  if (!isMemberActive(member.expiryDate, date, member.remainingPasses, member.lastPassDate)) throw new Error("Membership expired or no passes remaining.");
  if (member.remainingPasses == null || member.lastPassDate === date) return member;
  return {...member, remainingPasses: member.remainingPasses - 1, lastPassDate: date, checkIns: member.checkIns + 1};
}

export function checkInMemberForDate(member: Member, date: string): Member {
  if (getDaysRemaining(member.expiryDate, date) < 0) throw new Error("Membership expired.");
  const alreadyToday = member.lastCheckInDate === date || (member.remainingPasses != null && member.lastPassDate === date);
  if (alreadyToday) return member;
  if (member.remainingPasses != null && member.remainingPasses <= 0) throw new Error("No passes remaining.");
  return {...member, lastCheckInDate: date, checkIns: member.checkIns + 1,
    ...(member.remainingPasses != null ? {remainingPasses: member.remainingPasses - 1, lastPassDate: date} : {})};
}

export function getCheckInMessage(alreadyToday: boolean, remainingPasses: number | null) {
  if (alreadyToday) return "Member has already checked in today. Re-entry allowed; no additional attendance or pass counted.";
  return remainingPasses == null ? "Check-in successful! Access granted." : `Check-in successful. One day used (${remainingPasses} passes left).`;
}
