// Types for the entire application

export type UserRole = 'owner' | 'inspector' | 'admin' | 'public';

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt?: Date;
  phone?: string;
  organization?: string;
  district?: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'under_review' | 'assigned';

export interface Application {
  id: string;
  ownerEmail: string;
  ownerId: string;
  instrumentName: string;
  instrumentType: string;
  serialNumber: string;
  location: string;
  status: ApplicationStatus;
  aiFlagged: boolean;
  aiRawResult: string;
  submittedAt: Date | null;
  reviewedBy?: string;
  reviewedAt?: Date;
  inspectorNotes?: string;
  certificateUrl?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedDate?: string;
  assignedBy?: string;
  assignedAt?: Date;
}

export interface AIAnalysisResult {
  raw_result: string;
  flagged: boolean;
  detectedSerial?: string;
  match?: 'YES' | 'NO' | 'UNKNOWN';
  tamperSigns?: 'YES' | 'NO';
  reason?: string;
}

export interface Instrument {
  id: string;
  ownerId: string;
  name: string;
  type: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  location: string;
  capacity: string;
  lastVerified?: Date;
  nextVerificationDue?: Date;
  status: 'active' | 'expired' | 'pending';
  registeredAt: Date;
}

export interface Certificate {
  id: string;
  applicationId: string;
  instrumentName: string;
  serialNumber: string;
  ownerEmail: string;
  issuedAt: Date;
  expiresAt: Date;
  status: 'valid' | 'expired';
  verifyUrl: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'critical';
  read: boolean;
  createdAt: Date;
  link?: string;
  relatedId?: string;
  relatedType?: 'application' | 'certificate';
}

export interface Officer {
  id: string;
  name: string;
  email?: string;
  role?: string;
  district: string;
  lat: number;
  lng: number;
  activeApplications: number;
  status: 'available' | 'busy';
  workload?: number;
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerEmail: string;
  instrumentName: string;
  instrumentType: string;
  serialNumber: string;
  price: number;
  condition: 'new' | 'good' | 'fair';
  description: string;
  location: string;
  isVerified: boolean;
  postedAt: Date;
  images: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetId: string;
  targetType: string;
  details: string;
  timestamp: Date;
  ipAddress: string;
}

export interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  flaggedApplications: number;
  totalUsers: number;
}
