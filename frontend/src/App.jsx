import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import WalletConnect from './components/WalletConnect';
import EventPage from './pages/EventPage';
import NotesPage from './pages/NotesPage';
import VotingPage from './pages/VotingPage';
import './CSS/global.css'; 

const App = () => (
  <WalletProvider>
    <Router>
      <div>
        <nav>
          <ul>
            <li><Link to="/event-page">EventPage</Link></li>
            <li><Link to="/notes-page">NotesPage</Link></li>
            <li><Link to="/voting-page">VotingPage</Link></li>
          </ul>
        </nav>

        <div className="container">
          <WalletConnect />
          
          <Routes>
            <Route path="/event-page" element={<EventPage />} />
            <Route path="/notes-page" element={<NotesPage />} />
            <Route path="/voting-page" element={<VotingPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  </WalletProvider>
);

export default App;
