import * as React from 'react';

export interface ParsedRecord {
  name: string;
  isin: string;
  currentWeight: string;
  previousWeight: string;
}

export interface PatrimonioDistribution {
  inversionesFinancieras: { actual: number; previous: number };
  liquidez: { actual: number; previous: number };
  resto: { actual: number; previous: number };
}

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface FileData {
  id: string;
  file: File;
  status: ProcessingStatus;
  records: ParsedRecord[];
  distribution?: PatrimonioDistribution;
  markdownContent: string | null;
  errorMessage?: string;
}

// Augment InputHTMLAttributes to allow webkitdirectory
declare module 'react' {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string | boolean;
    directory?: string | boolean;
  }
}