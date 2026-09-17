import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CriticalNodes from './pages/CriticalNodes';
import ShortestPath from './pages/ShortestPath';
import NetworkGraph from './pages/NetworkGraph';
import NetworkSelector from './components/NetworkSelector';
import NetworkBuilder from './pages/NetworkBuilder';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RequireAuth from './components/RequireAuth';
import { useAuth } from './context/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm transition-colors ${
    isActive
      ? 'bg-accent/15 text-accent font-medium'
      : 'text-text-muted hover:text-text-primary hover:bg-panel-border/40'
  }`;

function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-panel-border bg-panel px-4 py-6">
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

        <div className="mt-auto border-t border-panel-border px-3 pt-4">
          <p className="truncate font-mono text-xs text-text-muted">{user?.email}</p>
          <button onClick={handleLogout} className="mt-1 text-xs text-risk-high hover:underline">
            Log out
          </button>
        </div>
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

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
