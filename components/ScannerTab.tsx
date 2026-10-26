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
              <div className="bg-white/90 border border-[#c4c9df]/60 rounded-2xl p-4 sm:p-6 shadow-xl shadow-[#e4e6f0]/30">
                <h2 className="text-lg font-bold text-[#151d3d] mb-2 flex items-start gap-2">
                  <ScanIcon />
                  <span>Front Desk Scan Hub</span>
                </h2>
                <p className="text-xs text-[#5d70c7] mb-4">
                  Type a Member ID, scan with camera, or select a member pass to test check-in.
                </p>

                {/* Quick Simulator Dropdown */}
                <div className="mb-4 p-3 bg-white rounded-xl border border-[#e4e6f0]">
                  <label className="block text-[11px] font-semibold text-[#5d70c7] uppercase tracking-wider mb-1.5">
                  Test Simulator (Select Member)
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setScannedIdInput(e.target.value);
                        performScan(e.target.value);
                      }
                    }}
                    className="w-full bg-white border border-[#d4d8ea] rounded-lg px-3 py-2 text-xs text-[#151d3d] focus:outline-none focus:border-[#5d70c7]"
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
                    className="flex-1 bg-white border border-[#e4e6f0] rounded-xl px-4 py-2.5 text-sm text-[#151d3d] placeholder-[#8795db] focus:outline-none focus:border-[#5d70c7]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#5d70c7] hover:bg-[#6f80d2] text-[#151d3d] font-bold rounded-xl text-sm transition"
                  >
                    Verify Pass
                  </button>
                </form>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t border-[#e4e6f0]">
                  <span className="text-xs text-[#5d70c7]">Webcam Scanner Feed:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCameraFacing("environment")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        cameraFacing === "environment"
                          ? "bg-[#5d70c7] text-[#151d3d]"
                          : "bg-[#e4e6f0] text-[#151d3d] hover:bg-[#d4d8ea]"
                      }`}
                    >
                      Back Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => setCameraFacing("user")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        cameraFacing === "user"
                          ? "bg-[#5d70c7] text-[#151d3d]"
                          : "bg-[#e4e6f0] text-[#151d3d] hover:bg-[#d4d8ea]"
                      }`}
                    >
                      Front Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCameraActive(!isCameraActive)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        isCameraActive
                          ? "bg-[#f26173]/20 text-[#f26173] border border-[#f26173]/30"
                          : "bg-[#e4e6f0] text-[#151d3d] hover:bg-[#d4d8ea]"
                      }`}
                    >
                      {isCameraActive ? "Stop Camera" : "Start Live Webcam"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Webcam Feed Box */}
              {isCameraActive && (
                <div className="bg-white/90 border border-[#c4c9df]/60 rounded-2xl p-3 sm:p-4 overflow-hidden text-center">
                  <div className="relative aspect-[4/3] bg-white rounded-xl overflow-hidden border border-[#e4e6f0] flex items-center justify-center">
                    <div
                      id="member-qr-reader"
                      className={`w-full h-full min-h-72 sm:min-h-[28rem] ${
                        cameraFacing === "user" ? "front-camera-preview" : ""
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-[#8795db] mt-2">
                    Position the member&apos;s QR code in front of the lens.
                  </p>
                </div>
              )}

            </div>

            {/* Check-in Pass Verification Result Card (6 cols) */}
            <div className="lg:col-span-6">
              {scannedResult ? (
                <div
                  className={`bg-white border-2 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden transition-all duration-300 ${
                    isMemberActive(scannedResult.expiryDate, referenceDate)
                      ? "border-[#5d70c7] shadow-[#5d70c7]/10"
                      : "border-[#f26173] shadow-[#f26173]/10"
                  }`}
                >
                  {/* Status Banner */}
                  <div
                    className={`py-3 px-4 rounded-xl flex items-center justify-between mb-6 ${
                      isMemberActive(scannedResult.expiryDate, referenceDate)
                        ? "bg-[#5d70c7]/10 border border-[#5d70c7]/30 text-[#6f80d2]"
                        : "bg-[#f26173]/10 border border-[#f26173]/30 text-[#f26173]"
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
                          ? "bg-[#5d70c7] text-[#151d3d]"
                          : "bg-[#f26173] text-[#151d3d]"
                      }`}
                    >
                      {isMemberActive(scannedResult.expiryDate, referenceDate) ? "ACTIVE" : "EXPIRED"}
                    </span>
                  </div>

                  {/* Member Profile Card */}
                  <div className="flex items-start gap-3 sm:gap-4 mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-gradient-to-tr from-[#e4e6f0] to-[#d4d8ea] flex items-center justify-center text-[#151d3d] text-xl font-bold border border-[#d4d8ea]">
                      {scannedResult.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#151d3d] break-words">{scannedResult.name}</h3>
                      <p className="text-xs text-[#5d70c7]">{scannedResult.email}</p>
                      <p className="text-xs text-[#5d70c7] mt-0.5">{scannedResult.phone}</p>
                    </div>
                  </div>

                  {/* Pass Details Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 bg-white rounded-xl border border-[#e4e6f0]">
                      <span className="text-[10px] text-[#8795db] font-bold uppercase tracking-wider block">
                        MEMBER ID
                      </span>
                      <span className="font-mono text-sm font-bold text-[#151d3d]">{scannedResult.id}</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#e4e6f0]">
                      <span className="text-[10px] text-[#8795db] font-bold uppercase tracking-wider block">
                        MEMBERSHIP PLAN
                      </span>
                      <span className="text-sm font-bold text-[#6f80d2]">{scannedResult.plan}</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#e4e6f0]">
                      <span className="text-[10px] text-[#8795db] font-bold uppercase tracking-wider block">
                        EXPIRATION DATE
                      </span>
                      <span className="text-sm font-bold text-[#151d3d]">{scannedResult.expiryDate}</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#e4e6f0]">
                      <span className="text-[10px] text-[#8795db] font-bold uppercase tracking-wider block">
                        DAYS REMAINING
                      </span>
                      <span
                        className={`text-sm font-black ${
                          getDaysRemaining(scannedResult.expiryDate, referenceDate) >= 0
                            ? "text-[#6f80d2]"
                            : "text-[#f26173]"
                        }`}
                      >
                        {getDaysRemaining(scannedResult.expiryDate, referenceDate) >= 0
                          ? `${getDaysRemaining(scannedResult.expiryDate, referenceDate)} Days`
                          : `Expired (${Math.abs(getDaysRemaining(scannedResult.expiryDate, referenceDate))} days ago)`}
                      </span>
                    </div>
                  </div>

                  {/* Total Visits Counter */}
                  <div className="flex items-center justify-between text-xs text-[#5d70c7] bg-white/70 p-3 rounded-xl border border-[#e4e6f0]/80 mb-6">
                    <span>Total Gym Check-ins Logged:</span>
                    <span className="font-mono font-bold text-[#151d3d] text-sm">{scannedResult.checkIns || 1}</span>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      setScannedResult(null);
                      setScannedIdInput("");
                      setScanMessage(null);
                    }}
                    className="w-full py-3 bg-[#e4e6f0] hover:bg-[#d4d8ea] text-[#151d3d] font-bold rounded-xl text-sm transition"
                  >
                    Clear & Ready for Next Check-in
                  </button>
                </div>
              ) : (
                <div className="bg-white/70 border border-dashed border-[#e4e6f0] rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[380px]">
                  <div className="w-16 h-16 rounded-full bg-[#e4e6f0] flex items-center justify-center text-[#8795db] mb-4">
                    <ScanIcon />
                  </div>
                  <h3 className="text-[#151d3d] font-medium">Awaiting Pass Scan</h3>
                  <p className="text-xs text-[#8795db] mt-1 max-w-xs">
                    Use the manual lookup input or test simulator on the left to verify member status.
                  </p>
                  {scanMessage && scanMessage.type === "ERROR" && (
                    <div className="mt-4 p-3 bg-[#f26173]/10 border border-[#f26173]/30 text-[#f26173] rounded-xl text-xs">
                      {scanMessage.text}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
  );
}
