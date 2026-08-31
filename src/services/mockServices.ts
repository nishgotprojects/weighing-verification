// Mock data services for features without backend APIs
// These are clearly separated and labelled as mock

import { Officer, MarketplaceListing, ChatMessage, AuditLog } from '@/types';

// ─── GIS Officers ──────────────────────────────────────────────────────────────
export const mockOfficers: Officer[] = [
  { id: 'off1', name: 'Rajesh Kumar', district: 'Chennai', lat: 13.0827, lng: 80.2707, activeApplications: 3, status: 'available' },
  { id: 'off2', name: 'Priya Sharma', district: 'Coimbatore', lat: 11.0168, lng: 76.9558, activeApplications: 7, status: 'busy' },
  { id: 'off3', name: 'Arjun Nair', district: 'Madurai', lat: 9.9252, lng: 78.1198, activeApplications: 2, status: 'available' },
  { id: 'off4', name: 'Sunita Devi', district: 'Trichy', lat: 10.7905, lng: 78.7047, activeApplications: 5, status: 'busy' },
  { id: 'off5', name: 'Vijay Mohan', district: 'Salem', lat: 11.6643, lng: 78.1460, activeApplications: 1, status: 'available' },
];

export function suggestOfficer(location: string): Officer {
  const available = mockOfficers.filter(o => o.status === 'available');
  return available.sort((a, b) => a.activeApplications - b.activeApplications)[0];
}

// ─── Marketplace ────────────────────────────────────────────────────────────────
export const mockListings: MarketplaceListing[] = [
  {
    id: 'ml1',
    sellerId: 'u1',
    sellerEmail: 'seller1@example.com',
    instrumentName: 'Platform Weighing Scale',
    instrumentType: 'Weighing Scale',
    serialNumber: 'WS-2021-00456',
    price: 45000,
    condition: 'good',
    description: 'Commercially verified platform scale, capacity 500kg. Used for 2 years. Certificate valid.',
    location: 'Chennai, Tamil Nadu',
    isVerified: true,
    postedAt: new Date('2026-08-20'),
    images: [],
  },
  {
    id: 'ml2',
    sellerId: 'u2',
    sellerEmail: 'seller2@example.com',
    instrumentName: 'Petrol Pump Dispenser',
    instrumentType: 'Flow Meter',
    serialNumber: 'FM-2022-09182',
    price: 120000,
    condition: 'new',
    description: 'Brand new fuel dispenser. Government approved model. Includes installation support.',
    location: 'Coimbatore, Tamil Nadu',
    isVerified: false,
    postedAt: new Date('2026-08-25'),
    images: [],
  },
  {
    id: 'ml3',
    sellerId: 'u3',
    sellerEmail: 'seller3@example.com',
    instrumentName: 'Jewellery Weighing Scale',
    instrumentType: 'Precision Balance',
    serialNumber: 'PB-2023-00321',
    price: 15000,
    condition: 'fair',
    description: 'Precision balance 0.001g accuracy. Calibrated and certified. Slight cosmetic wear.',
    location: 'Madurai, Tamil Nadu',
    isVerified: true,
    postedAt: new Date('2026-08-27'),
    images: [],
  },
];

// ─── Chatbot ────────────────────────────────────────────────────────────────────
const chatResponses: Record<string, string> = {
  'verify': 'To verify your instrument, go to **Apply for Verification** and submit your instrument details along with a clear photo. Our AI will pre-check the serial number and tampering before submission.',
  'certificate': 'Verification certificates are issued after an inspector approves your application. Valid for 1 year. You can download the certificate and QR code from **My Certificates**.',
  'serial': 'The serial number is the unique identifier on your instrument\'s nameplate. If not visible, the AI may flag it. Ensure the nameplate is clean and clearly photographed.',
  'fees': 'Verification fees are determined by the Legal Metrology Department based on instrument type and capacity. Contact your local LMO office for exact fee details.',
  'appeal': 'If your application is rejected, you can re-apply with updated documentation. Contact your LMO office to understand the specific reason for rejection.',
  'expire': 'Verification certificates typically expire after 1 year. You will receive a reminder 30 days before expiry. Re-apply using the same process.',
  'tamper': 'Tampering with a verified instrument is illegal under the Legal Metrology Act, 2009 and can result in fines and prosecution.',
  'inspector': 'A Legal Metrology Officer (LMO) will review your application and may conduct a physical inspection before approval.',
  'transfer': 'Ownership transfer of verified instruments must be reported to the LMO. Use the **Ownership Transfer** feature to initiate the process.',
  'default': 'I\'m the Legal Metrology Assistant. I can help with instrument verification, certificates, fees, and compliance questions. Please ask a specific question.',
};

export function getChatbotResponse(message: string): string {
  const msg = message.toLowerCase();
  for (const [key, response] of Object.entries(chatResponses)) {
    if (key !== 'default' && msg.includes(key)) return response;
  }
  return chatResponses['default'];
}

// ─── Audit Logs ─────────────────────────────────────────────────────────────────
export const mockAuditLogs: AuditLog[] = [
  { id: 'al1', action: 'APPLICATION_APPROVED', performedBy: 'inspector@lmo.gov', targetId: 'app123', targetType: 'application', details: 'Application approved after physical inspection', timestamp: new Date('2026-08-29T10:30:00'), ipAddress: '192.168.1.10' },
  { id: 'al2', action: 'USER_CREATED', performedBy: 'admin@lmo.gov', targetId: 'usr456', targetType: 'user', details: 'New inspector account created', timestamp: new Date('2026-08-28T14:00:00'), ipAddress: '192.168.1.5' },
  { id: 'al3', action: 'APPLICATION_REJECTED', performedBy: 'inspector@lmo.gov', targetId: 'app789', targetType: 'application', details: 'Rejected: tamper signs detected', timestamp: new Date('2026-08-27T16:45:00'), ipAddress: '192.168.1.10' },
  { id: 'al4', action: 'APPLICATION_SUBMITTED', performedBy: 'owner@example.com', targetId: 'app101', targetType: 'application', details: 'New verification application submitted', timestamp: new Date('2026-08-26T09:15:00'), ipAddress: '103.45.22.11' },
  { id: 'al5', action: 'CERTIFICATE_DOWNLOADED', performedBy: 'owner@example.com', targetId: 'cert202', targetType: 'certificate', details: 'Certificate downloaded', timestamp: new Date('2026-08-25T11:00:00'), ipAddress: '103.45.22.11' },
];

// ─── Digital Passport ────────────────────────────────────────────────────────────
export function generatePassportData(application: { instrumentName: string; instrumentType: string; serialNumber: string; location: string; submittedAt: Date | null; }) {
  return {
    instrumentName: application.instrumentName,
    instrumentType: application.instrumentType,
    serialNumber: application.serialNumber,
    manufacturer: 'Registered Manufacturer',
    manufactureYear: '2022',
    capacity: 'Standard Capacity',
    location: application.location,
    lastVerified: application.submittedAt,
    nextDue: application.submittedAt ? new Date(application.submittedAt.getFullYear() + 1, application.submittedAt.getMonth(), application.submittedAt.getDate()) : null,
    verificationHistory: [
      { year: '2024', status: 'Approved', officer: 'LMO Chennai' },
      { year: '2025', status: 'Approved', officer: 'LMO Chennai' },
    ],
  };
}
