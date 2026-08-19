import { useState } from 'react';
import { useApp } from '@/store';
import type { StudySession } from '@/types';
import { Card } from '@/components/Card';
import { Button, IconButton } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select, Textarea } from '@/components/Form';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { getSubjectColor, formatTimeRange, daysOfWeek } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { Plus, CalendarDays, Clock, CheckCircle2, Pencil, Trash2, Circle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

export function Timetable() {
  const { subjects, studySessions, addSession, updateSession, toggleSession, deleteSession } = useApp();
  const [view, setView] = useState<'week' | 'list'>('week');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);

  const [form, setForm] = useState<{
    subjectId: string;
    topicId: string;
    title: string;
    day: string;
    date: string;
    startTime: string;
    endTime: string;
    notes: string;
  }>({
    subjectId: subjects[0]?.id ?? '',
    topicId: '',
    title: '',
    day: daysOfWeek[0],
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
  });

  const getSubject = (id: string) => subjects.find((s) => s.id === id);

  const openAdd = () => {
    setEditingSession(null);
    setForm({
      subjectId: subjects[0]?.id ?? '',
      topicId: '',
      title: '',
      day: daysOfWeek[(new Date().getDay() + 6) % 7],
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (session: StudySession) => {
    setEditingSession(session);
    setForm({
      subjectId: session.subjectId,
      topicId: session.topicId ?? '',
      title: session.title,
      day: session.day,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      notes: session.notes ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.subjectId) return;
    const data = {
      subjectId: form.subjectId,
      topicId: form.topicId || undefined,
      title: form.title.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      day: form.day,
      completed: false,
      notes: form.notes.trim() || undefined,
    };
    if (editingSession) {
      updateSession(editingSession.id, data);
    } else {
      addSession(data);
    }
    setModalOpen(false);
  };

  const selectedSubject = getSubject(form.subjectId);

  return (
    <div className="space-y-5 lg:mt-0">
      <PageHeader title="Study Timetable" subtitle="Plan your weekly study sessions" />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setView('week')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            Weekly
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            List
          </button>
        </div>
        <Button icon={<Plus size={16} />} onClick={openAdd}>
          Add Session
        </Button>
      </div>

      {studySessions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarDays size={28} />}
            title="No study sessions yet"
            description="Create a weekly schedule by adding your first study session."
            action={<Button icon={<Plus size={16} />} onClick={openAdd}>Add Session</Button>}
          />
        </Card>
      ) : view === 'week' ? (
        <div className="space-y-3">
          {daysOfWeek.map((day) => {
            const daySessions = studySessions
              .filter((s) => s.day === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            if (daySessions.length === 0) return null;
            return (
              <div key={day}>
                <h3 className="text-sm font-bold text-gray-500 mb-2 px-1">{day}</h3>
                <div className="space-y-2">
                  {daySessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      subject={getSubject(session.subjectId)}
                      onToggle={() => toggleSession(session.id)}
                      onEdit={() => openEdit(session)}
                      onDelete={() => deleteSession(session.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {studySessions
            .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
            .map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                subject={getSubject(session.subjectId)}
                onToggle={() => toggleSession(session.id)}
                onEdit={() => openEdit(session)}
                onDelete={() => deleteSession(session.id)}
                showDate
              />
            ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSession ? 'Edit Session' : 'Add Study Session'}
      >
        <div className="space-y-4">
          <Field label="Session Title">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Calculus Practice"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Subject">
              <Select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value, topicId: '' })}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Topic (optional)">
              <Select
                value={form.topicId}
                onChange={(e) => setForm({ ...form, topicId: e.target.value })}
                disabled={!selectedSubject || selectedSubject.topics.length === 0}
              >
                <option value="">No specific topic</option>
                {selectedSubject?.topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => {
                  const d = new Date(e.target.value + 'T00:00:00');
                  const dayName = daysOfWeek[(d.getDay() + 6) % 7];
                  setForm({ ...form, date: e.target.value, day: dayName });
                }}
              />
            </Field>
            <Field label="Day">
              <Select
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
              >
                {daysOfWeek.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Time">
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </Field>
            <Field label="End Time">
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Notes (optional)">
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="What to focus on..."
            />
          </Field>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={!form.title.trim()}>
              {editingSession ? 'Save Changes' : 'Add Session'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SessionCard({
  session,
  subject,
  onToggle,
  onEdit,
  onDelete,
  showDate,
}: {
  session: StudySession;
  subject?: { name: string; color: any; icon: string };
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showDate?: boolean;
}) {
  if (!subject) return null;
  const colors = getSubjectColor(subject.color);
  const Icon = (Icons as any)[subject.icon] ?? Icons.BookOpen;

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${session.completed ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-100 shadow-card'}`}>
      <button onClick={onToggle} className="flex-shrink-0">
        {session.completed ? (
          <CheckCircle2 size={22} className="text-green-500" />
        ) : (
          <Circle size={22} className="text-gray-300 hover:text-gray-400" />
        )}
      </button>
      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center text-white flex-shrink-0`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold text-gray-900 ${session.completed ? 'line-through text-gray-400' : ''}`}>{session.title}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          {subject.name}
          <span className="text-gray-300">•</span>
          <Clock size={11} />
          {formatTimeRange(session.startTime, session.endTime)}
          {showDate && (
            <>
              <span className="text-gray-300">•</span>
              {session.day}
            </>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <IconButton onClick={onEdit} className="w-8 h-8">
          <Pencil size={15} />
        </IconButton>
        <IconButton onClick={onDelete} className="w-8 h-8 hover:bg-red-50 hover:text-red-500">
          <Trash2 size={15} />
        </IconButton>
      </div>
    </div>
  );
}
