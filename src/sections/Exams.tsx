import { useState } from 'react';
import { useApp } from '@/store';
import type { Exam } from '@/types';
import { Card } from '@/components/Card';
import { Button, IconButton } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select, Textarea } from '@/components/Form';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { getSubjectColor, formatDate, formatDateLong, daysUntil } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { Plus, GraduationCap, Pencil, Trash2, MapPin, Clock, Calendar } from 'lucide-react';

export function Exams() {
  const { subjects, exams, addExam, updateExam, deleteExam } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [form, setForm] = useState({
    subjectId: subjects[0]?.id ?? '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    location: '',
    notes: '',
  });

  const getSubject = (id: string) => subjects.find((s) => s.id === id);

  const openAdd = () => {
    setEditingExam(null);
    setForm({
      subjectId: subjects[0]?.id ?? '',
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      location: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (exam: Exam) => {
    setEditingExam(exam);
    setForm({
      subjectId: exam.subjectId,
      title: exam.title,
      date: exam.date,
      time: exam.time,
      location: exam.location ?? '',
      notes: exam.notes ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.subjectId) return;
    const data = {
      subjectId: form.subjectId,
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      location: form.location.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editingExam) {
      updateExam(editingExam.id, data);
    } else {
      addExam(data);
    }
    setModalOpen(false);
  };

  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter((e) => daysUntil(e.date) >= 0);
  const past = sorted.filter((e) => daysUntil(e.date) < 0);

  return (
    <div className="space-y-5 lg:mt-0">
      <div className="lg:hidden">
        <h1 className="text-2xl font-extrabold text-gray-900">Exams</h1>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{upcoming.length} upcoming • {past.length} past</p>
        <Button icon={<Plus size={16} />} onClick={openAdd}>Add Exam</Button>
      </div>

      {exams.length === 0 ? (
        <Card>
          <EmptyState
            icon={<GraduationCap size={28} />}
            title="No exams scheduled"
            description="Add your exam dates to see countdowns and plan your revision."
            action={<Button icon={<Plus size={16} />} onClick={openAdd}>Add Exam</Button>}
          />
        </Card>
      ) : (
        <>
          {/* Upcoming exams */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-500 px-1">Upcoming</h3>
              <div className="space-y-3 stagger">
                {upcoming.map((exam) => {
                  const subject = getSubject(exam.subjectId);
                  if (!subject) return null;
                  const colors = getSubjectColor(subject.color);
                  const Icon = (Icons as any)[subject.icon] ?? Icons.BookOpen;
                  const days = daysUntil(exam.date);
                  return (
                    <Card key={exam.id} className="p-0 overflow-hidden">
                      <div className="flex">
                        <div className={`w-2 ${colors.bg}`} />
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`w-11 h-11 rounded-xl ${colors.soft} flex flex-col items-center justify-center flex-shrink-0`}>
                                <span className={`text-lg font-extrabold ${colors.text}`}>{days}</span>
                                <span className="text-[10px] text-gray-500 font-medium">days</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900">{exam.title}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{subject.name}</p>
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar size={11} /> {formatDateLong(exam.date)}
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock size={11} /> {exam.time}
                                  </span>
                                  {exam.location && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <MapPin size={11} /> {exam.location}
                                    </span>
                                  )}
                                </div>
                                {exam.notes && (
                                  <p className="text-xs text-gray-500 mt-2 p-2 rounded-lg bg-gray-50">{exam.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <IconButton onClick={() => openEdit(exam)} className="w-8 h-8">
                                <Pencil size={15} />
                              </IconButton>
                              <IconButton onClick={() => deleteExam(exam.id)} className="w-8 h-8 hover:bg-red-50 hover:text-red-500">
                                <Trash2 size={15} />
                              </IconButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past exams */}
          {past.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-500 px-1">Past</h3>
              <div className="space-y-2">
                {past.map((exam) => {
                  const subject = getSubject(exam.subjectId);
                  if (!subject) return null;
                  return (
                    <div key={exam.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 opacity-60">
                      <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                        <GraduationCap size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700">{exam.title}</p>
                        <p className="text-xs text-gray-500">{subject.name} • {formatDate(exam.date)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <IconButton onClick={() => openEdit(exam)} className="w-8 h-8">
                          <Pencil size={15} />
                        </IconButton>
                        <IconButton onClick={() => deleteExam(exam.id)} className="w-8 h-8 hover:bg-red-50 hover:text-red-500">
                          <Trash2 size={15} />
                        </IconButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingExam ? 'Edit Exam' : 'Add Exam'}>
        <div className="space-y-4">
          <Field label="Exam Title">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Mathematics Mock Exam"
              autoFocus
            />
          </Field>
          <Field label="Subject">
            <Select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <Field label="Time">
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Location (optional)">
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Hall A"
            />
          </Field>
          <Field label="Notes (optional)">
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Topics covered, what to bring..."
            />
          </Field>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={!form.title.trim()}>
              {editingExam ? 'Save' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
