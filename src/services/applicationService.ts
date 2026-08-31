import { collection, doc, addDoc, getDocs, getDoc, updateDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Application, ApplicationStatus } from '@/types';

function toApplication(id: string, data: Record<string, unknown>): Application {
  return {
    id,
    ownerEmail: data.ownerEmail as string ?? '',
    ownerId: data.ownerId as string ?? '',
    instrumentName: data.instrumentName as string ?? '',
    instrumentType: data.instrumentType as string ?? '',
    serialNumber: data.serialNumber as string ?? '',
    location: data.location as string ?? '',
    status: (data.status as ApplicationStatus) ?? 'pending',
    aiFlagged: data.aiFlagged as boolean ?? false,
    aiRawResult: data.aiRawResult as string ?? '',
    submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : null,
    reviewedBy: data.reviewedBy as string,
    reviewedAt: data.reviewedAt instanceof Timestamp ? data.reviewedAt.toDate() : undefined,
    inspectorNotes: data.inspectorNotes as string,
    // Assignment fields
    assignedOfficerId: data.assignedOfficerId as string ?? undefined,
    assignedOfficerName: data.assignedOfficerName as string ?? undefined,
    assignedDate: data.assignedDate as string ?? undefined,
    assignedBy: data.assignedBy as string ?? undefined,
    assignedAt: data.assignedAt instanceof Timestamp ? data.assignedAt.toDate() : undefined,
  };
}

export async function createApplication(data: Omit<Application, 'id' | 'submittedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'applications'), {
    ...data,
    submittedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getApplicationsByOwner(ownerId: string): Promise<Application[]> {
  const q = query(
    collection(db, 'applications'),
    where('ownerId', '==', ownerId),
    orderBy('submittedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => toApplication(d.id, d.data()));
}

export async function getAllApplications(): Promise<Application[]> {
  const q = query(collection(db, 'applications'), orderBy('submittedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => toApplication(d.id, d.data()));
}

export async function getPendingApplications(): Promise<Application[]> {
  const q = query(
    collection(db, 'applications'),
    where('status', '==', 'pending'),
    orderBy('submittedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => toApplication(d.id, d.data()));
}

export async function getApplicationById(id: string): Promise<Application | null> {
  const snap = await getDoc(doc(db, 'applications', id));
  if (!snap.exists()) return null;
  return toApplication(snap.id, snap.data());
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  reviewerEmail: string,
  notes?: string
): Promise<void> {
  await updateDoc(doc(db, 'applications', id), {
    status,
    reviewedBy: reviewerEmail,
    reviewedAt: serverTimestamp(),
    inspectorNotes: notes ?? '',
  });
}

export async function getFlaggedApplications(): Promise<Application[]> {
  const q = query(
    collection(db, 'applications'),
    where('aiFlagged', '==', true),
    orderBy('submittedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => toApplication(d.id, d.data()));
}

export async function getApprovedApplications(): Promise<Application[]> {
  const q = query(
    collection(db, 'applications'),
    where('status', '==', 'approved'),
    orderBy('submittedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => toApplication(d.id, d.data()));
}

export async function getDashboardStats() {
  const all = await getAllApplications();
  return {
    totalApplications: all.length,
    pendingApplications: all.filter(a => a.status === 'pending').length,
    approvedApplications: all.filter(a => a.status === 'approved').length,
    rejectedApplications: all.filter(a => a.status === 'rejected').length,
    flaggedApplications: all.filter(a => a.aiFlagged).length,
  };
}

export async function assignOfficerToApplication(
  applicationId: string,
  officerId: string,
  officerName: string,
  scheduledDate: string,
  assignedByEmail: string
): Promise<void> {
  await updateDoc(doc(db, 'applications', applicationId), {
    status: 'assigned',
    assignedOfficerId: officerId,
    assignedOfficerName: officerName,
    assignedDate: scheduledDate,
    assignedBy: assignedByEmail,
    assignedAt: serverTimestamp(),
  });
}
