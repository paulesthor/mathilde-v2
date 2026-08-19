import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import AdminSettings from './pages/AdminSettings';
import Login from './pages/Login';
import Legal from './pages/Legal';
import Success from './pages/Success';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { ToastProvider } from './contexts/ToastContext';
import { EditModeProvider } from './contexts/EditModeContext';
import EditModeToggle from './components/Editable/EditModeToggle';

// Placeholder Pages




// Panneau admin (hors /admin/login) : a son propre header/nav fixes (AdminLayout),
// donc la navbar/menu/footer/bouton d'édition du site public ne doivent pas se
// superposer par-dessus.
function isAdminPanelPath(pathname) {
  return pathname.startsWith('/admin') && pathname !== '/admin/login';
}

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isAdminPanel = isAdminPanelPath(location.pathname);

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdminPanel && (
        <>
          {/* Pass the toggle function to the Navbar */}
          <MinimalNavbar onMenuClick={() => setIsMenuOpen(true)} />

          {/* Full-screen menu overlay */}
          <FullScreenMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
      )}

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
          <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAdminPanel && (
        <>
          <MinimalFooter />
          <EditModeToggle />
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
    <ToastProvider>
    <EditModeProvider>
    <HashRouter>
      <ScrollToTop />
      <AppContent />
    </HashRouter>
    </EditModeProvider>
    </ToastProvider>
    </HelmetProvider>
  );
}

export default App;
