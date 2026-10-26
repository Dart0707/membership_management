"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  calculateExpiryDate,
  DEFAULT_REFERENCE_DATE,
  INITIAL_MEMBERS,
  isMemberActive,
  type Member,
  type MemberFormData,
  type ScanMessage,
  type ScanResult,
} from "@/lib/gym-members";
import {
  deleteMemberFromDatabase,
  fetchMembers,
  upsertMember,
} from "@/lib/member-repository";

import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import DatabaseTab from "@/components/DatabaseTab";
import QrModal from "@/components/QrModal";
import RegistrationTab from "@/components/RegistrationTab";
import ScannerTab from "@/components/ScannerTab";

export default function App() {
  // --- STATE ---
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [referenceDate, setReferenceDate] = useState(DEFAULT_REFERENCE_DATE);
  const [activeTab, setActiveTab] = useState("register"); // 'register' | 'scanner' | 'database'
  
  // Registration Form State
  const [formData, setFormData] = useState<MemberFormData>({
    name: "",
    email: "",
    phone: "",
    plan: "1 Month",
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
      localStorage.setItem("gym_members_v1", JSON.stringify(INITIAL_MEMBERS));
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

    const todayStr = new Date().toISOString().split("T")[0];
    const expiryStr = calculateExpiryDate(formData.plan, new Date());
    const newMemberId = `GYM-${Math.floor(1000 + Math.random() * 9000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

    const newMember = {
      id: newMemberId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || "+1 (555) 000-0000",
      plan: formData.plan,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 flex flex-col">
      <AppHeader activeTab={activeTab} setActiveTab={setActiveTab} activeCount={activeCount} expiredCount={expiredCount} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === "register" && <RegistrationTab formData={formData} setFormData={setFormData} handleRegisterSubmit={handleRegisterSubmit} lastRegisteredMember={lastRegisteredMember} handleTestScanMember={handleTestScanMember} referenceDate={referenceDate} />}
        {activeTab === "scanner" && <ScannerTab members={members} scannedIdInput={scannedIdInput} setScannedIdInput={setScannedIdInput} performScan={performScan} isCameraActive={isCameraActive} setIsCameraActive={setIsCameraActive} scannedResult={scannedResult} setScannedResult={setScannedResult} scanMessage={scanMessage} setScanMessage={setScanMessage} referenceDate={referenceDate} />}
        {activeTab === "database" && <DatabaseTab filteredMembers={filteredMembers} searchQuery={searchQuery} setSearchQuery={setSearchQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} setSelectedQrModalMember={setSelectedQrModalMember} handleToggleExpiry={handleToggleExpiry} handleTestScanMember={handleTestScanMember} handleDeleteMember={handleDeleteMember} referenceDate={referenceDate} />}
      </main>
      <QrModal member={selectedQrModalMember} setMember={setSelectedQrModalMember} handleTestScanMember={handleTestScanMember} />
      <AppFooter />
    </div>
  );
}
