import { useMemo, useState } from 'react';
import { useApp } from '@/store';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { getSubjectColor } from '@/lib/utils';
import { StickyNote, ChevronRight, FileText, HelpCircle, Plus, Trash2, Pencil, X } from 'lucide-react';

export function Revision() {
  const { subjects, notes, addNote, updateNote, deleteNote, practiceQuestions } = useApp();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [tab, setTab] = useState<'notes'|'questions'>('notes');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topicId, setTopicId] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const selected = subjects.find(s=>s.id===selectedSubjectId);
  const filteredNotes = useMemo(()=>notes.filter(n=>n.subjectId===selectedSubjectId && (!selectedTopicId || n.topicId===selectedTopicId)),[notes,selectedSubjectId,selectedTopicId]);
  const filteredQuestions = useMemo(()=>practiceQuestions.filter(q=>q.subjectId===selectedSubjectId && (!selectedTopicId || q.topicId===selectedTopicId)),[practiceQuestions,selectedSubjectId,selectedTopicId]);

  if (!selectedSubjectId) return <div className="space-y-5"><PageHeader title="Revision" subtitle="Save, edit and practise your own notes"/>{subjects.length===0?<Card><EmptyState icon={<StickyNote size={28}/>} title="No subjects yet" description="Add a subject first, then come back here to add notes."/></Card>:<div className="grid sm:grid-cols-2 gap-3">{subjects.map(s=>{const c=getSubjectColor(s.color);return <Card key={s.id} onClick={()=>setSelectedSubjectId(s.id)}><div className="flex items-center gap-3"><div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center text-white`}><FileText size={20}/></div><div className="flex-1"><h3 className="font-bold">{s.name}</h3><p className="text-xs text-gray-500">{notes.filter(n=>n.subjectId===s.id).length} saved notes</p></div><ChevronRight size={18} className="text-gray-300"/></div></Card>})}</div>}</div>;

  const resetForm = () => { setTitle(''); setContent(''); setTopicId(selectedTopicId || selected?.topics[0]?.id || ''); setEditingId(null); setAdding(false); };
  const saveNote = () => {
    if(!title.trim() || !content.trim() || !selected) return;
    const nextTopicId = topicId || selectedTopicId || selected.topics[0]?.id || '';
    const keyPoints = content.split(/[.!?]/).map(x=>x.trim()).filter(Boolean).slice(0,5);
    if (editingId) updateNote(editingId, { title:title.trim(), content:content.trim(), topicId:nextTopicId, keyPoints });
    else addNote({subjectId:selected.id, topicId:nextTopicId, title:title.trim(), content:content.trim(), keyPoints});
    resetForm();
  };
  const editNote = (n: typeof notes[number]) => { setEditingId(n.id); setTitle(n.title); setContent(n.content); setTopicId(n.topicId); setAdding(true); };

  return <div className="space-y-5"><PageHeader title="Revision" subtitle={`${selected.name} • Your notes and practice questions`}/><div className="flex items-center gap-2 text-sm"><button onClick={()=>{setSelectedSubjectId(null);setSelectedTopicId(null);resetForm()}} className="text-gray-500 font-semibold">Subjects</button><ChevronRight size={14}/><span className="font-semibold text-brand-600">{selected.name}</span></div>
    <div className="flex gap-2 overflow-x-auto no-scrollbar">{[null,...selected.topics.map(t=>t.id)].map(id=><button key={id||'all'} onClick={()=>setSelectedTopicId(id)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${selectedTopicId===id?'bg-brand-500 text-white':'bg-white border border-gray-200 text-gray-600'}`}>{id===null?'All Topics':selected.topics.find(t=>t.id===id)?.name}</button>)}</div>
    <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit"><button onClick={()=>setTab('notes')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab==='notes'?'bg-white shadow-sm':''}`}><FileText size={15} className="inline mr-2"/>Notes</button><button onClick={()=>setTab('questions')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab==='questions'?'bg-white shadow-sm':''}`}><HelpCircle size={15} className="inline mr-2"/>Practice Questions</button></div>
    {tab==='notes'?<><div className="flex justify-end"><Button icon={editingId?<Pencil size={15}/>:<Plus size={15}/>} onClick={()=>{if(adding) resetForm(); else {setTopicId(selectedTopicId || selected.topics[0]?.id || '');setAdding(true)}}}>{adding?(editingId?'Cancel Edit':'Close'):'Add Note'}</Button></div>
      {adding&&<Card><div className="space-y-3"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Note title" className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm"/><select value={topicId} onChange={e=>setTopicId(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm"><option value="">General / no topic</option>{selected.topics.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Paste or type your notes here…" rows={8} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm"/><div className="flex gap-2"><Button onClick={saveNote} disabled={!title.trim()||!content.trim()}>{editingId?'Save Changes':'Save Note'}</Button>{editingId&&<Button variant="secondary" onClick={resetForm}>Cancel</Button>}</div></div></Card>}
      {filteredNotes.length===0?<Card><EmptyState icon={<StickyNote size={28}/>} title="No notes yet" description="Add your class notes here. You can edit or delete them anytime."/></Card>:<div className="space-y-3">{filteredNotes.map(n=><Card key={n.id}><div className="flex justify-between gap-3"><div className="min-w-0"><h3 className="font-bold">{n.title}</h3><p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{n.content}</p></div><div className="flex gap-1 shrink-0"><button onClick={()=>editNote(n)} aria-label="Edit note" className="p-2 text-gray-400 hover:text-brand-600"><Pencil size={17}/></button><button onClick={()=>deleteNote(n.id)} aria-label="Delete note" className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={17}/></button></div></div></Card>)}</div>}</>:
      <>{filteredQuestions.length===0?<Card><EmptyState icon={<HelpCircle size={28}/>} title="No practice questions yet" description="Use AI Study Helper to generate practice questions from your notes."/></Card>:<div className="space-y-3">{filteredQuestions.map(q=><Card key={q.id}><p className="font-semibold text-gray-900">{q.question}</p><div className="mt-3">{revealedQuestions[q.id]?<div className="rounded-xl bg-green-50 p-3"><p className="text-sm text-green-800"><strong>Answer:</strong> {q.answer}</p></div>:<Button variant="secondary" size="sm" onClick={()=>setRevealedQuestions(prev=>({...prev,[q.id]:true}))}>Check Answer</Button>}</div><span className="text-xs text-gray-400 capitalize block mt-2">{q.difficulty}</span></Card>)}</div>}</>}
  </div>;
}
