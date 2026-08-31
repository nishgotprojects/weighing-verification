import { AIAnalysisResult } from '@/types';
import { parseAIResult } from '@/lib/utils';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

export async function analyzeInstrument(
  imageBase64: string,
  declaredSerial: string
): Promise<AIAnalysisResult> {
  const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/analyze-instrument`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: cleanBase64,
        declared_serial: declaredSerial,
      }),
    });
  } catch (networkErr: any) {
    throw new Error(
      `Cannot connect to AI backend at ${API_BASE}. Please ensure the FastAPI server is running on http://127.0.0.1:8000.`
    );
  }

  if (!res.ok) {
    let errorDetail = '';
    try {
      const errData = await res.json();
      errorDetail = errData.detail || errData.message || errData.error || JSON.stringify(errData);
    } catch {
      errorDetail = res.statusText || `HTTP status ${res.status}`;
    }
    throw new Error(`AI Analysis failed (${res.status}): ${errorDetail}`);
  }

  const data = await res.json();

  const raw: string = data.raw_result ?? '';
  const parsed = parseAIResult(raw);

  return {
    raw_result: raw,
    flagged: Boolean(data.flagged),
    detectedSerial: parsed.detectedSerial,
    match: parsed.match as 'YES' | 'NO' | 'UNKNOWN',
    tamperSigns: parsed.tamperSigns as 'YES' | 'NO',
    reason: parsed.reason,
  };
}

export async function checkBackendHealth(): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      return { ok: true };
    }
    return { ok: false, message: `Backend responded with HTTP ${res.status}` };
  } catch (err: any) {
    return { ok: false, message: `Cannot connect to ${API_BASE}: ${err?.message || 'Network error'}` };
  }
}
