import {
  CircleCheck,
  CircleX,
  Database,
  Download,
  Printer,
  QrCode,
  Scan,
  UserPlus,
} from "lucide-react";

export const QrIcon = () => <QrCode className="w-5 h-5" />;

export const UserPlusIcon = () => <UserPlus className="w-5 h-5" />;

export const ScanIcon = () => <Scan className="w-5 h-5" />;

export const DatabaseIcon = () => <Database className="w-5 h-5" />;

export const CheckCircleIcon = () => <CircleCheck className="w-6 h-6 text-emerald-400" />;

export const XCircleIcon = () => <CircleX className="w-6 h-6 text-rose-400" />;

export const PrinterIcon = () => <Printer className="w-4 h-4" />;

export const DownloadIcon = () => <Download className="w-4 h-4" />;
