import { supabase } from "@/lib/supabase";
import type { Member } from "@/lib/gym-members";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  registration_date: string;
  expiry_date: string;
  check_ins: number;
};

function toMember(row: MemberRow): Member {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    plan: row.plan,
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
    registration_date: member.registrationDate,
    expiry_date: member.expiryDate,
    check_ins: member.checkIns,
  };
}

export async function fetchMembers() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("members")
    .select("id,name,email,phone,plan,registration_date,expiry_date,check_ins")
    .order("registration_date", { ascending: false });

  if (error) throw new Error(`Unable to load members from Supabase: ${error.message}`);
  return (data as MemberRow[]).map(toMember);
}

export async function upsertMember(member: Member) {
  if (!supabase) return;

  const { error } = await supabase.from("members").upsert(toRow(member));
  if (error) throw new Error(`Unable to save member to Supabase: ${error.message}`);
}

export async function deleteMemberFromDatabase(memberId: string) {
  if (!supabase) return;

  const { error } = await supabase.from("members").delete().eq("id", memberId);
  if (error) throw new Error(`Unable to delete member from Supabase: ${error.message}`);
}
