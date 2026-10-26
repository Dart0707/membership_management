import { useRef } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { QRCodeCanvas } from "qrcode.react";
import type { Member, MemberFormData } from "@/lib/gym-members";
import { CheckCircleIcon, DownloadIcon, PrinterIcon, QrIcon, ScanIcon, UserPlusIcon } from "@/components/icons";
import { calculateExpiryDate } from "@/lib/gym-members";
import MemberQrCode from "@/components/MemberQrCode";

export default function RegistrationTab({ formData, setFormData, handleRegisterSubmit, lastRegisteredMember, handleTestScanMember, referenceDate }: {
  formData: MemberFormData; setFormData: Dispatch<SetStateAction<MemberFormData>>;
  handleRegisterSubmit: (event: FormEvent<HTMLFormElement>) => void; lastRegisteredMember: Member | null;
  handleTestScanMember: (member: Member) => void; referenceDate: string;
}) {
  const downloadQrRef = useRef<HTMLCanvasElement>(null);

  const downloadQrCode = () => {
    const canvas = downloadQrRef.current;
    if (!canvas || !lastRegisteredMember) return;

    const link = document.createElement("a");
    link.download = `${lastRegisteredMember.id}-QR.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Registration Form (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlusIcon />
                  <span>Register New Gym Member</span>
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Fill in customer details to issue an instant digital QR membership pass.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Full Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Miller"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Email Address <span className="text-emerald-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jordan@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* Plan Selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Membership Tier <span className="text-emerald-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { title: "1 Month", price: "$49", desc: "Short term" },
                      { title: "3 Months", price: "$129", desc: "Popular" },
                      { title: "1 Year", price: "$399", desc: "Best value" },
                    ].map((p) => (
                      <button
                        type="button"
                        key={p.title}
                        onClick={() => setFormData({ ...formData, plan: p.title })}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          formData.plan === p.title
                            ? "bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <div className="font-bold text-sm text-slate-200">{p.title}</div>
                        <div className="text-xs text-emerald-400 font-semibold mt-1">{p.price}</div>
                        <div className="text-[10px] text-slate-500">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Calculated Expiry Display */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Calculated Expiry Date:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {calculateExpiryDate(formData.plan, referenceDate)}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition transform active:scale-[0.99] flex items-center justify-center space-x-2"
                >
                  <QrIcon />
                  <span>Generate Member Pass & QR Code</span>
                </button>
              </form>
            </div>

            {/* Generated QR Pass Preview Card (5 cols) */}
            <div className="lg:col-span-5">
              {lastRegisteredMember ? (
                <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative text-center">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold mb-4">
                    <CheckCircleIcon />
                    <span>Member Successfully Registered!</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl inline-block shadow-inner mb-4 border border-slate-200">
                    <MemberQrCode memberId={lastRegisteredMember.id} size={220} />
                    <div className="mt-2 text-slate-900 font-mono font-bold text-sm tracking-wider">
                      {lastRegisteredMember.id}
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-white">{lastRegisteredMember.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">{lastRegisteredMember.email}</p>

                  <div className="grid grid-cols-2 gap-2 text-left bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs mb-5">
                    <div>
                      <span className="text-slate-500 block text-[10px]">PLAN</span>
                      <span className="font-semibold text-white">{lastRegisteredMember.plan}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">VALID UNTIL</span>
                      <span className="font-semibold text-emerald-400">{lastRegisteredMember.expiryDate}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleTestScanMember(lastRegisteredMember)}
                      className="w-full py-2.5 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                    >
                      <ScanIcon />
                      <span>Test Scan This Pass Now</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => window.print()}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 transition"
                      >
                        <PrinterIcon />
                        <span>Print Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={downloadQrCode}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 transition"
                      >
                        <DownloadIcon />
                        <span>Save Image</span>
                      </button>
                    </div>
                  </div>
                  <div className="hidden" aria-hidden="true">
                    <QRCodeCanvas ref={downloadQrRef} value={lastRegisteredMember.id} size={400} />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[420px]">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 mb-4">
                    <QrIcon />
                  </div>
                  <h3 className="text-slate-300 font-medium">No Pass Generated Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Complete the customer form on the left to generate and preview their digital gym barcode.
                  </p>
                </div>
              )}
            </div>

          </div>
  );
}
