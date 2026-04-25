export interface Task {
  id: string;
  title: string;
  instructions: string;
  initialQuery?: string;
  expectedResult?: any[];
  expectedSql?: string; // New: Reference SQL for dynamic verification
  hint: string;
  structuralHint?: string;
  pitfallGuide?: string; // Move to task level as requested
  requireStrictKeys?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  pitfallGuide?: string; // New: Pitfall Guide
  imageUrl: string;
  tableToQuery: string;
  tasks: Task[];
}

export interface Progress {
  completedLessons: string[];
}

export interface TableData {
  name: string;
  columns: string[];
  rows: any[][];
}
