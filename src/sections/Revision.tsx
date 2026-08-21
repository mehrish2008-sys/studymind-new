import { useMemo, useRef, useState } from 'react';
import { useApp } from '@/store';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { getSubjectColor } from '@/lib/utils';
import { StickyNote, ChevronRight, FileText, CircleHelp as HelpCircle, Plus, Trash2, Pencil, X, Upload, File, Image as ImageIcon, Paperclip } from 'lucide-react';

export function Revision() {
  const {
    subjects,
    notes,
    addNote,
    updateNote,
    deleteNote,
    practiceQuestions,
    uploadNoteAttachment,
    getAttachmentSignedUrl,
  } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] =
    useState<string | null>(null);

  const [selectedTopicId, setSelectedTopicId] =
    useState<string | null>(null);

  const [tab, setTab] =
    useState<'notes' | 'questions'>('notes');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topicId, setTopicId] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [revealedQuestions, setRevealedQuestions] =
    useState<Record<string, boolean>>({});

  const [dragActive, setDragActive] = useState(false);

  const [selectedFiles, setSelectedFiles] =
    useState<File[]>([]);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const selected = subjects.find(
    (s) => s.id === selectedSubjectId
  );

  const filteredNotes = useMemo(
    () =>
      notes.filter(
        (n) =>
          n.subjectId === selectedSubjectId &&
          (!selectedTopicId ||
            n.topicId === selectedTopicId)
      ),
    [notes, selectedSubjectId, selectedTopicId]
  );

  const filteredQuestions = useMemo(
    () =>
      practiceQuestions.filter(
        (q) =>
          q.subjectId === selectedSubjectId &&
          (!selectedTopicId ||
            q.topicId === selectedTopicId)
      ),
    [
      practiceQuestions,
      selectedSubjectId,
      selectedTopicId,
    ]
  );

  /*
   * Read plain-text files automatically.
   *
   * This works for .txt, .md, .csv and other text files.
   * PDFs, Word files and images are uploaded as attachments.
   */
  const readTextFile = async (file: File) => {
    const textTypes = [
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
    ];

    const isTextFile =
      textTypes.includes(file.type) ||
      /\.(txt|md|csv|json)$/i.test(file.name);

    if (!isTextFile) {
      return null;
    }

    try {
      return await file.text();
    } catch {
      return null;
    }
  };

  /*
   * Handle files selected from the file picker
   * or dropped into the drop zone.
   */
  const handleFiles = async (files: FileList | File[]) => {
    const incomingFiles = Array.from(files);

    if (incomingFiles.length === 0) return;

    setSelectedFiles((prev) => [
      ...prev,
      ...incomingFiles,
    ]);

    /*
     * If the user drops a text file while creating a note,
     * automatically put its contents into the note.
     */
    for (const file of incomingFiles) {
      const text = await readTextFile(file);

      if (text) {
        setContent((prev) => {
          if (!prev.trim()) return text;

          return `${prev}\n\n${text}`;
        });
      }
    }
  };

  const handleDrop = async (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    if (event.dataTransfer.files?.length) {
      await handleFiles(event.dataTransfer.files);
    }
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(true);
  };

  const handleDragLeave = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return (
        <ImageIcon
          size={18}
          className="text-purple-500"
        />
      );
    }

    if (
      file.type === 'application/pdf' ||
      /\.pdf$/i.test(file.name)
    ) {
      return (
        <FileText
          size={18}
          className="text-red-500"
        />
      );
    }

    return (
      <File
        size={18}
        className="text-blue-500"
      />
    );
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTopicId(
      selectedTopicId ||
        selected?.topics[0]?.id ||
        ''
    );
    setEditingId(null);
    setAdding(false);
    setSelectedFiles([]);
    setDragActive(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveNote = async () => {
    if (
      !title.trim() ||
      !content.trim() ||
      !selected
    ) {
      return;
    }

    const nextTopicId =
      topicId ||
      selectedTopicId ||
      selected.topics[0]?.id ||
      '';

    const keyPoints = content
      .split(/[.!?]/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 5);

    /*
     * Editing an existing note.
     */
    if (editingId) {
      updateNote(editingId, {
        title: title.trim(),
        content: content.trim(),
        topicId: nextTopicId,
        keyPoints,
      });

      /*
       * Upload newly selected attachments.
       */
      for (const file of selectedFiles) {
        await uploadNoteAttachment(
          editingId,
          file
        );
      }
    } else {
      /*
       * Create the note first.
       */
      const noteId = addNote({
        subjectId: selected.id,
        topicId: nextTopicId,
        title: title.trim(),
        content: content.trim(),
        keyPoints,
      });

      /*
       * Upload attachments for the newly created note.
       */
      for (const file of selectedFiles) {
        await uploadNoteAttachment(noteId, file);
      }
    }

    resetForm();
  };

  const editNote = (
    note: typeof notes[number]
  ) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTopicId(note.topicId);
    setSelectedFiles([]);
    setAdding(true);
  };

  /*
   * SUBJECT SELECTION SCREEN
   */
  if (!selectedSubjectId) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Revision"
          subtitle="Save, edit and practise your own notes"
        />

        {subjects.length === 0 ? (
          <Card>
            <EmptyState
              icon={<StickyNote size={28} />}
              title="No subjects yet"
              description="Add a subject first, then come back here to add notes."
            />
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {subjects.map((s) => {
              const c = getSubjectColor(s.color);

              return (
                <Card
                  key={s.id}
                  onClick={() =>
                    setSelectedSubjectId(s.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center text-white`}
                    >
                      <FileText size={20} />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-bold">
                        {s.name}
                      </h3>

                      <p className="text-xs text-gray-500">
                        {
                          notes.filter(
                            (n) =>
                              n.subjectId === s.id
                          ).length
                        }{' '}
                        saved notes
                      </p>
                    </div>

                    <ChevronRight
                      size={18}
                      className="text-gray-300"
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /*
   * SAFETY CHECK
   */
  if (!selected) {
    setSelectedSubjectId(null);
    return null;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Revision"
        subtitle={`${selected.name} • Your notes and practice questions`}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => {
            setSelectedSubjectId(null);
            setSelectedTopicId(null);
            resetForm();
          }}
          className="text-gray-500 font-semibold"
        >
          Subjects
        </button>

        <ChevronRight size={14} />

        <span className="font-semibold text-brand-600">
          {selected.name}
        </span>
      </div>

      {/* Topics */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[null, ...selected.topics.map((t) => t.id)].map(
          (id) => (
            <button
              key={id || 'all'}
              onClick={() =>
                setSelectedTopicId(id)
              }
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                selectedTopicId === id
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {id === null
                ? 'All Topics'
                : selected.topics.find(
                    (t) => t.id === id
                  )?.name}
            </button>
          )
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('notes')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            tab === 'notes'
              ? 'bg-white shadow-sm'
              : ''
          }`}
        >
          <FileText
            size={15}
            className="inline mr-2"
          />
          Notes
        </button>

        <button
          onClick={() => setTab('questions')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            tab === 'questions'
              ? 'bg-white shadow-sm'
              : ''
          }`}
        >
          <HelpCircle
            size={15}
            className="inline mr-2"
          />
          Practice Questions
        </button>
      </div>

      {tab === 'notes' ? (
        <>
          {/* Add Note Button */}
          <div className="flex justify-end">
            <Button
              icon={
                editingId ? (
                  <Pencil size={15} />
                ) : (
                  <Plus size={15} />
                )
              }
              onClick={() => {
                if (adding) {
                  resetForm();
                } else {
                  setTopicId(
                    selectedTopicId ||
                      selected.topics[0]?.id ||
                      ''
                  );
                  setAdding(true);
                }
              }}
            >
              {adding
                ? editingId
                  ? 'Cancel Edit'
                  : 'Close'
                : 'Add Note'}
            </Button>
          </div>

          {/* Add/Edit Note */}
          {adding && (
            <Card>
              <div className="space-y-4">
                {/* Title */}
                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="Note title"
                  className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm"
                />

                {/* Topic */}
                <select
                  value={topicId}
                  onChange={(e) =>
                    setTopicId(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm"
                >
                  <option value="">
                    General / no topic
                  </option>

                  {selected.topics.map((t) => (
                    <option
                      key={t.id}
                      value={t.id}
                    >
                      {t.name}
                    </option>
                  ))}
                </select>

                {/* Drag & Drop */}
                <div
                  onDragEnter={handleDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                    dragActive
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFiles(
                          e.target.files
                        );
                      }
                    }}
                  />

                  <Upload
                    size={28}
                    className="mx-auto mb-2 text-gray-400"
                  />

                  <p className="font-semibold text-sm text-gray-700">
                    Drag & drop files here
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Or click to choose files
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    PDFs • Word • Images • Text • Any file
                  </p>
                </div>

                {/* Selected files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500">
                      Files to attach
                    </p>

                    {selectedFiles.map(
                      (file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
                        >
                          {getFileIcon(file)}

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {file.name}
                            </p>

                            <p className="text-xs text-gray-400">
                              {formatFileSize(
                                file.size
                              )}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSelectedFile(
                                index
                              );
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Note content */}
                <textarea
                  value={content}
                  onChange={(e) =>
                    setContent(e.target.value)
                  }
                  placeholder="Type or paste your notes here… You can also drop a text file above and its contents will be added automatically."
                  rows={10}
                  className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm resize-y"
                />

                {/* Save buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={saveNote}
                    disabled={
                      !title.trim() ||
                      !content.trim()
                    }
                  >
                    {editingId
                      ? 'Save Changes'
                      : 'Save Note'}
                  </Button>

                  {editingId && (
                    <Button
                      variant="secondary"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          {filteredNotes.length === 0 ? (
            <Card>
              <EmptyState
                icon={<StickyNote size={28} />}
                title="No notes yet"
                description="Add your class notes here. You can edit or delete them anytime."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((n) => (
                <Card key={n.id}>
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">
                        {n.title}
                      </h3>

                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                        {n.content}
                      </p>

                      {/* Attachments */}
                      {n.attachments &&
                        n.attachments.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                              <Paperclip size={14} />
                              Attachments
                            </div>

                            {n.attachments.map(
                              (attachment) => (
                                <button
                                  key={attachment.id}
                                  onClick={async () => {
                                    if (attachment.path) {
                                      const signedUrl =
                                        await getAttachmentSignedUrl(
                                          attachment.path
                                        );
                                      if (signedUrl) {
                                        window.open(
                                          signedUrl,
                                          '_blank'
                                        );
                                      }
                                    } else {
                                      window.open(
                                        attachment.url,
                                        '_blank'
                                      );
                                    }
                                  }}
                                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 text-left w-full"
                                >
                                  {attachment.type ===
                                  'image' ? (
                                    <ImageIcon
                                      size={18}
                                      className="text-purple-500"
                                    />
                                  ) : (
                                    <FileText
                                      size={18}
                                      className="text-blue-500"
                                    />
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold truncate">
                                      {
                                        attachment.name
                                      }
                                    </p>

                                    <p className="text-xs text-gray-400">
                                      {formatFileSize(
                                        attachment.size
                                      )}
                                    </p>
                                  </div>
                                </button>
                              )
                            )}
                          </div>
                        )}
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() =>
                          editNote(n)
                        }
                        aria-label="Edit note"
                        className="p-2 text-gray-400 hover:text-brand-600"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        onClick={() =>
                          deleteNote(n.id)
                        }
                        aria-label="Delete note"
                        className="p-2 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Practice Questions */}
          {filteredQuestions.length === 0 ? (
            <Card>
              <EmptyState
                icon={<HelpCircle size={28} />}
                title="No practice questions yet"
                description="Use AI Study Helper to generate practice questions from your notes."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => (
                <Card key={q.id}>
                  <p className="font-semibold text-gray-900">
                    {q.question}
                  </p>

                  <div className="mt-3">
                    {revealedQuestions[q.id] ? (
                      <div className="rounded-xl bg-green-50 p-3">
                        <p className="text-sm text-green-800">
                          <strong>
                            Answer:
                          </strong>{' '}
                          {q.answer}
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setRevealedQuestions(
                            (prev) => ({
                              ...prev,
                              [q.id]: true,
                            })
                          )
                        }
                      >
                        Check Answer
                      </Button>
                    )}
                  </div>

                  <span className="text-xs text-gray-400 capitalize block mt-2">
                    {q.difficulty}
                  </span>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}