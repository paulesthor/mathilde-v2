import { HashRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
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
import AdminOrders from './pages/AdminOrders';
import AdminContacts from './pages/AdminContacts';
import Login from './pages/Login';
import Legal from './pages/Legal';
import Success from './pages/Success';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder Pages




function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <HelmetProvider>
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
            <Route path="/legal" element={<Legal />} />
            <Route path="/success" element={<Success />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviews /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/contacts" element={<ProtectedRoute><AdminContacts /></ProtectedRoute>} />
          </Routes>
        </main>

        <MinimalFooter />
      </div>
    </HashRouter>
    </HelmetProvider>
  );
}

export default App;
