export type Priority = 'low' | 'medium' | 'high';

export type SubjectColor =
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'teal'
  | 'indigo'
  | 'red';

export interface Subject {
  id: string;
  name: string;
  color: SubjectColor;
  icon: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  completed: boolean;
}

export interface StudySession {
  id: string;
  subjectId: string;
  topicId?: string;
  title: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  day: string; // Monday, Tuesday, etc.
  completed: boolean;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  dueDate: string; // ISO date
  priority: Priority;
  completed: boolean;
  type: 'homework' | 'assignment' | 'reading' | 'project' | 'other';
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  date: string; // ISO date
  time: string;
  location?: string;
  notes?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  score: number;
  total: number;
  date: string;
  answers: number[];
}

export interface RevisionNote {
  id: string;
  subjectId: string;
  topicId: string;
  title: string;
  content: string;
  keyPoints: string[];

  // Optional uploaded study material
  attachments?: NoteAttachment[];
}

export interface NoteAttachment {
  id: string;
  noteId: string;
  name: string;
  type: string;
  url: string;
  size: number;
}


export interface PracticeQuestion {
  id: string;
  subjectId: string;
  topicId: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GeneratedPracticeQuestion {
  id: string;
  subjectId: string;
  topicId?: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SavedResource {
  id: string;
  type: 'note' | 'question' | 'quiz';
  refId: string;
  subjectId: string;
  title: string;
  savedAt: string;
}

export type SectionId =
  | 'dashboard'
  | 'timetable'
  | 'subjects'
  | 'revision'
  | 'quizzes'
  | 'tasks'
  | 'exams'
  | 'progress'
  | 'saved'
  | 'ai'
  | 'plans'
;
