import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return format(date, 'dd MMM yyyy');
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return '—';
  return format(date, 'dd MMM yyyy, hh:mm a');
}

export function formatRelative(date: Date | null | undefined): string {
  if (!date) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':      return 'badge badge-pending';
    case 'approved':     return 'badge badge-approved';
    case 'rejected':     return 'badge badge-rejected';
    case 'under_review': return 'badge badge-blue';
    case 'assigned':     return 'badge badge-assigned';
    case 'flagged':      return 'badge badge-flagged';
    default:             return 'badge badge-gray';
  }
}

export function parseAIResult(raw: string): {
  detectedSerial: string;
  match: string;
  tamperSigns: string;
  reason: string;
} {
  const lines = raw.split('\n');
  const get = (key: string) => {
    for (const line of lines) {
      const cleaned = line.replace(/^\*+|\*+$/g, '').trim();
      if (cleaned.toUpperCase().startsWith(key.toUpperCase())) {
        const colonIdx = cleaned.indexOf(':');
        if (colonIdx !== -1) {
          return cleaned.slice(colonIdx + 1).replace(/^\*+|\*+$/g, '').trim();
        }
      }
    }
    return '—';
  };
  return {
    detectedSerial: get('DETECTED_SERIAL'),
    match: get('MATCH'),
    tamperSigns: get('TAMPER_SIGNS'),
    reason: get('REASON'),
  };
}

export function generateCertificateUrl(docId: string): string {
  return `${window.location.origin}/verify/${docId}`;
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
