import { QRCodeCanvas } from "qrcode.react";

export default function MemberQrCode({ memberId, size }: { memberId: string; size: number }) {
  return (
    <QRCodeCanvas
      value={memberId}
      size={size}
      bgColor="#ffffff"
      fgColor="#0f172a"
      includeMargin
    />
  );
}
