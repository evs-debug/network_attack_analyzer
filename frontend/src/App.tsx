import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CriticalNodes from './pages/CriticalNodes';
import ShortestPath from './pages/ShortestPath';
import NetworkGraph from './pages/NetworkGraph';

const navStyle = ({ isActive }: { isActive: boolean }) => ({
  marginRight: '1rem',
  fontWeight: isActive ? 700 : 400,
  color: isActive ? '#059669' : '#475569',
  textDecoration: 'none',
});

function App() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #eee' }}>
        <NavLink to="/" end style={navStyle}>Risk Report</NavLink>
        <NavLink to="/critical-nodes" style={navStyle}>Critical Nodes</NavLink>
        <NavLink to="/shortest-path" style={navStyle}>Shortest Path</NavLink>
        <NavLink to="/network" style={navStyle}>Network Graph</NavLink>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/critical-nodes" element={<CriticalNodes />} />
        <Route path="/shortest-path" element={<ShortestPath />} />
        <Route path="/network" element={<NetworkGraph />} />
      </Routes>
    </div>
  );
}

export default App;
