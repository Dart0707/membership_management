import { supabase } from "@/lib/supabase";
import type { AttendanceRecord, Member, MembershipPlan } from "@/lib/gym-members";

type MemberRow = {
  id: string;
  name: string;
  address: string;
  email?: string;
  phone: string;
  plan: string;
  activity?: Member["activity"];
  is_student?: boolean;
  price?: number;
  registration_date: string;
  expiry_date: string;
  check_ins: number;
  remaining_passes?: number | null;
};

type MembershipPlanRow = {
  title: string;
  description: string;
  activity: MembershipPlan["activity"];
  promo_type: "daily_pass" | "time_based";
  pass_count: number | null;
  duration_days: number;
  price: number;
  student_price: number | null;
  is_custom: boolean;
};

export type MembershipRenewal = {
  memberId: string;
  plan: string;
  activity: Member["activity"];
  isStudent: boolean;
  price: number;
  previousExpiryDate: string;
  newExpiryDate: string;
};

type AttendanceRow = {
  id: string;
  member_id: string;
  member_name: string;
  activity: AttendanceRecord["activity"];
  attendance_date: string;
  checked_in_at: string;
};

function toAttendanceRecord(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    memberId: row.member_id,
    memberName: row.member_name,
    activity: row.activity,
    date: row.attendance_date,
    checkedInAt: row.checked_in_at,
  };
}

function toMembershipPlan(row: MembershipPlanRow): MembershipPlan {
  return {
    title: row.title,
    description: row.description,
    activity: row.activity,
    promoType: row.promo_type,
    passCount: row.pass_count,
    durationDays: Number(row.duration_days),
    price: Number(row.price),
    studentPrice: row.student_price !== null ? Number(row.student_price) : null,
    isCustom: row.is_custom,
  };
}

function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? "",
    email: row.email,
    phone: row.phone,
    plan: row.plan,
    activity: row.activity ?? "Gym",
    isStudent: row.is_student ?? false,
    price: Number(row.price ?? 0),
    registrationDate: row.registration_date,
    expiryDate: row.expiry_date,
    checkIns: row.check_ins,
    remainingPasses: row.remaining_passes ?? null,
  };
}

function toRow(member: Member): MemberRow {
  return {
    id: member.id,
    name: member.name,
    address: member.address ?? "",
    ...(member.email !== undefined ? { email: member.email } : {}),
    phone: member.phone,
    plan: member.plan,
    activity: member.activity,
    is_student: member.isStudent,
    price: member.price,
    registration_date: member.registrationDate,
    expiry_date: member.expiryDate,
    check_ins: member.checkIns,
    remaining_passes: member.remainingPasses,
  };
}

export async function fetchMembershipPlans(): Promise<MembershipPlan[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("membership_plans")
    .select("title,description,activity,promo_type,pass_count,duration_days,price,student_price,is_custom")
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code === "PGRST205") return null;
    throw new Error(`Unable to load membership plans: ${error.message}`);
  }
  return (data as MembershipPlanRow[]).map(toMembershipPlan);
}

export async function createMembershipPlan(plan: MembershipPlan): Promise<MembershipPlan> {
  if (!supabase) return plan;

  const { data, error } = await supabase
    .from("membership_plans")
    .insert({
      title: plan.title,
      description: plan.description,
      activity: plan.activity,
      promo_type: plan.promoType,
      pass_count: plan.passCount,
      duration_days: plan.durationDays,
      price: plan.price,
      student_price: plan.studentPrice,
      is_custom: plan.isCustom,
    })
    .select()
    .single();

  if (error) throw new Error(`Unable to save custom plan to Supabase: ${error.message}`);
  return toMembershipPlan(data as MembershipPlanRow);
}

export async function fetchMembers() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("members")
    .select("id,name,email,address,phone,plan,activity,is_student,price,registration_date,expiry_date,check_ins,remaining_passes")
    .order("registration_date", { ascending: false });

  if (error) throw new Error(`Unable to load members from Supabase: ${error.message}`);
  return (data as MemberRow[]).map(toMember);
}

export async function fetchMemberByLogin(phone: string, username: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("members")
    .select("id,name,email,address,phone,plan,activity,is_student,price,registration_date,expiry_date,check_ins,remaining_passes")
    .eq("phone", phone);

  if (error) throw new Error(`Unable to verify member login: ${error.message}`);

  const normalizedUsername = username.trim().toLocaleLowerCase();
  const member = (data as MemberRow[]).find(
    (row) => row.name.trim().toLocaleLowerCase() === normalizedUsername
  );
  return member ? toMember(member) : null;
}

export async function fetchAttendance() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("attendance")
    .select("id,member_id,member_name,activity,attendance_date,checked_in_at")
    .order("checked_in_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205") return null;
    throw new Error(`Unable to load attendance from Supabase: ${error.message}`);
  }
  return (data as AttendanceRow[]).map(toAttendanceRecord);
}

export async function recordAttendance(record: AttendanceRecord) {
  if (!supabase) return;

  const { error } = await supabase.from("attendance").insert({
    id: record.id,
    member_id: record.memberId,
    member_name: record.memberName,
    activity: record.activity,
    attendance_date: record.date,
    checked_in_at: record.checkedInAt,
  });
  if (error) throw new Error(`Unable to record attendance: ${error.message}`);
}

export async function upsertMember(member: Member) {
  if (!supabase) return;

  const { error } = await supabase.from("members").upsert(toRow(member));
  if (error) throw new Error(`Unable to save member to Supabase: ${error.message}`);
}

export async function recordMembershipRenewal(renewal: MembershipRenewal) {
  if (!supabase) return;

  const { error } = await supabase.from("membership_renewals").insert({
    member_id: renewal.memberId,
    plan: renewal.plan,
    activity: renewal.activity,
    is_student: renewal.isStudent,
    price: renewal.price,
    previous_expiry_date: renewal.previousExpiryDate,
    new_expiry_date: renewal.newExpiryDate,
  });
  if (error) throw new Error(`Unable to record membership renewal: ${error.message}`);
}

export async function deleteMemberFromDatabase(memberId: string) {
  if (!supabase) return;

  const { error } = await supabase.from("members").delete().eq("id", memberId);
  if (error) throw new Error(`Unable to delete member from Supabase: ${error.message}`);
}

export async function deleteMembershipPlan(title: string) {
  if (!supabase) return;

  const { error } = await supabase.from("membership_plans").delete().eq("title", title);
  if (error) throw new Error(`Unable to delete membership plan from Supabase: ${error.message}`);
}