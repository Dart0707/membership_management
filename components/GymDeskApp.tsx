"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  getGymDate,
  checkInMemberForDate,
  getCheckInMessage,
  calculateExpiryDate,
  DEFAULT_MEMBERSHIP_PLANS,
  DEFAULT_REFERENCE_DATE,
  getPlanPrice,
  isMemberActive,
  normalizePhilippinePhone,
  type Member,
  type MemberFormData,
  type MembershipPlan,
  type AttendanceRecord,
  type ScanMessage,
  type ScanResult,
} from "@/lib/gym-members";
import {
  checkInMemberOncePerDay,
  createMembershipPlan,
  deleteMembershipPlan,
  deleteMemberFromDatabase,
  fetchMembers,
  fetchMembershipPlans,
  recordMembershipRenewal,
  fetchAttendance,
  upsertMember,
} from "@/lib/member-repository";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import DatabaseTab from "@/components/DatabaseTab";
import QrModal from "@/components/QrModal";
import RegistrationTab from "@/components/RegistrationTab";
import ScannerTab from "@/components/ScannerTab";
import AttendanceTab from "@/components/AttendanceTab";

export default function App() {
  const scanning = useRef(false);
  // --- STATE ---
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>(DEFAULT_MEMBERSHIP_PLANS);
  const [referenceDate, setReferenceDate] = useState(DEFAULT_REFERENCE_DATE);
  const [activeTab, setActiveTab] = useState("register"); // 'register' | 'scanner' | 'database' | 'attendance'
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Registration Form State
  const [formData, setFormData] = useState<MemberFormData>({
    name: "",
    address: "",
    phone: "",
    plan: "1 Month",
    activity: "Gym",
    isStudent: false,
  });
  const [lastRegisteredMember, setLastRegisteredMember] = useState<Member | null>(null);

  // Scanner State
  const [scannedIdInput, setScannedIdInput] = useState("");
  const [scannedResult, setScannedResult] = useState<ScanResult | null>(null);
  const [scanMessage, setScanMessage] = useState<ScanMessage>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Database Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedQrModalMember, setSelectedQrModalMember] = useState<Member | null>(null);

  // --- INITIALIZE LOCAL STORAGE ---
  useEffect(() => {
    queueMicrotask(() => {
      setReferenceDate(getGymDate());
    });

    const storedPlans = localStorage.getItem("gym_plans_v1");
    if (storedPlans) {
      try {
        queueMicrotask(() => setPlans(JSON.parse(storedPlans) as MembershipPlan[]));
      } catch (error) {
        console.error("Unable to load stored gym plans:", error);
      }
    } else {
      localStorage.setItem("gym_plans_v1", JSON.stringify(DEFAULT_MEMBERSHIP_PLANS));
    }

    fetchMembershipPlans()
      .then((remotePlans) => {
        if (remotePlans && remotePlans.length > 0) {
          setPlans(remotePlans);
          localStorage.setItem("gym_plans_v1", JSON.stringify(remotePlans));
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to load plans from Supabase:", error);
      });

    const stored = localStorage.getItem("gym_members_v1");
    if (stored) {
      try {
        const storedMembers = JSON.parse(stored);
        queueMicrotask(() => setMembers(storedMembers));
      } catch (error) {
        console.error("Unable to load stored gym members:", error);
      }
    } else {
      localStorage.setItem("gym_members_v1", JSON.stringify([]));
    }

    fetchMembers()
      .then((remoteMembers) => {
        if (remoteMembers && remoteMembers.length > 0) {
          setMembers(remoteMembers);
          localStorage.setItem("gym_members_v1", JSON.stringify(remoteMembers));
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to load members from Supabase:", error);
      });

    const storedAttendance = localStorage.getItem("gym_attendance_v1");
    if (storedAttendance) {
      try {
        queueMicrotask(() => setAttendance(JSON.parse(storedAttendance) as AttendanceRecord[]));
      } catch (error) {
        console.error("Unable to load stored attendance:", error);
      }
    } else {
      localStorage.setItem("gym_attendance_v1", JSON.stringify([]));
    }

    fetchAttendance()
      .then((remoteAttendance) => {
        if (remoteAttendance && remoteAttendance.length > 0) {
          setAttendance(remoteAttendance);
          localStorage.setItem("gym_attendance_v1", JSON.stringify(remoteAttendance));
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to load attendance from Supabase:", error);
      });
  }, []);

  // Save changes to localStorage
  const saveMembersToStore = (updatedMembers: Member[]) => {
    setMembers(updatedMembers);
    localStorage.setItem("gym_members_v1", JSON.stringify(updatedMembers));
  };

  const syncMember = (member: Member) => {
    upsertMember(member).catch((error: unknown) => {
      console.error("Unable to synchronize member with Supabase:", error);
    });
  };

  const handleAddCustomPlan = (newPlan: MembershipPlan) => {
    const updatedPlans = [...plans, newPlan];
    setPlans(updatedPlans);
    localStorage.setItem("gym_plans_v1", JSON.stringify(updatedPlans));
    createMembershipPlan(newPlan).catch((error: unknown) => {
      console.error("Unable to save custom plan to Supabase:", error);
    });
  };

  const handleDeleteCustomPlan = (title: string) => {
    // 1. Safety check: prevent deleting if members are currently assigned to it
    const isPlanInUse = members.some((m) => m.plan === title);
    if (isPlanInUse) {
      alert(`Cannot delete "${title}" because there are gym members currently using it. Please reassign them first.`);
      return;
    }

    // 2. Remove from local state & storage
    const updatedPlans = plans.filter((p) => p.title !== title);
    setPlans(updatedPlans);
    localStorage.setItem("gym_plans_v1", JSON.stringify(updatedPlans));

    // 3. Reset the form if they were currently viewing the deleted plan
    if (formData.plan === title) {
      const fallback = updatedPlans.find((p) => p.title !== "Daily Pass" && (p.activity === formData.activity || p.activity === "ALL"));
      setFormData({ ...formData, plan: fallback?.title || "1 Month" });
    }

    // 4. Delete from Supabase in the background
    deleteMembershipPlan(title).catch((error: unknown) => {
      console.error("Unable to delete custom plan from Supabase:", error);
      alert("Failed to delete the plan from the database.");
    });
  };

  // --- REGISTER NEW MEMBER ---
  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) return;
    const phone = normalizePhilippinePhone(formData.phone);
    if (!phone) {
      alert("Enter a valid Philippine phone number starting with 09, such as 09171234567.");
      return;
    }

    const selectedPlan = plans.find((p) => p.title === formData.plan);
    if (!selectedPlan || selectedPlan.title === "Daily Pass" || (selectedPlan.activity !== "ALL" && selectedPlan.activity !== formData.activity)) {
      alert("Select an available membership tier for this activity."); return;
    }
    const todayStr = getGymDate();
    const expiryStr = calculateExpiryDate(formData.plan, new Date(), plans);
    const newMemberId = `GYM-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

    const newMember: Member = {
      id: newMemberId,
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone,
      plan: formData.plan,
      activity: formData.activity,
      isStudent: formData.isStudent,
      price: getPlanPrice(formData.activity, formData.plan, formData.isStudent, plans),
      registrationDate: todayStr,
      expiryDate: expiryStr,
      checkIns: 0,
      remainingPasses:
        selectedPlan?.promoType === "daily_pass" ? (selectedPlan.passCount ?? 1) : null,
    };

    try { await upsertMember(newMember); }
    catch (error) { alert(error instanceof Error ? error.message : "Unable to save member."); return; }
    const updated = [newMember, ...members];
    saveMembersToStore(updated);
    setLastRegisteredMember(newMember);

    // Reset Form
    setFormData({
      name: "",
      address: "",
      phone: "",
      plan: "1 Month",
      activity: "Gym",
      isStudent: false,
    });
  };

  // --- TRIGGER TEST SCAN ---
  const handleTestScanMember = (member: Member) => {
    setScannedIdInput(member.id);
    setActiveTab("scanner");
    performScan(member.id);
  };

  // --- SCANNER LOOKUP ---
  const performScan = async (memberId?: string) => {
    if (scanning.current) return;
    scanning.current = true;
    try {
    const scanDate = getGymDate();
    setReferenceDate(scanDate);
    const currentMembers = JSON.parse(localStorage.getItem("gym_members_v1") ?? "[]") as Member[];
    const idToSearch = (memberId || scannedIdInput).trim().toUpperCase();
    if (!idToSearch) return;

    const found = currentMembers.find(
      (m) => m.id.toUpperCase() === idToSearch || idToSearch.includes(m.id.toUpperCase())
    );

    if (found) {
      const remote = await checkInMemberOncePerDay(found.id);
      const existing = JSON.parse(localStorage.getItem("gym_attendance_v1") ?? "[]") as AttendanceRecord[];
      const localMember = found.remainingPasses == null && existing.some(r => r.memberId === found.id && r.activity === found.activity && r.date === scanDate)
        ? {...found, lastCheckInDate: scanDate} : found;
      const updatedMember = remote?.member ?? checkInMemberForDate(localMember, scanDate);
      const alreadyToday = remote?.alreadyToday ?? (localMember.lastCheckInDate === scanDate || (localMember.remainingPasses != null && localMember.lastPassDate === scanDate));
      const record: AttendanceRecord = remote?.attendance ?? (alreadyToday ? existing.find(r => r.memberId === found.id && r.activity === found.activity && r.date === scanDate) : undefined) ?? {
        id: `${found.id}-attendance-${scanDate}`, memberId: found.id, memberName: found.name,
        activity: found.activity, date: scanDate, checkedInAt: new Date().toISOString()
      };
      saveMembersToStore(currentMembers.map(m => m.id === found.id ? updatedMember : m));
      const next = [record, ...existing.filter(r => r.id !== record.id)];
      setAttendance(next);
      localStorage.setItem("gym_attendance_v1", JSON.stringify(next));
      setScannedResult({...updatedMember, isJustCheckedIn: true});
      setScanMessage({type:"SUCCESS", text: getCheckInMessage(alreadyToday, updatedMember.remainingPasses)});
    } else {
      setScannedResult(null);
      setScanMessage({
        type: "ERROR",
        text: `No member found with ID: ${idToSearch}`,
      });
    }
    } catch (error) {
      setScannedResult(null);
      setScanMessage({type:"ERROR",text:error instanceof Error ? error.message : "Unable to check in."});
    } finally { scanning.current = false; }
  };

  const handleToggleExpiry = (memberId: string) => {
    const updated = members.map((member) => {
      if (member.id !== memberId) return member;

      const currentlyActive = isMemberActive(
        member.expiryDate,
        referenceDate,
        member.remainingPasses,
        member.lastPassDate
      );
      const date = new Date();
      date.setDate(date.getDate() + (currentlyActive ? -1 : 30));
      return { ...member, expiryDate: date.toISOString().split("T")[0] };
    });
    saveMembersToStore(updated);
    const changedMember = updated.find((member) => member.id === memberId);
    if (changedMember) syncMember(changedMember);
  };

  const handleRenewMember = async (memberId: string, plan: string) => {
    if (plan === "Daily Pass") return;
    const member = members.find((item) => item.id === memberId);
    if (!member) return;

    const matchedPlan = plans.find((p) => p.title === plan);
    const renewalStartDate = isMemberActive(
      member.expiryDate,
      referenceDate,
      member.remainingPasses,
      member.lastPassDate
    )
      ? member.expiryDate
      : referenceDate;
    const updatedMember: Member = {
      ...member,
      lastPassDate: null,
      plan,
      price: getPlanPrice(
        member.activity ?? "Gym",
        plan,
        member.isStudent ?? false,
        plans
      ),
      expiryDate: calculateExpiryDate(plan, renewalStartDate, plans),
      remainingPasses:
        matchedPlan?.promoType === "daily_pass" ? (matchedPlan.passCount ?? 1) : null,
    };
    const updated = members.map((item) => (item.id === memberId ? updatedMember : item));
    saveMembersToStore(updated);

    try {
      await upsertMember(updatedMember);
      await recordMembershipRenewal({
        memberId: member.id,
        plan,
        activity: member.activity ?? "Gym",
        isStudent: member.isStudent ?? false,
        price: updatedMember.price,
        previousExpiryDate: member.expiryDate,
        newExpiryDate: updatedMember.expiryDate,
      });
    } catch (error: unknown) {
      console.error("Unable to save membership renewal:", error);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    if (confirm("Are you sure you want to delete this member pass?")) {
      saveMembersToStore(members.filter((member) => member.id !== memberId));
      deleteMemberFromDatabase(memberId).catch((error: unknown) => {
        console.error("Unable to delete member from Supabase:", error);
      });
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        member.name.toLowerCase().includes(query) ||
        (member.address ?? "").toLowerCase().includes(query) ||
        member.id.toLowerCase().includes(query);
      const active = isMemberActive(
        member.expiryDate,
        referenceDate,
        member.remainingPasses,
        member.lastPassDate
      );
      if (statusFilter === "ACTIVE") return matchesSearch && active;
      if (statusFilter === "EXPIRED") return matchesSearch && !active;
      return matchesSearch;
    });
  }, [members, referenceDate, searchQuery, statusFilter]);

  const activeCount = members.filter((member) =>
    isMemberActive(member.expiryDate, referenceDate, member.remainingPasses, member.lastPassDate)
  ).length;
  const expiredCount = members.length - activeCount;

  return (
    <div className="min-h-screen bg-transparent text-[#151d3d] font-sans pb-12 flex flex-col">
      <AppHeader activeTab={activeTab} setActiveTab={setActiveTab} activeCount={activeCount} expiredCount={expiredCount} />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full">
        {activeTab === "register" && (
          <RegistrationTab
            formData={formData}
            setFormData={setFormData}
            handleRegisterSubmit={handleRegisterSubmit}
            lastRegisteredMember={lastRegisteredMember}
            handleTestScanMember={handleTestScanMember}
            referenceDate={referenceDate}
            plans={plans}
            onAddCustomPlan={handleAddCustomPlan}
            onDeleteCustomPlan={handleDeleteCustomPlan} /* <-- ADD THIS */
          />
        )}
        {activeTab === "scanner" && <ScannerTab members={members} scannedIdInput={scannedIdInput} setScannedIdInput={setScannedIdInput} performScan={performScan} isCameraActive={isCameraActive} setIsCameraActive={setIsCameraActive} scannedResult={scannedResult} setScannedResult={setScannedResult} scanMessage={scanMessage} setScanMessage={setScanMessage} referenceDate={referenceDate} />}
        {activeTab === "database" && <DatabaseTab filteredMembers={filteredMembers} searchQuery={searchQuery} setSearchQuery={setSearchQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} setSelectedQrModalMember={setSelectedQrModalMember} handleToggleExpiry={handleToggleExpiry} handleRenewMember={handleRenewMember} handleTestScanMember={handleTestScanMember} handleDeleteMember={handleDeleteMember} referenceDate={referenceDate} />}
        {activeTab === "attendance" && <AttendanceTab attendance={attendance} referenceDate={referenceDate} />}
      </main>
      <QrModal member={selectedQrModalMember} setMember={setSelectedQrModalMember} handleTestScanMember={handleTestScanMember} />
      <AppFooter />
    </div>
  );
}