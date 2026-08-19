import { useApp } from '@/store';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { getSubjectColor } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { Bookmark, FileText, HelpCircle, Trash2, ChevronRight, StickyNote } from 'lucide-react';
import type { SectionId } from '@/types';

interface SavedResourcesProps {
  onNavigate: (id: SectionId) => void;
}

export function SavedResources({ onNavigate }: SavedResourcesProps) {
  const { subjects, savedResources, removeSavedResource, notes, practiceQuestions } = useApp();

  const getSubject = (id: string) => subjects.find((s) => s.id === id);

  const sorted = [...savedResources].sort((a, b) => b.savedAt.localeCompare(a.savedAt));

  return (
    <div className="space-y-5 lg:mt-0">
      <div className="lg:hidden">
        <h1 className="text-2xl font-extrabold text-gray-900">Saved Resources</h1>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bookmark size={28} />}
            title="No saved resources yet"
            description="Bookmark revision notes and practice questions by tapping the bookmark icon. They'll appear here for quick access."
            action={
              <Button onClick={() => onNavigate('revision')} icon={<ChevronRight size={16} />}>
                Browse Revision
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <p className="text-sm text-gray-500">{sorted.length} saved resource{sorted.length > 1 ? 's' : ''}</p>
          <div className="space-y-2 stagger">
            {sorted.map((resource) => {
              const subject = getSubject(resource.subjectId);
              const colors = subject ? getSubjectColor(subject.color) : null;
              const Icon = subject ? (Icons as any)[subject.icon] ?? Icons.BookOpen : Icons.BookOpen;

              let detail = '';
              if (resource.type === 'note') {
                const note = notes.find((n) => n.id === resource.refId);
                detail = note?.content ? note.content.slice(0, 120) + (note.content.length > 120 ? '...' : '') : '';
              } else if (resource.type === 'question') {
                const q = practiceQuestions.find((pq: any) => pq.id === resource.refId);
                detail = q?.question ?? '';
              }

              const typeIcon = resource.type === 'note' ? <FileText size={14} /> : <HelpCircle size={14} />;
              const typeLabel = resource.type === 'note' ? 'Note' : 'Question';

              return (
                <Card key={resource.id} className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colors ? colors.soft : 'bg-gray-100'} flex items-center justify-center flex-shrink-0 ${colors ? colors.text : 'text-gray-400'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-gray-100 text-gray-600">{typeIcon} {typeLabel}</Badge>
                        {subject && <span className="text-xs text-gray-500 font-medium">{subject.name}</span>}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{resource.title}</h3>
                      {detail && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{detail}</p>}
                    </div>
                    <button
                      onClick={() => removeSavedResource(resource.id)}
                      className="p-2 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
