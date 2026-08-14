import mongoose from 'mongoose';
import { ID_PREFIXES } from '@consultancy/config';

interface CounterDocument {
  _id: string;
  sequence: number;
}

const CounterSchema = new mongoose.Schema<CounterDocument>({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 0 },
});

const Counter = mongoose.model<CounterDocument>('Counter', CounterSchema);

async function getNextSequence(sequenceName: string): Promise<number> {
  const result = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequence: 1 } },
    { new: true, upsert: true },
  );
  return result.sequence;
}

function formatSequenceNumber(num: number, padLength = 6): string {
  return String(num).padStart(padLength, '0');
}

function getCurrentYear(): number {
  return new Date().getFullYear();
}

export async function generateStudentId(): Promise<string> {
  const year = getCurrentYear();
  const key = `${ID_PREFIXES.STUDENT}_${year}`;
  const seq = await getNextSequence(key);
  return `${ID_PREFIXES.STUDENT}-${year}-${formatSequenceNumber(seq)}`;
}

export async function generateLeadNumber(): Promise<string> {
  const year = getCurrentYear();
  const key = `${ID_PREFIXES.LEAD}_${year}`;
  const seq = await getNextSequence(key);
  return `${ID_PREFIXES.LEAD}-${year}-${formatSequenceNumber(seq)}`;
}

export async function generateCounselingNumber(): Promise<string> {
  const year = getCurrentYear();
  const key = `${ID_PREFIXES.COUNSELING}_${year}`;
  const seq = await getNextSequence(key);
  return `${ID_PREFIXES.COUNSELING}-${year}-${formatSequenceNumber(seq)}`;
}

export async function generateApplicationNumber(): Promise<string> {
  const year = getCurrentYear();
  const key = `${ID_PREFIXES.APPLICATION}_${year}`;
  const seq = await getNextSequence(key);
  return `${ID_PREFIXES.APPLICATION}-${year}-${formatSequenceNumber(seq)}`;
}

export async function generateDocumentNumber(): Promise<string> {
  const year = getCurrentYear();
  const key = `${ID_PREFIXES.DOCUMENT}_${year}`;
  const seq = await getNextSequence(key);
  return `${ID_PREFIXES.DOCUMENT}-${year}-${formatSequenceNumber(seq)}`;
}

export async function generateInvoiceNumber(): Promise<string> {
  const year = getCurrentYear();
  const key = `${ID_PREFIXES.INVOICE}_${year}`;
  const seq = await getNextSequence(key);
  return `${ID_PREFIXES.INVOICE}-${year}-${formatSequenceNumber(seq)}`;
}

export async function generatePaymentNumber(): Promise<string> {
  const year = getCurrentYear();
  const key = `${ID_PREFIXES.PAYMENT}_${year}`;
  const seq = await getNextSequence(key);
  return `${ID_PREFIXES.PAYMENT}-${year}-${formatSequenceNumber(seq)}`;
}

export async function generateReceiptNumber(): Promise<string> {
  const year = getCurrentYear();
  const key = `${ID_PREFIXES.RECEIPT}_${year}`;
  const seq = await getNextSequence(key);
  return `${ID_PREFIXES.RECEIPT}-${year}-${formatSequenceNumber(seq)}`;
}

export async function generateTaskNumber(): Promise<string> {
  const year = getCurrentYear();
  const key = `${ID_PREFIXES.TASK}_${year}`;
  const seq = await getNextSequence(key);
  return `${ID_PREFIXES.TASK}-${year}-${formatSequenceNumber(seq)}`;
}

export async function generateTeacherId(): Promise<string> {
  const year = getCurrentYear();
  const key = `${ID_PREFIXES.TEACHER}_${year}`;
  const seq = await getNextSequence(key);
  return `${ID_PREFIXES.TEACHER}-${year}-${formatSequenceNumber(seq, 4)}`;
}

export async function generateClassCode(): Promise<string> {
  const year = getCurrentYear();
  const key = `${ID_PREFIXES.CLASS}_${year}`;
  const seq = await getNextSequence(key);
  return `${ID_PREFIXES.CLASS}-${year}-${formatSequenceNumber(seq, 3)}`;
}