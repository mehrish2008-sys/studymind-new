import { useState } from 'react';
import { useApp } from '@/store';
import type { Task, Priority } from '@/types';
import { Card } from '@/components/Card';
import { Button, IconButton } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Field, Input, Select, Textarea } from '@/components/Form';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { priorityConfig, taskTypeConfig, formatDate, daysUntil, isOverdue } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { Plus, CheckSquare, CheckCircle2, Circle, Pencil, Trash2, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

type Filter = 'all' | 'pending' | 'completed';

export function Tasks() {
  const { subjects, tasks, addTask, updateTask, toggleTask, deleteTask } = useApp();
  const [filter, setFilter] = useState<Filter>('pending');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'medium' as Priority,
    type: 'homework' as Task['type'],
  });

  const getSubject = (id?: string) => subjects.find((s) => s.id === id);

  const openAdd = () => {
    setEditingTask(null);
    setForm({
      title: '',
      description: '',
      subjectId: subjects[0]?.id ?? '',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      type: 'homework',
    });
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description ?? '',
      subjectId: task.subjectId ?? '',
      dueDate: task.dueDate,
      priority: task.priority,
      type: task.type,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const data = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      subjectId: form.subjectId || undefined,
      dueDate: form.dueDate,
      priority: form.priority,
      type: form.type,
    };
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
    setModalOpen(false);
  };

  const filtered = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-5 lg:mt-0">
      <div className="lg:hidden">
        <h1 className="text-2xl font-extrabold text-gray-900">Tasks</h1>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(['pending', 'completed', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              {f} {f === 'pending' && pendingCount > 0 && `(${pendingCount})`}
            </button>
          ))}
        </div>
        <Button icon={<Plus size={16} />} onClick={openAdd}>Add Task</Button>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CheckSquare size={28} />}
            title={filter === 'completed' ? 'No completed tasks yet' : filter === 'pending' ? 'No pending tasks' : 'No tasks yet'}
            description={filter === 'pending' ? 'You\'re all caught up! Add a new task to get started.' : 'Add your first task to start tracking your work.'}
            action={filter !== 'completed' ? <Button icon={<Plus size={16} />} onClick={openAdd}>Add Task</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-2 stagger">
          {sorted.map((task) => {
            const subject = getSubject(task.subjectId);
            const days = daysUntil(task.dueDate);
            const overdue = isOverdue(task.dueDate) && !task.completed;
            return (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${task.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-card'}`}
              >
                <button onClick={() => toggleTask(task.id)} className="mt-0.5 flex-shrink-0">
                  {task.completed ? (
                    <CheckCircle2 size={22} className="text-green-500" />
                  ) : (
                    <Circle size={22} className="text-gray-300 hover:text-gray-400" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold text-gray-900 ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
                  {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className={priorityConfig[task.priority].className}>
                      <span className={`w-1.5 h-1.5 rounded-full ${priorityConfig[task.priority].dot}`} />
                      {priorityConfig[task.priority].label}
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-600">{taskTypeConfig[task.type]}</Badge>
                    {subject && (
                      <span className="text-xs text-gray-500 font-medium">{subject.name}</span>
                    )}
                    <span className={`text-xs font-semibold flex items-center gap-1 ${overdue ? 'text-red-600' : days <= 2 && !task.completed ? 'text-amber-600' : 'text-gray-400'}`}>
                      <Calendar size={11} />
                      {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : days < 0 ? 'Overdue' : `Due ${formatDate(task.dueDate)}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <IconButton onClick={() => openEdit(task)} className="w-8 h-8">
                    <Pencil size={15} />
                  </IconButton>
                  <IconButton onClick={() => deleteTask(task.id)} className="w-8 h-8 hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={15} />
                  </IconButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingTask ? 'Edit Task' : 'Add Task'}>
        <div className="space-y-4">
          <Field label="Task Title">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Complete Problem Set 4"
              autoFocus
            />
          </Field>
          <Field label="Description (optional)">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add details..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Task['type'] })}
              >
                {Object.entries(taskTypeConfig).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Subject (optional)">
              <Select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              >
                <option value="">No subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Due Date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </Field>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={!form.title.trim()}>
              {editingTask ? 'Save' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
