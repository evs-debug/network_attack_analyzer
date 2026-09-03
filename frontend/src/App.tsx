import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CriticalNodes from './pages/CriticalNodes';
import ShortestPath from './pages/ShortestPath';
import NetworkGraph from './pages/NetworkGraph';
import NetworkSelector from './components/NetworkSelector';
import NetworkBuilder from './pages/NetworkBuilder';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm transition-colors ${
    isActive
      ? 'bg-accent/15 text-accent font-medium'
      : 'text-text-muted hover:text-text-primary hover:bg-panel-border/40'
  }`;

function App() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-panel-border bg-panel px-4 py-6">
        <div className="mb-6 px-3">
          <p className="font-mono text-xs tracking-wide text-text-muted">SECURITY ANALYSIS</p>
          <h1 className="text-lg font-semibold text-text-primary">Network Attack Analyzer</h1>
        </div>
        <NetworkSelector />
        <nav className="flex flex-col gap-1">
          <NavLink to="/" end className={navLinkClass}>Risk Report</NavLink>
          <NavLink to="/critical-nodes" className={navLinkClass}>Critical Nodes</NavLink>
          <NavLink to="/shortest-path" className={navLinkClass}>Shortest Path</NavLink>
          <NavLink to="/network" className={navLinkClass}>Network Graph</NavLink>
          <NavLink to="/builder" className={navLinkClass}>Network Builder</NavLink>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/critical-nodes" element={<CriticalNodes />} />
          <Route path="/shortest-path" element={<ShortestPath />} />
          <Route path="/network" element={<NetworkGraph />} />
          <Route path="/builder" element={<NetworkBuilder />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;