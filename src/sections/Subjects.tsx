import { useState } from 'react';
import { useApp } from '@/store';
import type { SubjectColor } from '@/types';
import { Card } from '@/components/Card';
import { Button, IconButton } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select } from '@/components/Form';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { getSubjectColor } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { Plus, BookCopy, ChevronRight, CheckCircle2, Circle, Trash2, Pencil, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

const colorOptions: SubjectColor[] = ['blue', 'green', 'purple', 'orange', 'pink', 'teal', 'indigo', 'red'];
const iconOptions = ['Calculator', 'Atom', 'FlaskConical', 'Dna', 'BookOpen', 'Landmark', 'Globe', 'Music', 'Palette', 'Code', 'Brain', 'Languages'];

export function Subjects() {
  const { subjects, addSubject, updateSubject, deleteSubject, addTopic, toggleTopic, deleteTopic } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');

  const [form, setForm] = useState({
    name: '',
    color: 'blue' as SubjectColor,
    icon: 'BookOpen',
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', color: 'blue', icon: 'BookOpen' });
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const s = subjects.find((x) => x.id === id);
    if (!s) return;
    setEditingId(id);
    setForm({ name: s.name, color: s.color, icon: s.icon });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateSubject(editingId, { name: form.name.trim(), color: form.color, icon: form.icon });
    } else {
      addSubject({ name: form.name.trim(), color: form.color, icon: form.icon });
    }
    setModalOpen(false);
  };

  const handleAddTopic = (subjectId: string) => {
    if (!newTopicName.trim()) return;
    addTopic(subjectId, newTopicName.trim());
    setNewTopicName('');
  };

  return (
    <div className="space-y-5 lg:mt-0">
      <PageHeader title="Subjects" subtitle={`${subjects.length} subjects • ${subjects.reduce((sum, s) => sum + s.topics.length, 0)} topics`} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{subjects.length} subjects • {subjects.reduce((sum, s) => sum + s.topics.length, 0)} topics</p>
        <Button icon={<Plus size={16} />} onClick={openAdd}>Add Subject</Button>
      </div>

      {subjects.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookCopy size={28} />}
            title="No subjects yet"
            description="Add your first subject to start organising your studies."
            action={<Button icon={<Plus size={16} />} onClick={openAdd}>Add Subject</Button>}
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 stagger">
          {subjects.map((subject) => {
            const colors = getSubjectColor(subject.color);
            const Icon = (Icons as any)[subject.icon] ?? Icons.BookOpen;
            const completed = subject.topics.filter((t) => t.completed).length;
            const progress = subject.topics.length > 0 ? Math.round((completed / subject.topics.length) * 100) : 0;
            const isExpanded = expandedId === subject.id;

            return (
              <Card key={subject.id} className="p-0 overflow-hidden">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : subject.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-gray-900 truncate">{subject.name}</h3>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEdit(subject.id); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${subject.name}? This removes all related sessions, tasks, and exams.`)) deleteSubject(subject.id); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{subject.topics.length} topics • {completed} completed</p>
                      <div className="mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors.bg} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pl-14">
                    <span className="text-xs font-semibold text-gray-500">{progress}% complete</span>
                    <ChevronRight size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-50 animate-fade-in">
                    <div className="space-y-1.5 mt-3">
                      {subject.topics.length === 0 ? (
                        <p className="text-sm text-gray-400 py-2 text-center">No topics yet. Add one below.</p>
                      ) : (
                        subject.topics.map((topic) => (
                          <div key={topic.id} className="flex items-center gap-2.5 group">
                            <button onClick={() => toggleTopic(subject.id, topic.id)}>
                              {topic.completed ? (
                                <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle size={18} className="text-gray-300 hover:text-gray-400 flex-shrink-0" />
                              )}
                            </button>
                            <span className={`text-sm flex-1 ${topic.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                              {topic.name}
                            </span>
                            <button
                              onClick={() => deleteTopic(subject.id, topic.id)}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Input
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddTopic(subject.id); }}
                        placeholder="Add a topic..."
                        className="text-sm py-2"
                      />
                      <Button size="sm" onClick={() => handleAddTopic(subject.id)} icon={<Plus size={14} />}>
                        Add
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Subject' : 'Add Subject'}>
        <div className="space-y-4">
          <Field label="Subject Name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Mathematics"
              autoFocus
            />
          </Field>
          <Field label="Icon">
            <div className="grid grid-cols-6 gap-2">
              {iconOptions.map((iconName) => {
                const Icon = (Icons as any)[iconName] ?? Icons.BookOpen;
                return (
                  <button
                    key={iconName}
                    onClick={() => setForm({ ...form, icon: iconName })}
                    className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${form.icon === iconName ? 'bg-brand-500 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Colour">
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => {
                const c = getSubjectColor(color);
                return (
                  <button
                    key={color}
                    onClick={() => setForm({ ...form, color })}
                    className={`w-9 h-9 rounded-xl ${c.bg} transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'}`}
                  />
                );
              })}
            </div>
          </Field>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={!form.name.trim()}>
              {editingId ? 'Save' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
