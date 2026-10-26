import { supabase } from "@/lib/supabase";
import type { Member } from "@/lib/gym-members";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  activity?: Member["activity"];
  is_student?: boolean;
  price?: number;
  registration_date: string;
  expiry_date: string;
  check_ins: number;
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

function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    plan: row.plan,
    activity: row.activity ?? "Gym",
    isStudent: row.is_student ?? false,
    price: row.price ?? 0,
    registrationDate: row.registration_date,
    expiryDate: row.expiry_date,
    checkIns: row.check_ins,
  };
}

function toRow(member: Member): MemberRow {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    plan: member.plan,
    activity: member.activity,
    is_student: member.isStudent,
    price: member.price,
    registration_date: member.registrationDate,
    expiry_date: member.expiryDate,
    check_ins: member.checkIns,
  };
}

export async function fetchMembers() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("members")
    .select("id,name,email,phone,plan,activity,is_student,price,registration_date,expiry_date,check_ins")
    .order("registration_date", { ascending: false });

  if (error) throw new Error(`Unable to load members from Supabase: ${error.message}`);
  return (data as MemberRow[]).map(toMember);
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
