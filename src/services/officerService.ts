import {
  collection, doc, getDocs, setDoc, updateDoc,
  query, increment, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Officer } from '@/types';

const COLLECTION = 'officers';

const SEED_OFFICERS: Omit<Officer, 'id'>[] = [
  { name: 'Rajesh Kumar', email: 'rajesh.kumar@lmo.gov.in', role: 'Senior Legal Metrology Officer', district: 'Chennai', lat: 13.0827, lng: 80.2707, activeApplications: 3, status: 'available', workload: 30 },
  { name: 'Priya Sharma', email: 'priya.sharma@lmo.gov.in', role: 'Legal Metrology Officer', district: 'Coimbatore', lat: 11.0168, lng: 76.9558, activeApplications: 7, status: 'busy', workload: 70 },
  { name: 'Arjun Nair', email: 'arjun.nair@lmo.gov.in', role: 'Legal Metrology Inspector', district: 'Madurai', lat: 9.9252, lng: 78.1198, activeApplications: 2, status: 'available', workload: 20 },
  { name: 'Sunita Devi', email: 'sunita.devi@lmo.gov.in', role: 'Legal Metrology Officer', district: 'Trichy', lat: 10.7905, lng: 78.7047, activeApplications: 5, status: 'busy', workload: 55 },
  { name: 'Vijay Mohan', email: 'vijay.mohan@lmo.gov.in', role: 'Legal Metrology Inspector', district: 'Salem', lat: 11.6643, lng: 78.1460, activeApplications: 1, status: 'available', workload: 10 },
  { name: 'Kavitha Rajan', email: 'kavitha.rajan@lmo.gov.in', role: 'Senior Legal Metrology Officer', district: 'Tirunelveli', lat: 8.7139, lng: 77.7567, activeApplications: 4, status: 'available', workload: 40 },
  { name: 'Mohan Das', email: 'mohan.das@gatc.gov.in', role: 'Government Approved Test Centre', district: 'Vellore', lat: 12.9165, lng: 79.1325, activeApplications: 6, status: 'busy', workload: 65 },
];

function toOfficer(id: string, data: Record<string, unknown>): Officer {
  return {
    id,
    name: data.name as string ?? '',
    email: data.email as string ?? undefined,
    role: data.role as string ?? undefined,
    district: data.district as string ?? '',
    lat: data.lat as number ?? 0,
    lng: data.lng as number ?? 0,
    activeApplications: data.activeApplications as number ?? 0,
    status: (data.status as 'available' | 'busy') ?? 'available',
    workload: data.workload as number ?? 0,
  };
}

async function seedOfficers(): Promise<void> {
  const promises = SEED_OFFICERS.map((officer, idx) => {
    const id = `officer_${String(idx + 1).padStart(3, '0')}`;
    return setDoc(doc(db, COLLECTION, id), { ...officer, createdAt: Timestamp.now() });
  });
  await Promise.all(promises);
}

export async function getOfficers(): Promise<Officer[]> {
  try {
    // No orderBy — sort client-side to avoid requiring a Firestore index
    const q = query(collection(db, COLLECTION));
    const snap = await getDocs(q);
    if (snap.empty) {
      await seedOfficers();
      const snap2 = await getDocs(q);
      return snap2.docs
        .map(d => toOfficer(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return snap.docs
      .map(d => toOfficer(d.id, d.data() as Record<string, unknown>))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    console.error('[OfficerService] getOfficers error:', e);
    return [];
  }
}

export async function updateOfficerWorkload(officerId: string, delta: number): Promise<void> {
  await updateDoc(doc(db, COLLECTION, officerId), {
    activeApplications: increment(delta),
    workload: increment(delta * 10),
  });
}

export async function setOfficerStatus(officerId: string, status: 'available' | 'busy'): Promise<void> {
  await updateDoc(doc(db, COLLECTION, officerId), { status });
}
