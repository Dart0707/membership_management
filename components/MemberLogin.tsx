"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchMemberByLogin } from "@/lib/member-repository";
import { getGymDate, isMemberActive, normalizePhilippinePhone, type Member } from "@/lib/gym-members";
import MemberQrCode from "@/components/MemberQrCode";

const localMembersKey = "gym_members_v1";

function findLocalMember(phone: string, username: string): Member | null {
  const storedMembers = localStorage.getItem(localMembersKey);
  if (!storedMembers) return null;

  try {
    const members = JSON.parse(storedMembers) as Member[];
    const normalizedUsername = username.trim().toLocaleLowerCase();
    return members.find(
      (member) =>
        member.phone === phone &&
        member.name.trim().toLocaleLowerCase() === normalizedUsername
    ) ?? null;
  } catch (error) {
    console.error("Unable to read local member records:", error);
    return null;
  }
}

export default function MemberLogin() {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [today, setToday] = useState("");

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setMember(null);

    const normalizedPhone = normalizePhilippinePhone(phone);
    if (!normalizedPhone) {
      setErrorMessage("Enter the same valid Philippine phone number used during registration.");
      return;
    }

    setIsLoading(true);
    try {
      const remoteMember = await fetchMemberByLogin(normalizedPhone, username);
      const foundMember = remoteMember ?? findLocalMember(normalizedPhone, username);
      if (!foundMember) {
        setErrorMessage("We could not find a member with that name and phone number.");
        return;
      }
      setToday(getGymDate());
      setMember(foundMember);
    } catch (error) {
      console.error("Unable to log in member:", error);
      setErrorMessage("We could not verify your details right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 text-[#151d3d] sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="MTFC logo" width={72} height={56} className="h-14 w-[72px] rounded-xl border border-[#e4e6f0] bg-white object-contain shadow-sm" priority />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f80d2]">MTFC</p>
              <h1 className="text-lg font-bold sm:text-xl">Member Portal</h1>
            </div>
          </Link>
        </header>

        {!member ? (
          <section className="mx-auto max-w-md rounded-3xl border border-[#e4e6f0] bg-white/90 p-6 shadow-xl sm:p-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#6f80d2]">Member access</p>
            <h2 className="text-2xl font-bold">View your membership</h2>
            <p className="mt-2 text-sm leading-6 text-[#5d70c7]">
              Log in with the name and phone number you provided during registration.
            </p>

            <form onSubmit={handleLogin} className="mt-7 space-y-4">
              <label className="block text-sm font-semibold">
                Username
                <input
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Your registered name"
                  className="mt-2 w-full rounded-xl border border-[#c4c9df] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5d70c7] focus:ring-2 focus:ring-[#5d70c7]/20"
                />
              </label>
              <label className="block text-sm font-semibold">
                Phone number
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="09171234567"
                  className="mt-2 w-full rounded-xl border border-[#c4c9df] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5d70c7] focus:ring-2 focus:ring-[#5d70c7]/20"
                />
              </label>
              {errorMessage && <p role="alert" className="rounded-xl bg-[#fae5e8] px-4 py-3 text-sm font-medium text-[#b63d4d]">{errorMessage}</p>}
              <a href="/member-registration" className="block underline text-sm font-semibold text-[#5d70c7] transition hover:underline">
                Not registered yet? Sign up here.
              </a>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-[#5d70c7] px-4 py-3 text-sm font-bold text-[#151d3d] transition hover:bg-[#6f80d2] disabled:cursor-wait disabled:opacity-60"
              >
                {isLoading ? "Checking details..." : "Log in"}
              </button>
            </form>
          </section>
        ) : (
          <section className="rounded-3xl border border-[#e4e6f0] bg-white/90 p-6 shadow-xl sm:p-10">
            <div className="flex flex-col items-center text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6f80d2]">Welcome back</p>
              <h2 className="mt-2 text-3xl font-bold">{member.name}</h2>
              <p className="mt-1 text-sm text-[#5d70c7]">{member.id}</p>
              <div className="mt-7 rounded-2xl border border-[#e4e6f0] bg-white p-4 shadow-inner">
                <MemberQrCode memberId={member.id} size={240} />
              </div>
              <p className="mt-4 max-w-sm text-sm text-[#5d70c7]">
                Show this QR code at the gym desk for check-in.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                ["Activity", member.activity],
                ["Plan", member.plan],
                ["Registered", member.registrationDate],
                ["Expires", member.expiryDate],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-[#e4e6f0] bg-[#f7f8fc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8795db]">{label}</p>
                  <p className="mt-1 font-bold">{value}</p>
                </div>
              ))}
            </div>

            <div className={`mt-4 rounded-2xl px-4 py-3 text-center text-sm font-bold ${isMemberActive(member.expiryDate, today, member.remainingPasses, member.lastPassDate) ? "bg-[#e4f5ed] text-[#28734c]" : "bg-[#fae5e8] text-[#b63d4d]"}`}>
              {isMemberActive(member.expiryDate, today, member.remainingPasses, member.lastPassDate) ? "Membership active" : "Membership expired"}
            </div>
            <button onClick={() => setMember(null)} className="mt-6 w-full rounded-xl border border-[#c4c9df] bg-white px-4 py-3 text-sm font-bold text-[#5d70c7] transition hover:bg-[#f7f8fc]">
              Log out
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
