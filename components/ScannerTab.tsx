import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Html5Qrcode } from "html5-qrcode";
import type { Member, ScanMessage, ScanResult } from "@/lib/gym-members";
import { CheckCircleIcon, ScanIcon, XCircleIcon } from "@/components/icons";
import { getDaysRemaining, isMemberActive } from "@/lib/gym-members";

export default function ScannerTab({ members, scannedIdInput, setScannedIdInput, performScan, isCameraActive, setIsCameraActive, scannedResult, setScannedResult, scanMessage, setScanMessage, referenceDate }: {
  members: Member[]; scannedIdInput: string; setScannedIdInput: Dispatch<SetStateAction<string>>; performScan: (memberId?: string) => void;
  isCameraActive: boolean; setIsCameraActive: Dispatch<SetStateAction<boolean>>;
  scannedResult: ScanResult | null; setScannedResult: Dispatch<SetStateAction<ScanResult | null>>;
  scanMessage: ScanMessage; setScanMessage: Dispatch<SetStateAction<ScanMessage>>; referenceDate: string;
}) {
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastDecodedTextRef = useRef("");
  const performScanRef = useRef(performScan);

  useEffect(() => {
    performScanRef.current = performScan;
  }, [performScan]);

  useEffect(() => {
    if (!isCameraActive) return;

    const scanner = new Html5Qrcode("member-qr-reader");
    scannerRef.current = scanner;
    lastDecodedTextRef.current = "";

    const handleDecodedText = (decodedText: string) => {
      if (decodedText === lastDecodedTextRef.current) return;
      lastDecodedTextRef.current = decodedText;
      setScannedIdInput(decodedText);
      performScanRef.current(decodedText);
    };

    const startScanner = async () => {
      const cameras = await Html5Qrcode.getCameras();
      if (cameras.length === 0) {
        throw new Error("No camera was found on this device.");
      }

      const cameraPattern =
        cameraFacing === "environment"
          ? /back|rear|environment/i
          : /front|user|facetime/i;
      const preferredCamera = cameras.find((camera) => cameraPattern.test(camera.label));
      const scanConfig = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.85);
          return { width: Math.min(size, 420), height: Math.min(size, 420) };
        },
      };
      const applyPreviewTransform = () => {
        const video = document.querySelector<HTMLVideoElement>("#member-qr-reader video");
        if (video) {
          video.style.transform = cameraFacing === "user" ? "scaleX(-1)" : "none";
        }
      };

      try {
        await scanner.start(
          { facingMode: cameraFacing },
          scanConfig,
          handleDecodedText,
          () => {
            // Decode failures are expected between successful scans.
          }
        );
        applyPreviewTransform();
      } catch (error: unknown) {
        if (!preferredCamera) throw error;

        await scanner.start(
          preferredCamera.id,
          scanConfig,
          handleDecodedText,
          () => {
            // Decode failures are expected between successful scans.
          }
        );
        applyPreviewTransform();
      }
    };

    startScanner()
      .catch((error: unknown) => {
        console.error("Unable to start QR scanner:", error);
        setScanMessage({
          type: "ERROR",
          text: error instanceof Error
            ? error.message
            : "Unable to access the camera. Check browser permissions and try again.",
        });
        setIsCameraActive(false);
      });

    return () => {
      const activeScanner = scannerRef.current;
      scannerRef.current = null;
      if (activeScanner) {
        activeScanner
          .stop()
          .catch((error: unknown) => {
            console.warn("Unable to stop QR scanner cleanly:", error);
          })
          .finally(() => activeScanner.clear());
      }
    };
  }, [cameraFacing, isCameraActive, setIsCameraActive, setScanMessage, setScannedIdInput]);

  return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
            
            {/* Scanner Controls & Camera Feed (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Manual Lookup & Simulator Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-2 flex items-start gap-2">
                  <ScanIcon />
                  <span>Front Desk Scan Hub</span>
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Type a Member ID, scan with camera, or select a member pass to test check-in.
                </p>

                {/* Quick Simulator Dropdown */}
                <div className="mb-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    ⚡ Quick Test Simulator (Select Member)
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setScannedIdInput(e.target.value);
                        performScan(e.target.value);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Choose a registered member to simulate scan --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) - {isMemberActive(m.expiryDate, referenceDate) ? "Active" : "Expired"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Manual Text Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    performScan();
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <input
                    type="text"
                    placeholder="Enter Member ID (e.g. GYM-1234-A)"
                    value={scannedIdInput}
                    onChange={(e) => setScannedIdInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition"
                  >
                    Verify Pass
                  </button>
                </form>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Webcam Scanner Feed:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCameraFacing("environment")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        cameraFacing === "environment"
                          ? "bg-cyan-500 text-slate-950"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Back Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => setCameraFacing("user")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        cameraFacing === "user"
                          ? "bg-cyan-500 text-slate-950"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Front Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCameraActive(!isCameraActive)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isCameraActive
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {isCameraActive ? "Stop Camera" : "Start Live Webcam"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Webcam Feed Box */}
              {isCameraActive && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 overflow-hidden text-center">
                  <div className="relative aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                    <div
                      id="member-qr-reader"
                      className={`w-full h-full min-h-72 sm:min-h-[28rem] ${
                        cameraFacing === "user" ? "front-camera-preview" : ""
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Position the member&apos;s QR code in front of the lens.
                  </p>
                </div>
              )}

            </div>

            {/* Check-in Pass Verification Result Card (6 cols) */}
            <div className="lg:col-span-6">
              {scannedResult ? (
                <div
                  className={`bg-slate-900 border-2 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden transition-all duration-300 ${
                    isMemberActive(scannedResult.expiryDate, referenceDate)
                      ? "border-emerald-500 shadow-emerald-500/10"
                      : "border-rose-500 shadow-rose-500/10"
                  }`}
                >
                  {/* Status Banner */}
                  <div
                    className={`py-3 px-4 rounded-xl flex items-center justify-between mb-6 ${
                      isMemberActive(scannedResult.expiryDate, referenceDate)
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {isMemberActive(scannedResult.expiryDate, referenceDate) ? <CheckCircleIcon /> : <XCircleIcon />}
                      <span className="font-extrabold text-sm tracking-wider uppercase">
                        {isMemberActive(scannedResult.expiryDate, referenceDate) ? "ACCESS GRANTED" : "ACCESS DENIED"}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        isMemberActive(scannedResult.expiryDate, referenceDate)
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {isMemberActive(scannedResult.expiryDate, referenceDate) ? "ACTIVE" : "EXPIRED"}
                    </span>
                  </div>

                  {/* Member Profile Card */}
                  <div className="flex items-start gap-3 sm:gap-4 mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-slate-300 text-xl font-bold border border-slate-700">
                      {scannedResult.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white break-words">{scannedResult.name}</h3>
                      <p className="text-xs text-slate-400">{scannedResult.email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{scannedResult.phone}</p>
                    </div>
                  </div>

                  {/* Pass Details Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        MEMBER ID
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-200">{scannedResult.id}</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        MEMBERSHIP PLAN
                      </span>
                      <span className="text-sm font-bold text-cyan-400">{scannedResult.plan}</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        EXPIRATION DATE
                      </span>
                      <span className="text-sm font-bold text-slate-200">{scannedResult.expiryDate}</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        DAYS REMAINING
                      </span>
                      <span
                        className={`text-sm font-black ${
                          getDaysRemaining(scannedResult.expiryDate, referenceDate) >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {getDaysRemaining(scannedResult.expiryDate, referenceDate) >= 0
                          ? `${getDaysRemaining(scannedResult.expiryDate, referenceDate)} Days`
                          : `Expired (${Math.abs(getDaysRemaining(scannedResult.expiryDate, referenceDate))} days ago)`}
                      </span>
                    </div>
                  </div>

                  {/* Total Visits Counter */}
                  <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 mb-6">
                    <span>Total Gym Check-ins Logged:</span>
                    <span className="font-mono font-bold text-white text-sm">{scannedResult.checkIns || 1}</span>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      setScannedResult(null);
                      setScannedIdInput("");
                      setScanMessage(null);
                    }}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition"
                  >
                    Clear & Ready for Next Check-in
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[380px]">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 mb-4">
                    <ScanIcon />
                  </div>
                  <h3 className="text-slate-300 font-medium">Awaiting Pass Scan</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Use the manual lookup input or test simulator on the left to verify member status.
                  </p>
                  {scanMessage && scanMessage.type === "ERROR" && (
                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs">
                      {scanMessage.text}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
  );
}
