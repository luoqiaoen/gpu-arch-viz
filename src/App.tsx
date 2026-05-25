import { useAppStore } from './store/useAppStore';
import { TopBar } from './panels/TopBar';
import { ExplorerView } from './views/ExplorerView';
import { LearnView } from './views/LearnView';

export default function App() {
  const view = useAppStore((s) => s.view);
  return (
    <div className="h-full flex flex-col bg-bg">
      <TopBar />
      <div className="flex-1 min-h-0">
        {view === 'explorer' ? <ExplorerView /> : <LearnView />}
      </div>
    </div>
  );
}
