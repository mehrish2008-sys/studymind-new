import { useState } from 'react';
import { Auth } from '@/components/Auth';
import { AppStateProvider } from '@/store';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/sections/Dashboard';
import { Timetable } from '@/sections/Timetable';
import { Subjects } from '@/sections/Subjects';
import { Revision } from '@/sections/Revision';
import { Quizzes } from '@/sections/Quizzes';
import { Tasks } from '@/sections/Tasks';
import { Exams } from '@/sections/Exams';
import { Progress } from '@/sections/Progress';
import { SavedResources } from '@/sections/SavedResources';
import { AIHelper } from '@/sections/AIHelper';
import { Plans } from '@/sections/Plans';
import type { SectionId } from '@/types';

function App() {
  const [active, setActive] = useState<SectionId>('dashboard');

  return (
    <Auth>
      <AppStateProvider>
        <Layout active={active} onNavigate={setActive}>
          {active === 'dashboard' && (
            <Dashboard onNavigate={setActive} />
          )}

          {active === 'timetable' && <Timetable />}

          {active === 'subjects' && <Subjects />}

          {active === 'revision' && <Revision />}

          {active === 'quizzes' && <Quizzes />}

          {active === 'tasks' && <Tasks />}

          {active === 'exams' && <Exams />}

          {active === 'progress' && <Progress />}

          {active === 'saved' && (
            <SavedResources onNavigate={setActive} />
          )}

          {active === 'ai' && <AIHelper />}

          {active === 'plans' && <Plans />}
        </Layout>
      </AppStateProvider>
    </Auth>
  );
}

export default App;