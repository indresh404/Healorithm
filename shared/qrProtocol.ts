// shared/qrProtocol.ts
import { User, MedicalRecord, Prescription } from './types';

export interface PatientExportPackage {
  protocolVersion: string;
  patientId: string;
  fullName: string;
  age: number;
  gender: string;
  village: string;
  bloodGroup: string;
  phoneNumber?: string;
  vitals?: {
    systolic_bp?: number;
    diastolic_bp?: number;
    spo2?: number;
    heart_rate?: number;
    blood_glucose?: number;
    temperature?: number;
  };
  symptoms: string[];
  prescriptions: Array<{
    medicine_name: string;
    generic_name: string;
    dosage: string;
    timing: string;
  }>;
  adherenceLogs: Array<{
    date: string;
    morning_taken: boolean;
    afternoon_taken: boolean;
    night_taken: boolean;
  }>;
  consentTimestamp: string;
  digitalSignature: string;
}

export interface QRChunkPacket {
  seq: number;
  total: number;
  uid: string;
  chk: string;
  payload: string;
}

export function calculateChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Encode patient package into a single JSON string for static QR codes
 */
export function encodeSingleQR(patientPackage: PatientExportPackage): string {
  return JSON.stringify({
    type: 'HEALORITHM_HEALTH_CARD',
    data: patientPackage
  });
}

/**
 * Encode patient package into multi-frame animated QR sequence
 */
export function encodeToQRSequence(patientPackage: PatientExportPackage, chunkSize: number = 180): QRChunkPacket[] {
  const jsonStr = JSON.stringify(patientPackage);
  const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
  const totalLength = encoded.length;
  const totalChunks = Math.ceil(totalLength / chunkSize) || 1;
  const packets: QRChunkPacket[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const slice = encoded.slice(start, start + chunkSize);
    packets.push({
      seq: i + 1,
      total: totalChunks,
      uid: patientPackage.patientId,
      chk: calculateChecksum(slice),
      payload: slice
    });
  }

  return packets;
}

/**
 * QR Sequence Assembler for multi-frame continuous scanning
 */
export class QRSequenceAssembler {
  private chunksMap: Map<number, string> = new Map();
  private expectedTotal: number = 0;
  private userId: string = '';

  public addPacket(packet: QRChunkPacket): {
    success: boolean;
    isComplete: boolean;
    progress: number;
    receivedCount: number;
    total: number;
    error?: string;
  } {
    const computedChk = calculateChecksum(packet.payload);
    if (computedChk !== packet.chk) {
      return {
        success: false,
        isComplete: false,
        progress: 0,
        receivedCount: this.chunksMap.size,
        total: packet.total,
        error: `Packet ${packet.seq} checksum mismatch`
      };
    }

    if (this.expectedTotal === 0 || this.userId !== packet.uid) {
      this.chunksMap.clear();
      this.expectedTotal = packet.total;
      this.userId = packet.uid;
    }

    this.chunksMap.set(packet.seq, packet.payload);
    const progress = Math.round((this.chunksMap.size / this.expectedTotal) * 100);
    const isComplete = this.chunksMap.size >= this.expectedTotal;

    return {
      success: true,
      isComplete,
      progress,
      receivedCount: this.chunksMap.size,
      total: this.expectedTotal
    };
  }

  public assemble(): PatientExportPackage | null {
    if (this.chunksMap.size < this.expectedTotal) {
      return null;
    }

    let fullEncoded = '';
    for (let i = 1; i <= this.expectedTotal; i++) {
      const slice = this.chunksMap.get(i);
      if (!slice) return null;
      fullEncoded += slice;
    }

    try {
      const jsonStr = decodeURIComponent(escape(atob(fullEncoded)));
      return JSON.parse(jsonStr) as PatientExportPackage;
    } catch (e) {
      console.error('Failed to decode assembled QR payload:', e);
      return null;
    }
  }

  public reset() {
    this.chunksMap.clear();
    this.expectedTotal = 0;
    this.userId = '';
  }
}

/**
 * Parse any scanned QR code content (single JSON, raw string, or chunk packet)
 */
export function parseScannedQRData(rawContent: string): {
  isSingleCard: boolean;
  isChunkPacket: boolean;
  packet?: QRChunkPacket;
  patientPackage?: PatientExportPackage;
  patientId?: string;
} {
  try {
    const parsed = JSON.parse(rawContent);

    // 1. Single Health Card JSON
    if (parsed.type === 'HEALORITHM_HEALTH_CARD' && parsed.data) {
      return {
        isSingleCard: true,
        isChunkPacket: false,
        patientPackage: parsed.data,
        patientId: parsed.data.patientId
      };
    }

    // 2. Direct Patient Package
    if (parsed.patientId && parsed.fullName) {
      return {
        isSingleCard: true,
        isChunkPacket: false,
        patientPackage: parsed as PatientExportPackage,
        patientId: parsed.patientId
      };
    }

    // 3. Chunk Packet Object
    if (parsed.seq !== undefined && parsed.total !== undefined && parsed.payload) {
      return {
        isSingleCard: false,
        isChunkPacket: true,
        packet: parsed as QRChunkPacket,
        patientId: parsed.uid
      };
    }
  } catch (e) {
    // If raw content is a plain ID like 'u-101' or 'HLM-482731'
    const trimmed = rawContent.trim();
    if (trimmed.startsWith('u-') || trimmed.startsWith('HLM-')) {
      return {
        isSingleCard: false,
        isChunkPacket: false,
        patientId: trimmed
      };
    }
  }

  return {
    isSingleCard: false,
    isChunkPacket: false
  };
}
