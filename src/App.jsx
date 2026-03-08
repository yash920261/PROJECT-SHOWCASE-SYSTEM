import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Projects } from './pages/Projects';
import { SubmitProject } from './pages/SubmitProject';

// Placeholders for remaining Pages
import { ProjectDetail, Forum, Faculty, Voting, Group, Analytics } from './pages/index';

import './index.css'; 

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/submit-project" element={<SubmitProject />} />
            
            {/* Project views */}
            <Route path="/project/:id" element={<ProjectDetail />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/faculty" element={<Faculty />} />
            <Route path="/voting" element={<Voting />} />
            <Route path="/groups" element={<Group />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
