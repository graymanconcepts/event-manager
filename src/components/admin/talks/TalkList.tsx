import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

interface Talk {
  id: number;
  title: string;
  description: string;
  speaker_id: number;
  start_time: string;
  end_time: string;
  room: string;
}

interface Speaker {
  id: number;
  name: string;
}

const TalkList = () => {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTalks();
  }, []);

  const fetchTalks = async () => {
    try {
      const token = Cookies.get('adminToken');
      if (!token) {
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch('http://localhost:3000/api/talks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to fetch talks');
      }

      const data = await response.json();
      setTalks(data);
    } catch (error) {
      console.error('Error fetching talks:', error);
      setError('Failed to load talks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this talk?')) return;

    try {
      const token = Cookies.get('adminToken');
      if (!token) {
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(`http://localhost:3000/api/talks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        throw new Error('Failed to delete talk');
      }

      setTalks(talks.filter(talk => talk.id !== id));
    } catch (error) {
      console.error('Error deleting talk:', error);
      alert('Failed to delete talk. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Talks</h1>
        <a
          href="/admin/talks/new"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary"
        >
          Schedule Talk
        </a>
      </div>

      <div className="grid gap-6">
        {talks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No talks scheduled yet.
          </div>
        ) : (
          talks.map(talk => (
            <div key={talk.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">{talk.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{talk.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Start:</span>{' '}
                      {new Date(talk.start_time).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">End:</span>{' '}
                      {new Date(talk.end_time).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Room:</span> {talk.room}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-4 ml-4">
                  <a
                    href={`/admin/talks/${talk.id}/edit`}
                    className="text-primary hover:text-secondary flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Edit
                  </a>
                  <button
                    onClick={() => handleDelete(talk.id)}
                    className="text-red-600 hover:text-red-800 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TalkList;