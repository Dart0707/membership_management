import { useRef, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { QRCodeCanvas } from "qrcode.react";
import type { Member, MemberFormData, MembershipPlan } from "@/lib/gym-members";
import { CheckCircleIcon, DownloadIcon, PrinterIcon, QrIcon, ScanIcon, UserPlusIcon } from "@/components/icons";
import { ACTIVITIES, calculateExpiryDate, DEFAULT_MEMBERSHIP_PLANS, getPlanPrice } from "@/lib/gym-members";
import MemberQrCode from "@/components/MemberQrCode";
import CustomPlanModal from "@/components/CustomPlanModal";

export default function RegistrationTab({
  formData,
  setFormData,
  handleRegisterSubmit,
  lastRegisteredMember,
  handleTestScanMember,
  referenceDate,
  plans = DEFAULT_MEMBERSHIP_PLANS,
  onAddCustomPlan,
  onDeleteCustomPlan, // <-- NEW PROP
}: {
  formData: MemberFormData;
  setFormData: Dispatch<SetStateAction<MemberFormData>>;
  handleRegisterSubmit: (event: FormEvent<HTMLFormElement>) => void;
  lastRegisteredMember: Member | null;
  handleTestScanMember: (member: Member) => void;
  referenceDate: string;
  plans?: MembershipPlan[];
  onAddCustomPlan?: (plan: MembershipPlan) => void;
  onDeleteCustomPlan?: (title: string) => void; // <-- NEW PROP
}) {
  const downloadQrRef = useRef<HTMLCanvasElement>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const activityPlans = plans.filter(
    (p) => p.activity === "ALL" || p.activity === formData.activity
  );
  const selectedPlan =
    activityPlans.find((p) => p.title === formData.plan) || activityPlans[0];

  const downloadQrCode = () => {
    const canvas = downloadQrRef.current;
    if (!canvas || !lastRegisteredMember) return;

    const link = document.createElement("a");
    link.download = `${lastRegisteredMember.id}-QR.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
      {/* Registration Form (7 cols) */}
      <div className="lg:col-span-7 bg-white/90 border border-[#c4c9df]/60 rounded-2xl p-4 sm:p-6 shadow-xl shadow-[#e4e6f0]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#f26173]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-[#151d3d] flex items-start gap-2">
            <UserPlusIcon />
            <span>Register New Gym Member</span>
          </h2>
          <p className="text-sm text-[#5d70c7] mt-1">
            Fill in customer details to issue an instant digital QR membership pass.
          </p>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#151d3d] mb-1">
              Full Name <span className="text-[#6f80d2]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Joshua Sales"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white border border-[#e4e6f0] rounded-xl px-4 py-2.5 text-[#151d3d] placeholder-[#8795db] focus:outline-none focus:border-[#5d70c7] focus:ring-1 focus:ring-[#5d70c7] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151d3d] mb-1">
                Email Address <span className="text-[#6f80d2]">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="joshua.sales@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white border border-[#e4e6f0] rounded-xl px-4 py-2.5 text-[#151d3d] placeholder-[#8795db] focus:outline-none focus:border-[#5d70c7] focus:ring-1 focus:ring-[#5d70c7] transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151d3d] mb-1">
                  Activity <span className="text-[#6f80d2]">*</span>
                </label>
                <select
                  value={formData.activity}
                  onChange={(e) => {
                    const nextActivity = e.target.value as MemberFormData["activity"];
                    const currentPlanObj = plans.find((p) => p.title === formData.plan);
                    const nextPlanTitle =
                      currentPlanObj &&
                      (currentPlanObj.activity === "ALL" ||
                        currentPlanObj.activity === nextActivity)
                        ? formData.plan
                        : "1 Month";
                    setFormData({
                      ...formData,
                      activity: nextActivity,
                      plan: nextPlanTitle,
                    });
                  }}
                  className="w-full bg-white border border-[#e4e6f0] rounded-xl px-4 py-2.5 text-[#151d3d] focus:outline-none focus:border-[#5d70c7]"
                >
                  {ACTIVITIES.map((activity) => (
                    <option key={activity} value={activity}>
                      {activity}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-[#151d3d]">
                <input
                  type="checkbox"
                  checked={formData.isStudent}
                  onChange={(e) => setFormData({ ...formData, isStudent: e.target.checked })}
                  className="h-4 w-4 accent-[#5d70c7]"
                />
                Student discount
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151d3d] mb-1">
                Phone Number <span className="text-[#6f80d2]">*</span>
              </label>
              <input
                type="tel"
                required
                inputMode="tel"
                pattern="^09[0-9]{9}$"
                title="Use an 11-digit Philippine number starting with 09, such as 09171234567."
                placeholder="09171234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white border border-[#e4e6f0] rounded-xl px-4 py-2.5 text-[#151d3d] placeholder-[#8795db] focus:outline-none focus:border-[#5d70c7] focus:ring-1 focus:ring-[#5d70c7] transition"
              />
            </div>
          </div>

          {/* Plan Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151d3d]">
                Membership Tier <span className="text-[#6f80d2]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(true)}
                className="text-xs font-bold text-[#5d70c7] hover:text-[#151d3d] bg-[#5d70c7]/10 hover:bg-[#5d70c7]/20 px-2.5 py-1 rounded-lg transition"
              >
                + Add Custom Promo
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {activityPlans.map((p) => (
                <div
                  key={p.title}
                  role="button"
                  onClick={() => setFormData({ ...formData, plan: p.title })}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between group ${
                    formData.plan === p.title
                      ? "bg-[#5d70c7]/10 border-[#5d70c7] text-[#151d3d] ring-1 ring-[#5d70c7]"
                      : "bg-white border-[#e4e6f0] text-[#5d70c7] hover:border-[#d4d8ea]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="font-bold text-sm text-[#151d3d] leading-tight pr-1">
                      {p.title}
                    </div>
                    {/* Tags and Delete Button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.isCustom && (
                        <>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#5d70c7]/15 text-[#5d70c7] font-semibold">
                            Promo
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents selecting the plan when clicking delete
                              if (confirm(`Are you sure you want to delete the "${p.title}" promo?`)) {
                                onDeleteCustomPlan?.(p.title);
                              }
                            }}
                            className="text-[#8795db] hover:text-[#f26173] hover:bg-[#f26173]/10 p-0.5 rounded transition opacity-50 group-hover:opacity-100"
                            title="Delete Promo"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-[#6f80d2] font-semibold mt-1.5">
                    Php{getPlanPrice(formData.activity, p.title, formData.isStudent, plans).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#8795db] mt-0.5">{p.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Calculated Expiry Display */}
          <div className="p-3 bg-white rounded-xl border border-[#e4e6f0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
            <span className="text-[#5d70c7]">
              {formData.plan === "Daily Pass"
                ? "Daily Pass Valid Until:"
                : selectedPlan?.promoType === "daily_pass"
                ? `Pass Bundle (${selectedPlan.passCount} Passes) Valid Until:`
                : "Calculated Expiry Date:"}
            </span>
            <span className="font-mono text-[#6f80d2] font-bold text-sm">
              {formData.plan === "Daily Pass"
                ? `${calculateExpiryDate(formData.plan, referenceDate, plans)} at 11:59 PM`
                : calculateExpiryDate(formData.plan, referenceDate, plans)}
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-[#5d70c7] hover:bg-[#6f80d2] text-[#151d3d] font-extrabold rounded-xl shadow-lg shadow-[#5d70c7]/20 transition transform active:scale-[0.99] flex items-center justify-center space-x-2"
          >
            <QrIcon />
            <span>Generate Member Pass & QR Code</span>
          </button>
        </form>
      </div>

      {/* Generated QR Pass Preview Card (5 cols) */}
      <div className="lg:col-span-5">
        {lastRegisteredMember ? (
          <div className="bg-white/90 border border-[#c4c9df]/60 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-[#e4e6f0]/30 relative text-center">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#5d70c7]/10 text-[#6f80d2] border border-[#5d70c7]/30 rounded-full text-xs font-semibold mb-4">
              <CheckCircleIcon />
              <span>Member Successfully Registered!</span>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-xl inline-block shadow-inner mb-4 border border-white">
              <MemberQrCode memberId={lastRegisteredMember.id} size={200} />
              <div className="mt-2 text-[#151d3d] font-mono font-bold text-sm tracking-wider">
                {lastRegisteredMember.id}
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-[#151d3d]">{lastRegisteredMember.name}</h3>
            <p className="text-xs text-[#5d70c7] mb-3">{lastRegisteredMember.email}</p>

            <div className="grid grid-cols-2 gap-2 text-left bg-white p-3 rounded-xl border border-[#e4e6f0] text-xs mb-5">
              <div>
                <span className="text-[#8795db] block text-[10px]">PLAN</span>
                <span className="font-semibold text-[#151d3d]">
                  {lastRegisteredMember.plan}
                  {lastRegisteredMember.remainingPasses != null && (
                    <span className="block text-[10px] text-[#5d70c7]">
                      {lastRegisteredMember.remainingPasses} passes left
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-[#8795db] block text-[10px]">VALID UNTIL</span>
                <span className="font-semibold text-[#6f80d2]">{lastRegisteredMember.expiryDate}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleTestScanMember(lastRegisteredMember)}
                className="w-full py-2.5 px-3 bg-[#5d70c7] hover:bg-[#6f80d2] text-[#151d3d] font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
              >
                <ScanIcon />
                <span>Test Scan This Pass Now</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => window.print()}
                  className="py-2 px-3 bg-[#e4e6f0] hover:bg-[#d4d8ea] text-[#151d3d] rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 transition"
                >
                  <PrinterIcon />
                  <span>Print Pass</span>
                </button>
                <button
                  type="button"
                  onClick={downloadQrCode}
                  className="py-2 px-3 bg-[#e4e6f0] hover:bg-[#d4d8ea] text-[#151d3d] rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 transition"
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
          <div className="bg-white/70 border border-dashed border-[#e4e6f0] rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[420px]">
            <div className="w-16 h-16 rounded-full bg-[#e4e6f0] flex items-center justify-center text-[#8795db] mb-4">
              <QrIcon />
            </div>
            <h3 className="text-[#151d3d] font-medium">No Pass Generated Yet</h3>
            <p className="text-xs text-[#8795db] mt-1 max-w-xs">
              Complete the customer form on the left to generate and preview their digital gym barcode.
            </p>
          </div>
        )}
      </div>

      <CustomPlanModal
        key={isPlanModalOpen ? formData.activity : "closed"}
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        defaultActivity={formData.activity}
        existingPlans={plans}
        onCreatePlan={(newPlan) => {
          onAddCustomPlan?.(newPlan);
          setFormData({
            ...formData,
            activity: newPlan.activity === "ALL" ? formData.activity : newPlan.activity,
            plan: newPlan.title,
          });
        }}
      />
    </div>
  );
}