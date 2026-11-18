import { useState, type FormEvent } from "react";
import { ACTIVITIES, type Activity, type MembershipPlan } from "@/lib/gym-members";

export default function CustomPlanModal({
  isOpen,
  onClose,
  defaultActivity,
  existingPlans,
  onCreatePlan,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultActivity: Activity;
  existingPlans: MembershipPlan[];
  onCreatePlan: (newPlan: MembershipPlan) => void;
}) {
  const [customTitle, setCustomTitle] = useState("");
  const [customActivity, setCustomActivity] = useState<Activity>(defaultActivity);
  const [promoType, setPromoType] = useState<"daily_pass" | "time_based">("daily_pass");
  const [passCount, setPassCount] = useState("10");
  const [timeUnit, setTimeUnit] = useState<"days" | "months">("months");
  const [timeValue, setTimeValue] = useState("3");
  const [customPrice, setCustomPrice] = useState("");
  const [customStudentPrice, setCustomStudentPrice] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const numericPrice = Number(customPrice);
    if (!numericPrice || numericPrice <= 0) {
      setModalError("Please enter a valid promo price.");
      return;
    }

    const numericStudentPrice =
      customStudentPrice.trim() !== "" ? Number(customStudentPrice) : null;

    let baseTitle = customTitle.trim();
    let durationDays = 0;
    let finalPassCount: number | null = null;
    let description = "";

    if (promoType === "daily_pass") {
      const count = Math.max(1, parseInt(passCount, 10) || 1);
      finalPassCount = count;
      durationDays = 360; // Pass bundles expire in 1 year (360 days)
      if (!baseTitle) {
        baseTitle = count === 1 ? "1 Daily Pass Promo" : `${count} Daily Passes`;
      }
      description = `${count} pass${count === 1 ? "" : "es"} • Valid 360 days`;
    } else {
      const val = Math.max(1, parseInt(timeValue, 10) || 1);
      if (timeUnit === "months") {
        durationDays = val * 30; // 1 month = 30 days
        if (!baseTitle) {
          baseTitle = val === 1 ? "1 Month Promo" : `${val} Months`;
        }
        description = `${durationDays} days (${val} mo)`;
      } else {
        durationDays = val;
        if (!baseTitle) {
          baseTitle = val === 1 ? "1 Day" : `${val} Days`;
        }
        description = `${durationDays} days access`;
      }
    }

    // Ensure the Primary Key (title) is always unique
    let uniqueTitle = baseTitle;
    const titleExists = (t: string) =>
      existingPlans.some((p) => p.title.toLowerCase() === t.toLowerCase());

    if (titleExists(uniqueTitle)) {
      if (!customTitle.trim() && !titleExists(`${baseTitle} (${customActivity})`)) {
        uniqueTitle = `${baseTitle} (${customActivity})`;
      } else {
        setModalError(
          `A plan named "${uniqueTitle}" already exists. Please enter a unique Promo Name.`
        );
        return;
      }
    }

    onCreatePlan({
      title: uniqueTitle,
      description,
      activity: customActivity,
      promoType,
      passCount: finalPassCount,
      durationDays,
      price: numericPrice,
      studentPrice: numericStudentPrice,
      isCustom: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#151d3d]/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#c4c9df] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#151d3d]">Create Custom Promo Plan</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#8795db] hover:text-[#151d3d]"
          >
            ✕ Close
          </button>
        </div>

        {modalError && (
          <div className="p-2.5 rounded-xl bg-[#f26173]/15 border border-[#f26173] text-xs text-[#151d3d] font-medium">
            {modalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#151d3d] mb-1">
              Lock to Activity <span className="text-[#6f80d2]">*</span>
            </label>
            <select
              value={customActivity}
              onChange={(e) => setCustomActivity(e.target.value as Activity)}
              className="w-full bg-white border border-[#e4e6f0] rounded-xl px-3 py-2 text-sm text-[#151d3d]"
            >
              {ACTIVITIES.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#151d3d] mb-1">
              Promo Type <span className="text-[#6f80d2]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPromoType("daily_pass")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                  promoType === "daily_pass"
                    ? "bg-[#5d70c7]/15 border-[#5d70c7] text-[#151d3d]"
                    : "bg-white border-[#e4e6f0] text-[#5d70c7]"
                }`}
              >
                Daily Pass Promo
              </button>
              <button
                type="button"
                onClick={() => setPromoType("time_based")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                  promoType === "time_based"
                    ? "bg-[#5d70c7]/15 border-[#5d70c7] text-[#151d3d]"
                    : "bg-white border-[#e4e6f0] text-[#5d70c7]"
                }`}
              >
                Time-Based Promo
              </button>
            </div>
          </div>

          {promoType === "daily_pass" ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151d3d] mb-1">
                Number of Daily Passes <span className="text-[#6f80d2]">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={passCount}
                onChange={(e) => setPassCount(e.target.value)}
                className="w-full bg-white border border-[#e4e6f0] rounded-xl px-3 py-2 text-sm text-[#151d3d]"
              />
              <p className="text-[11px] text-[#8795db] mt-1">
                Expires in 1 year (360 days) and deducts 1 pass per attendance day. Repeat scans on the same day use no extra pass.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151d3d] mb-1">
                  Duration Unit
                </label>
                <select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value as "days" | "months")}
                  className="w-full bg-white border border-[#e4e6f0] rounded-xl px-3 py-2 text-sm text-[#151d3d]"
                >
                  <option value="months">Months (1 mo = 30d)</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#151d3d] mb-1">
                  Number of {timeUnit === "months" ? "Months" : "Days"} <span className="text-[#6f80d2]">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                  className="w-full bg-white border border-[#e4e6f0] rounded-xl px-3 py-2 text-sm text-[#151d3d]"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151d3d] mb-1">
                Promo Price (Php) <span className="text-[#6f80d2]">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                placeholder="e.g. 2500"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full bg-white border border-[#e4e6f0] rounded-xl px-3 py-2 text-sm text-[#151d3d]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#151d3d] mb-1">
                Student Price (Optional)
              </label>
              <input
                type="number"
                min={1}
                placeholder="Leave blank if same"
                value={customStudentPrice}
                onChange={(e) => setCustomStudentPrice(e.target.value)}
                className="w-full bg-white border border-[#e4e6f0] rounded-xl px-3 py-2 text-sm text-[#151d3d]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#151d3d] mb-1">
              Promo Name (Optional — Must be unique)
            </label>
            <input
              type="text"
              placeholder={
                promoType === "daily_pass"
                  ? `Auto: ${passCount || 10} Daily Passes`
                  : `Auto: ${timeValue || 3} ${timeUnit === "months" ? "Months" : "Days"}`
              }
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full bg-white border border-[#e4e6f0] rounded-xl px-3 py-2 text-sm text-[#151d3d]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#e4e6f0] text-[#151d3d] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#5d70c7] hover:bg-[#6f80d2] text-[#151d3d] text-xs font-bold"
            >
              Save Promo Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}