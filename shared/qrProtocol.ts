// shared/qrProtocol.ts

export interface DiaryPayload {
  userId: string;
  userName: string;
  timestamp: string;
  entries: Array<{
    date: string;
    morning_taken: boolean;
    afternoon_taken: boolean;
    night_taken: boolean;
    symptoms: string[];
    sos_triggered: boolean;
  }>;
  vitals?: {
    systolic_bp?: number;
    diastolic_bp?: number;
    spo2?: number;
    heart_rate?: number;
    blood_glucose?: number;
  };
  consentGranted: boolean;
}

export interface QRChunkPacket {
  seq: number;
  total: number;
  uid: string;
  chk: string;
  payload: string;
}

function calculateChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function encodeDiaryToQRSequence(diary: DiaryPayload, chunkSize: number = 180): QRChunkPacket[] {
  const jsonStr = JSON.stringify(diary);
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
      uid: diary.userId,
      chk: calculateChecksum(slice),
      payload: slice
    });
  }

  return packets;
}

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

    if (this.expectedTotal === 0) {
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

  public assemble(): DiaryPayload | null {
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
      return JSON.parse(jsonStr) as DiaryPayload;
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
