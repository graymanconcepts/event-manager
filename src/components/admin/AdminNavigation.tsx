import { useEffect, useState } from 'react';

const AdminNavigation = () => {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('adminToken');
    setIsLoggedIn(!!token);
    setCurrentPath(window.location.pathname);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  const isActive = (path: string) => {
    if (path === '/admin' && currentPath === '/admin') {
      return true;
    }
    return currentPath.startsWith(path) && path !== '/admin';
  };

  const linkClass = (path: string) => {
    return `transition-colors ${
      isActive(path)
        ? 'text-white font-semibold border-b-2 border-white'
        : 'text-gray-300 hover:text-white'
    }`;
  };

  if (!mounted) return null;
  if (!isLoggedIn) return null;

  return (
    <nav className="bg-primary dark:bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="/admin" className={`text-xl font-bold ${linkClass('/admin')}`}>Admin Dashboard</a>
            <div className="hidden md:flex space-x-4 ml-8">
              <a href="/admin/schedule" className={linkClass('/admin/schedule')}>Schedule</a>
              <a href="/admin/speakers" className={linkClass('/admin/speakers')}>Speakers</a>
              <a href="/admin/talks" className={linkClass('/admin/talks')}>Talks</a>
              <a href="/admin/registrations" className={linkClass('/admin/registrations')}>Registrations</a>
              <a href="/admin/content" className={linkClass('/admin/content')}>Content</a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="/"
              className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              <span>View Site</span>
            </a>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;