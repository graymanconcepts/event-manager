import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api/client';
import type { Talk, Speaker } from '../../utils/api/types';
import { API_CONFIG } from '../../utils/api/config';

interface TalkEditFormProps {
  talkId: string;
  initialData?: Talk;
}

// Helper function to format ISO datetime to local datetime-local format
const formatDateForInput = (isoString: string) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    // Format to YYYY-MM-DDThh:mm
    return date.toISOString().slice(0, 16);
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
};

const TalkEditForm: React.FC<TalkEditFormProps> = ({ talkId, initialData }) => {
  const [formData, setFormData] = useState<Talk>(initialData ? {
    ...initialData,
    start_time: formatDateForInput(initialData.start_time),
    end_time: formatDateForInput(initialData.end_time)
  } : {
    id: parseInt(talkId),
    title: '',
    description: '',
    speaker_id: 0,
    start_time: '',
    end_time: '',
    room: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        start_time: formatDateForInput(initialData.start_time),
        end_time: formatDateForInput(initialData.end_time)
      });
    }
    fetchSpeakers();
  }, [initialData]);

  const fetchSpeakers = async () => {
    try {
      const response = await apiRequest<Speaker[]>(API_CONFIG.endpoints.speakers.list);
      setSpeakers(response);
    } catch (err) {
      console.error('Failed to fetch speakers:', err);
      setError('Failed to load speakers. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSuccess(false);

    try {
      // Convert datetime-local values to ISO format for API
      const apiFormData = {
        ...formData,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : null,
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null
      };

      await apiRequest(API_CONFIG.endpoints.talks.update(parseInt(talkId)), {
        method: 'PUT',
        body: JSON.stringify(apiFormData)
      });
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/admin/talks';
      }, 1500);
    } catch (err) {
      console.error('Failed to update talk:', err);
      setError(err instanceof Error ? err.message : 'Failed to update talk');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'speaker_id' ? parseInt(value) : value
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          Talk updated successfully! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="speaker_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Speaker
          </label>
          <select
            id="speaker_id"
            name="speaker_id"
            value={formData.speaker_id}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-primary focus:ring-primary"
          >
            <option value="">Select a speaker</option>
            {speakers.map(speaker => (
              <option key={speaker.id} value={speaker.id}>
                {speaker.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Time
            </label>
            <input
              type="datetime-local"
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              End Time
            </label>
            <input
              type="datetime-local"
              id="end_time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="room" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Room
          </label>
          <input
            type="text"
            id="room"
            name="room"
            value={formData.room}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 shadow-sm focus:border-primary focus:ring-primary"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => window.location.href = '/admin/talks'}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TalkEditForm;
