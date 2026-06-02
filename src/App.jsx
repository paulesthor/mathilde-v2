import { HashRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import MinimalNavbar from './components/Layout/MinimalNavbar';
import FullScreenMenu from './components/Layout/FullScreenMenu';
import MinimalFooter from './components/Layout/MinimalFooter';
import Home from './pages/Home';
import Realisations from './pages/Realisations';
import Prestations from './pages/Prestations';
import Creations from './pages/Creations';
import Dispo from './pages/Dispo';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminReviews from './pages/AdminReviews';
import AdminProducts from './pages/AdminProducts';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder Pages




function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <HashRouter>
      <div className="flex min-h-screen flex-col">
        {/* Pass the toggle function to the Navbar */}
        <MinimalNavbar onMenuClick={() => setIsMenuOpen(true)} />

        {/* Full-screen menu overlay */}
        <FullScreenMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/realisations" element={<Realisations />} />
            <Route path="/prestations" element={<Prestations />} />
            <Route path="/creations" element={<Creations />} />
            <Route path="/dispo" element={<Dispo />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviews /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
          </Routes>
        </main>

        <MinimalFooter />
      </div>
    </HashRouter>
  );
}

export default App;
