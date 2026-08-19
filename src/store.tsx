
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';

import type {
  Subject,
  StudySession,
  Task,
  Exam,
  QuizAttempt,
  SavedResource,
  Topic,
  RevisionNote,
  Quiz,
  PracticeQuestion,
} from '@/types';

interface AppState {
  subjects: Subject[];
  studySessions: StudySession[];
  tasks: Task[];
  exams: Exam[];
  quizAttempts: QuizAttempt[];
  savedResources: SavedResource[];
  notes: RevisionNote[];
  generatedQuizzes: Quiz[];
  practiceQuestions: PracticeQuestion[];

  addSubject: (subject: Omit<Subject, 'id' | 'topics'>) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addTopic: (subjectId: string, name: string) => void;
  toggleTopic: (subjectId: string, topicId: string) => void;
  deleteTopic: (subjectId: string, topicId: string) => void;

  addSession: (session: Omit<StudySession, 'id'>) => void;
  updateSession: (id: string, updates: Partial<StudySession>) => void;
  toggleSession: (id: string) => void;
  deleteSession: (id: string) => void;

  addTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;

  addExam: (exam: Omit<Exam, 'id'>) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;

  addQuizAttempt: (attempt: Omit<QuizAttempt, 'id'>) => void;

  toggleSavedResource: (
    resource: Omit<SavedResource, 'id' | 'savedAt'>
  ) => void;

  isSaved: (
    type: SavedResource['type'],
    refId: string
  ) => boolean;

  removeSavedResource: (id: string) => void;

  addNote: (note: Omit<RevisionNote, 'id'>) => void;
  updateNote: (id: string, updates: Partial<RevisionNote>) => void;
  deleteNote: (id: string) => void;

  addGeneratedQuiz: (quiz: Quiz) => void;
  addPracticeQuestions: (questions: PracticeQuestion[]) => void;
}

type StoredAppData = {
  subjects: Subject[];
  studySessions: StudySession[];
  tasks: Task[];
  exams: Exam[];
  quizAttempts: QuizAttempt[];
  savedResources: SavedResource[];
  notes: RevisionNote[];
  generatedQuizzes: Quiz[];
  practiceQuestions: PracticeQuestion[];
};

const AppStateContext = createContext<AppState | null>(null);

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

const emptyData = (): StoredAppData => ({
  subjects: [],
  studySessions: [],
  tasks: [],
  exams: [],
  quizAttempts: [],
  savedResources: [],
  notes: [],
  generatedQuizzes: [],
  practiceQuestions: [],
});

function readLocalData(): StoredAppData {
  try {
    const raw = localStorage.getItem('studymind_v3_data');

    if (raw) {
      return {
        ...emptyData(),
        ...JSON.parse(raw),
      };
    }

    return emptyData();
  } catch {
    return emptyData();
  }
}

function writeLocalData(data: StoredAppData) {
  try {
    localStorage.setItem(
      'studymind_v3_data',
      JSON.stringify(data)
    );
  } catch {
    // Local storage is only a backup.
  }
}

export function AppStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const localData = useRef(readLocalData());

  const [subjects, setSubjects] = useState<Subject[]>(
    localData.current.subjects
  );

  const [studySessions, setStudySessions] =
    useState<StudySession[]>(
      localData.current.studySessions
    );

  const [tasks, setTasks] = useState<Task[]>(
    localData.current.tasks
  );

  const [exams, setExams] = useState<Exam[]>(
    localData.current.exams
  );

  const [quizAttempts, setQuizAttempts] =
    useState<QuizAttempt[]>(
      localData.current.quizAttempts
    );

  const [savedResources, setSavedResources] =
    useState<SavedResource[]>(
      localData.current.savedResources
    );

  const [notes, setNotes] = useState<RevisionNote[]>(
    localData.current.notes
  );

  const [generatedQuizzes, setGeneratedQuizzes] =
    useState<Quiz[]>(
      localData.current.generatedQuizzes
    );

  const [practiceQuestions, setPracticeQuestions] =
    useState<PracticeQuestion[]>(
      localData.current.practiceQuestions
    );

  const [cloudLoaded, setCloudLoaded] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  /*
   * LOAD USER DATA FROM SUPABASE
   */
  useEffect(() => {
    let cancelled = false;

    const loadUserData = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setCloudLoaded(true);
          return;
        }

        const { data, error } = await supabase
          .from('user_app_data')
          .select('user_id, data, updated_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error(
            'StudyMind cloud data load error:',
            error
          );

          setCloudLoaded(true);
          return;
        }

        /*
         * If cloud data exists, it becomes the source of truth.
         */
        if (data?.data) {
          const cloudData = {
            ...emptyData(),
            ...(data.data as Partial<StoredAppData>),
          };

          setSubjects(cloudData.subjects);
          setStudySessions(cloudData.studySessions);
          setTasks(cloudData.tasks);
          setExams(cloudData.exams);
          setQuizAttempts(cloudData.quizAttempts);
          setSavedResources(cloudData.savedResources);
          setNotes(cloudData.notes);
          setGeneratedQuizzes(cloudData.generatedQuizzes);
          setPracticeQuestions(cloudData.practiceQuestions);

          writeLocalData(cloudData);
        } else {
          /*
           * First time this user is syncing.
           *
           * Upload existing local data so nothing already
           * stored on the laptop is lost.
           */
          const existingLocalData = readLocalData();

          const { error: uploadError } = await supabase
            .from('user_app_data')
            .upsert(
              {
                user_id: user.id,
                data: existingLocalData,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: 'user_id',
              }
            );

          if (uploadError) {
            console.error(
              'StudyMind first cloud upload error:',
              uploadError
            );
          }
        }
      } catch (error) {
        console.error(
          'StudyMind cloud loading error:',
          error
        );
      } finally {
        if (!cancelled) {
          setCloudLoaded(true);
        }
      }
    };

    loadUserData();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * SAVE DATA TO SUPABASE WHEN IT CHANGES
   */
  useEffect(() => {
    if (!cloudLoaded) return;

    const currentData: StoredAppData = {
      subjects,
      studySessions,
      tasks,
      exams,
      quizAttempts,
      savedResources,
      notes,
      generatedQuizzes,
      practiceQuestions,
    };

    /*
     * Keep local backup too.
     */
    writeLocalData(currentData);

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { error } = await supabase
          .from('user_app_data')
          .upsert(
            {
              user_id: user.id,
              data: currentData,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id',
            }
          );

        if (error) {
          console.error(
            'StudyMind cloud save error:',
            error
          );
        }
      } catch (error) {
        console.error(
          'StudyMind cloud save error:',
          error
        );
      }
    }, 500);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [
    cloudLoaded,
    subjects,
    studySessions,
    tasks,
    exams,
    quizAttempts,
    savedResources,
    notes,
    generatedQuizzes,
    practiceQuestions,
  ]);

  const addSubject = useCallback(
    (subject: Omit<Subject, 'id' | 'topics'>) => {
      setSubjects((prev) => [
        ...prev,
        {
          ...subject,
          id: genId('sub'),
          topics: [],
        },
      ]);
    },
    []
  );

  const updateSubject = useCallback(
    (id: string, updates: Partial<Subject>) => {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        )
      );
    },
    []
  );

  const deleteSubject = useCallback((id: string) => {
    setSubjects((prev) =>
      prev.filter((s) => s.id !== id)
    );

    setStudySessions((prev) =>
      prev.filter((s) => s.subjectId !== id)
    );

    setTasks((prev) =>
      prev.filter((t) => t.subjectId !== id)
    );

    setExams((prev) =>
      prev.filter((e) => e.subjectId !== id)
    );
  }, []);

  const addTopic = useCallback(
    (subjectId: string, name: string) => {
      const topic: Topic = {
        id: genId('top'),
        name,
        completed: false,
      };

      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId
            ? {
                ...s,
                topics: [...s.topics, topic],
              }
            : s
        )
      );
    },
    []
  );

  const toggleTopic = useCallback(
    (subjectId: string, topicId: string) => {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId
            ? {
                ...s,
                topics: s.topics.map((t) =>
                  t.id === topicId
                    ? {
                        ...t,
                        completed: !t.completed,
                      }
                    : t
                ),
              }
            : s
        )
      );
    },
    []
  );

  const deleteTopic = useCallback(
    (subjectId: string, topicId: string) => {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId
            ? {
                ...s,
                topics: s.topics.filter(
                  (t) => t.id !== topicId
                ),
              }
            : s
        )
      );
    },
    []
  );

  const addSession = useCallback(
    (session: Omit<StudySession, 'id'>) => {
      setStudySessions((prev) => [
        ...prev,
        {
          ...session,
          id: genId('ses'),
        },
      ]);
    },
    []
  );

  const updateSession = useCallback(
    (id: string, updates: Partial<StudySession>) => {
      setStudySessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        )
      );
    },
    []
  );

  const toggleSession = useCallback((id: string) => {
    setStudySessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              completed: !s.completed,
            }
          : s
      )
    );
  }, []);

  const deleteSession = useCallback((id: string) => {
    setStudySessions((prev) =>
      prev.filter((s) => s.id !== id)
    );
  }, []);

  const addTask = useCallback(
    (task: Omit<Task, 'id' | 'completed'>) => {
      setTasks((prev) => [
        ...prev,
        {
          ...task,
          id: genId('task'),
          completed: false,
        },
      ]);
    },
    []
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        )
      );
    },
    []
  );

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
            }
          : t
      )
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.filter((t) => t.id !== id)
    );
  }, []);

  const addExam = useCallback(
    (exam: Omit<Exam, 'id'>) => {
      setExams((prev) => [
        ...prev,
        {
          ...exam,
          id: genId('exam'),
        },
      ]);
    },
    []
  );

  const updateExam = useCallback(
    (id: string, updates: Partial<Exam>) => {
      setExams((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, ...updates } : e
        )
      );
    },
    []
  );

  const deleteExam = useCallback((id: string) => {
    setExams((prev) =>
      prev.filter((e) => e.id !== id)
    );
  }, []);

  const addQuizAttempt = useCallback(
    (attempt: Omit<QuizAttempt, 'id'>) => {
      setQuizAttempts((prev) => [
        ...prev,
        {
          ...attempt,
          id: genId('att'),
        },
      ]);
    },
    []
  );

  const toggleSavedResource = useCallback(
    (
      resource: Omit<SavedResource, 'id' | 'savedAt'>
    ) => {
      setSavedResources((prev) => {
        const existing = prev.find(
          (r) =>
            r.type === resource.type &&
            r.refId === resource.refId
        );

        if (existing) {
          return prev.filter(
            (r) => r.id !== existing.id
          );
        }

        return [
          ...prev,
          {
            ...resource,
            id: genId('sr'),
            savedAt: new Date()
              .toISOString()
              .split('T')[0],
          },
        ];
      });
    },
    []
  );

  const isSaved = useCallback(
    (
      type: SavedResource['type'],
      refId: string
    ) => {
      return savedResources.some(
        (r) =>
          r.type === type &&
          r.refId === refId
      );
    },
    [savedResources]
  );

  const removeSavedResource = useCallback(
    (id: string) => {
      setSavedResources((prev) =>
        prev.filter((r) => r.id !== id)
      );
    },
    []
  );

  const addNote = useCallback(
    (note: Omit<RevisionNote, 'id'>) => {
      setNotes((prev) => [
        ...prev,
        {
          ...note,
          id: genId('note'),
        },
      ]);
    },
    []
  );

  const updateNote = useCallback(
    (
      id: string,
      updates: Partial<RevisionNote>
    ) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...updates } : n
        )
      );
    },
    []
  );

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.filter((n) => n.id !== id)
    );
  }, []);

  const addGeneratedQuiz = useCallback(
    (quiz: Quiz) => {
      setGeneratedQuizzes((prev) => [
        quiz,
        ...prev,
      ]);
    },
    []
  );

  const addPracticeQuestions = useCallback(
    (questions: PracticeQuestion[]) => {
      setPracticeQuestions((prev) => [
        ...questions,
        ...prev,
      ]);
    },
    []
  );

  const value: AppState = {
    subjects,
    studySessions,
    tasks,
    exams,
    quizAttempts,
    savedResources,
    notes,
    generatedQuizzes,
    practiceQuestions,

    addSubject,
    updateSubject,
    deleteSubject,
    addTopic,
    toggleTopic,
    deleteTopic,

    addSession,
    updateSession,
    toggleSession,
    deleteSession,

    addTask,
    updateTask,
    toggleTask,
    deleteTask,

    addExam,
    updateExam,
    deleteExam,

    addQuizAttempt,

    toggleSavedResource,
    isSaved,
    removeSavedResource,

    addNote,
    updateNote,
    deleteNote,

    addGeneratedQuiz,
    addPracticeQuestions,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppStateContext);

  if (!ctx) {
    throw new Error(
      'useApp must be used within AppStateProvider'
    );
  }

  return ctx;
}

