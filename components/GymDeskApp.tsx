"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  calculateExpiryDate,
  DEFAULT_REFERENCE_DATE,
  getPlanPrice,
  isMemberActive,
  normalizePhilippinePhone,
  type Member,
  type MemberFormData,
  type AttendanceRecord,
  type ScanMessage,
  type ScanResult,
} from "@/lib/gym-members";
import {
  deleteMemberFromDatabase,
  fetchMembers,
  recordMembershipRenewal,
  fetchAttendance,
  recordAttendance,
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
  // --- STATE ---
  const [members, setMembers] = useState<Member[]>([]);
  const [referenceDate, setReferenceDate] = useState(DEFAULT_REFERENCE_DATE);
  const [activeTab, setActiveTab] = useState("register"); // 'register' | 'scanner' | 'database' | 'attendance'
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  
  // Registration Form State
  const [formData, setFormData] = useState<MemberFormData>({
    name: "",
    email: "",
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
      setReferenceDate(new Date().toISOString().split("T")[0]);
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

  // --- REGISTER NEW MEMBER ---
  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    const phone = normalizePhilippinePhone(formData.phone);
    if (!phone) {
      alert("Enter a valid Philippine phone number starting with 09, such as 09171234567.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const expiryStr = calculateExpiryDate(formData.plan, new Date());
    const newMemberId = `GYM-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

    const newMember = {
      id: newMemberId,
      name: formData.name,
      email: formData.email,
      phone,
      plan: formData.plan,
      activity: formData.activity,
      isStudent: formData.isStudent,
      price: getPlanPrice(formData.activity, formData.plan, formData.isStudent),
      registrationDate: todayStr,
      expiryDate: expiryStr,
      checkIns: 0,
    };

    const updated = [newMember, ...members];
    saveMembersToStore(updated);
    syncMember(newMember);
    setLastRegisteredMember(newMember);

    // Reset Form
    setFormData({
      name: "",
      email: "",
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
  const performScan = (memberId?: string) => {
    const idToSearch = (memberId || scannedIdInput).trim().toUpperCase();
    if (!idToSearch) return;

    const found = members.find((m) => m.id.toUpperCase() === idToSearch || idToSearch.includes(m.id.toUpperCase()));

    if (found) {
      const active = isMemberActive(found.expiryDate, referenceDate);
      
      // Increment check-in count if active
      if (active) {
        const updated = members.map((m) =>
          m.id === found.id ? { ...m, checkIns: (m.checkIns || 0) + 1 } : m
        );
        saveMembersToStore(updated);
        const updatedMember = updated.find((member) => member.id === found.id);
        if (updatedMember) syncMember(updatedMember);

        const checkedInAt = new Date();
        const attendanceRecord: AttendanceRecord = {
          id: `${found.id}-${checkedInAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
          memberId: found.id,
          memberName: found.name,
          activity: found.activity,
          date: checkedInAt.toISOString().split("T")[0],
          checkedInAt: checkedInAt.toISOString(),
        };
        const updatedAttendance = [attendanceRecord, ...attendance];
        setAttendance(updatedAttendance);
        localStorage.setItem("gym_attendance_v1", JSON.stringify(updatedAttendance));
        recordAttendance(attendanceRecord).catch((error: unknown) => {
          console.error("Unable to synchronize attendance with Supabase:", error);
        });
      }

      setScannedResult({ ...found, isJustCheckedIn: true });
      setScanMessage({
        type: active ? "SUCCESS" : "EXPIRED",
        text: active ? "Check-in Successful! Access Granted." : "Membership Expired! Access Denied.",
      });
    } else {
      setScannedResult(null);
      setScanMessage({
        type: "ERROR",
        text: `No member found with ID: ${idToSearch}`,
      });
    }
  };

  const handleToggleExpiry = (memberId: string) => {
    const updated = members.map((member) => {
      if (member.id !== memberId) return member;

      const currentlyActive = isMemberActive(member.expiryDate, referenceDate);
      const date = new Date();
      date.setDate(date.getDate() + (currentlyActive ? -1 : 30));
      return { ...member, expiryDate: date.toISOString().split("T")[0] };
    });
    saveMembersToStore(updated);
    const changedMember = updated.find((member) => member.id === memberId);
    if (changedMember) syncMember(changedMember);
  };

  const handleRenewMember = async (memberId: string, plan: string) => {
    const member = members.find((item) => item.id === memberId);
    if (!member) return;

    const renewalStartDate = isMemberActive(member.expiryDate, referenceDate)
      ? member.expiryDate
      : referenceDate;
    const updatedMember = {
      ...member,
      plan,
      price: getPlanPrice(member.activity ?? "Gym", plan, member.isStudent ?? false),
      expiryDate: calculateExpiryDate(plan, renewalStartDate),
    };
    const updated = members.map((item) => item.id === memberId ? updatedMember : item);
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
        member.email.toLowerCase().includes(query) ||
        member.id.toLowerCase().includes(query);
      const active = isMemberActive(member.expiryDate, referenceDate);
      if (statusFilter === "ACTIVE") return matchesSearch && active;
      if (statusFilter === "EXPIRED") return matchesSearch && !active;
      return matchesSearch;
    });
  }, [members, referenceDate, searchQuery, statusFilter]);

  const activeCount = members.filter((member) =>
    isMemberActive(member.expiryDate, referenceDate)
  ).length;
  const expiredCount = members.length - activeCount;

  return (
    <div className="min-h-screen bg-transparent text-[#151d3d] font-sans pb-12 flex flex-col">
      <AppHeader activeTab={activeTab} setActiveTab={setActiveTab} activeCount={activeCount} expiredCount={expiredCount} />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full">
        {activeTab === "register" && <RegistrationTab formData={formData} setFormData={setFormData} handleRegisterSubmit={handleRegisterSubmit} lastRegisteredMember={lastRegisteredMember} handleTestScanMember={handleTestScanMember} referenceDate={referenceDate} />}
        {activeTab === "scanner" && <ScannerTab members={members} scannedIdInput={scannedIdInput} setScannedIdInput={setScannedIdInput} performScan={performScan} isCameraActive={isCameraActive} setIsCameraActive={setIsCameraActive} scannedResult={scannedResult} setScannedResult={setScannedResult} scanMessage={scanMessage} setScanMessage={setScanMessage} referenceDate={referenceDate} />}
        {activeTab === "database" && <DatabaseTab filteredMembers={filteredMembers} searchQuery={searchQuery} setSearchQuery={setSearchQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} setSelectedQrModalMember={setSelectedQrModalMember} handleToggleExpiry={handleToggleExpiry} handleRenewMember={handleRenewMember} handleTestScanMember={handleTestScanMember} handleDeleteMember={handleDeleteMember} referenceDate={referenceDate} />}
        {activeTab === "attendance" && <AttendanceTab attendance={attendance} referenceDate={referenceDate} />}
      </main>
      <QrModal member={selectedQrModalMember} setMember={setSelectedQrModalMember} handleTestScanMember={handleTestScanMember} />
      <AppFooter />
    </div>
  );
}
