import { useEffect, useState } from 'react';

const AdminNavigation = () => {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('adminToken');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  if (!mounted) return null;
  if (!isLoggedIn) return null;

  return (
    <nav className="bg-primary dark:bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="/admin" className="text-xl font-bold">Admin Dashboard</a>
            <div className="hidden md:flex space-x-4 ml-8">
              <a href="/admin/schedule" className="hover:text-gray-200">Schedule</a>
              <a href="/admin/speakers" className="hover:text-gray-200">Speakers</a>
              <a href="/admin/talks" className="hover:text-gray-200">Talks</a>
              <a href="/admin/registrations" className="hover:text-gray-200">Registrations</a>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;