import type { Dispatch, SetStateAction } from "react";
import type { Member } from "@/lib/gym-members";
import { DatabaseIcon } from "@/components/icons";
import { isMemberActive } from "@/lib/gym-members";

export default function DatabaseTab({ filteredMembers, searchQuery, setSearchQuery, statusFilter, setStatusFilter, setSelectedQrModalMember, handleToggleExpiry, handleTestScanMember, handleDeleteMember, referenceDate }: {
  filteredMembers: Member[]; searchQuery: string; setSearchQuery: Dispatch<SetStateAction<string>>; statusFilter: string; setStatusFilter: Dispatch<SetStateAction<string>>;
  setSelectedQrModalMember: Dispatch<SetStateAction<Member | null>>; handleToggleExpiry: (memberId: string) => void; handleTestScanMember: (member: Member) => void;
  handleDeleteMember: (memberId: string) => void; referenceDate: string;
}) {
  return (
          <div className="bg-white/90 border border-[#c4c9df]/60 rounded-2xl p-4 sm:p-6 shadow-xl shadow-[#e4e6f0]/30 space-y-6">
            
            {/* Database Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#151d3d] flex items-start gap-2">
                  <DatabaseIcon />
                  <span>Gym Member Directory</span>
                </h2>
                <p className="text-xs text-[#5d70c7] mt-0.5">
                  Manage active passes, re-issue QR codes, or test expiry states.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-[#e4e6f0] rounded-xl px-3.5 py-2 text-xs text-[#151d3d] placeholder-[#8795db] focus:outline-none focus:border-[#5d70c7] w-full sm:w-64"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-[#e4e6f0] rounded-xl px-3 py-2 text-xs text-[#151d3d] focus:outline-none focus:border-[#5d70c7] w-full sm:w-auto"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="EXPIRED">Expired Only</option>
                </select>
              </div>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-xs text-[#151d3d]">
                <thead className="bg-white text-[#5d70c7] uppercase tracking-wider font-semibold border-b border-[#e4e6f0]">
                  <tr>
                    <th className="p-3.5">Member ID</th>
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Plan</th>
                    <th className="p-3.5">Registered</th>
                    <th className="p-3.5">Expiry Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e6f0]/60">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => {
                      const active = isMemberActive(member.expiryDate, referenceDate);
                      return (
                        <tr key={member.id} className="hover:bg-[#e4e6f0]/40 transition">
                          <td className="p-3.5 font-mono font-bold text-[#151d3d]">{member.id}</td>
                          <td className="p-3.5">
                            <div className="font-semibold text-[#151d3d]">{member.name}</div>
                            <div className="text-[11px] text-[#8795db]">{member.email}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-[#e4e6f0] text-[#6f80d2] font-semibold text-[11px]">
                              {member.plan}
                            </span>
                          </td>
                          <td className="p-3.5 text-[#5d70c7]">{member.registrationDate}</td>
                          <td className="p-3.5 font-medium">{member.expiryDate}</td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                active
                                  ? "bg-[#5d70c7]/10 text-[#6f80d2] border border-[#5d70c7]/30"
                                  : "bg-[#f26173]/10 text-[#f26173] border border-[#f26173]/30"
                              }`}
                            >
                              {active ? "ACTIVE" : "EXPIRED"}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            {/* View QR Modal Trigger */}
                            <button
                              onClick={() => setSelectedQrModalMember(member)}
                              className="px-2.5 py-1 bg-[#e4e6f0] hover:bg-[#d4d8ea] text-[#151d3d] rounded-lg text-[11px] font-semibold transition"
                              title="View QR Code"
                            >
                              QR
                            </button>

                            {/* Toggle Expiry Test Button */}
                            <button
                              onClick={() => handleToggleExpiry(member.id)}
                              className="px-2.5 py-1 bg-[#5d70c7]/20 hover:bg-[#5d70c7]/30 text-[#8795db] border border-[#5d70c7]/30 rounded-lg text-[11px] font-semibold transition"
                              title="Toggle Expiry Date to test active vs expired"
                            >
                              Toggle Status
                            </button>

                            {/* Test Scan */}
                            <button
                              onClick={() => handleTestScanMember(member)}
                              className="px-2.5 py-1 bg-[#5d70c7]/20 hover:bg-[#5d70c7]/30 text-[#8795db] border border-[#5d70c7]/30 rounded-lg text-[11px] font-semibold transition"
                            >
                              Scan
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              className="px-2 py-1 bg-[#f26173]/10 hover:bg-[#f26173]/20 text-[#f26173] rounded-lg text-[11px] transition"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#8795db]">
                        No members found matching your search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
  );
}
