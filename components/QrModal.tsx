import type { Dispatch, SetStateAction } from "react";
import type { Member } from "@/lib/gym-members";
import MemberQrCode from "@/components/MemberQrCode";

export default function QrModal({ member, setMember, handleTestScanMember }: { member: Member | null; setMember: Dispatch<SetStateAction<Member | null>>; handleTestScanMember: (member: Member) => void; }) {
  if (!member) return null;
  return (

        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center relative shadow-2xl">
            <button
              onClick={() => setMember(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
            <p className="text-xs text-slate-400 mb-4">{member.id}</p>

            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <MemberQrCode memberId={member.id} size={240} />
            </div>

            <div className="text-xs text-slate-400 mb-4">
              Plan: <span className="text-white font-bold">{member.plan}</span> | Expires:{" "}
              <span className="text-emerald-400 font-bold">{member.expiryDate}</span>
            </div>

            <button
              onClick={() => {
                const m = member;
                setMember(null);
                handleTestScanMember(m);
              }}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              Test Scan Pass
            </button>
          </div>
        </div>
      );
}
