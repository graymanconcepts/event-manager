import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../../../utils/api/config';

interface Speaker {
  id: number;
  name: string;
  company: string;
  role: string;
  image_url: string;
}

const SpeakerList = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSpeakers();
  }, []);

  const fetchSpeakers = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(`${API_CONFIG.baseUrl}/api/speakers`, {
        headers: API_CONFIG.getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch speakers: ${response.statusText}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }

      setSpeakers(data);
    } catch (error) {
      console.error('Error fetching speakers:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch speakers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this speaker?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(`${API_CONFIG.baseUrl}/api/speakers/${id}`, {
        method: 'DELETE',
        headers: API_CONFIG.getAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error(`Failed to delete speaker: ${response.statusText}`);
      }

      setSpeakers(speakers.filter(speaker => speaker.id !== id));
    } catch (error) {
      console.error('Error deleting speaker:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete speaker');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Speakers</h1>
        <a
          href="/admin/speakers/new"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary"
        >
          Add Speaker
        </a>
      </div>

      {speakers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No speakers found. Add your first speaker!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {speakers.map(speaker => (
            <div key={speaker.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <img
                src={speaker.image_url || '/placeholder-speaker.jpg'}
                alt={speaker.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-speaker.jpg';
                }}
              />
              <h2 className="text-xl font-semibold text-center mb-2">{speaker.name}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
                {speaker.role} at {speaker.company}
              </p>
              <div className="flex justify-center space-x-4">
                <a
                  href={`/admin/speakers/${speaker.id}/edit`}
                  className="text-primary hover:text-secondary"
                >
                  Edit
                </a>
                <button
                  onClick={() => handleDelete(speaker.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpeakerList;