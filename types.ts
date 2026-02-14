import * as React from 'react';

export interface ParsedRecord {
  name: string;
  isin: string;
  currentWeight: string;
  previousWeight: string;
}

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface FileData {
  id: string;
  file: File;
  status: ProcessingStatus;
  records: ParsedRecord[];
  markdownContent: string | null;
  errorMessage?: string;
}

// Augment InputHTMLAttributes to allow webkitdirectory
// Fix: Using 'declare module "react"' requires a robust import to ensure the module is found during augmentation
declare module 'react' {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string | boolean;
    directory?: string | boolean;
  }
}