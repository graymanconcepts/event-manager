import { useState } from 'react';

interface TalkFormProps {
  speakers: Array<{
    id: number;
    name: string;
    company: string;
  }>;
}

export default function TalkForm({ speakers }: TalkFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      
      const talkData = {
        title: formData.get('title'),
        description: formData.get('description'),
        speaker_id: parseInt(formData.get('speaker_id') as string),
        start_time: new Date(formData.get('start_time') as string).toISOString(),
        end_time: new Date(formData.get('end_time') as string).toISOString(),
        room: formData.get('room')
      };

      const response = await fetch('/api/talks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(talkData)
      });

      if (response.ok) {
        window.location.href = '/admin/talks';
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create talk');
      }
    } catch (error) {
      console.error('Error creating talk:', error);
      alert('Failed to create talk');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-200">Add Talk</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1 text-gray-200">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1 text-gray-200">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            required
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="speaker_id" className="block text-sm font-medium mb-1 text-gray-200">
            Speaker
          </label>
          <select
            id="speaker_id"
            name="speaker_id"
            required
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-primary focus:border-primary"
          >
            <option value="">Select a speaker</option>
            {speakers.map((speaker) => (
              <option key={speaker.id} value={speaker.id}>
                {speaker.name} ({speaker.company})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium mb-1 text-gray-200">
              Start Time
            </label>
            <input
              type="datetime-local"
              id="start_time"
              name="start_time"
              required
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="end_time" className="block text-sm font-medium mb-1 text-gray-200">
              End Time
            </label>
            <input
              type="datetime-local"
              id="end_time"
              name="end_time"
              required
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="room" className="block text-sm font-medium mb-1 text-gray-200">
            Room
          </label>
          <input
            type="text"
            id="room"
            name="room"
            required
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.location.href = '/admin/talks'}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Talk'}
          </button>
        </div>
      </form>
    </div>
  );
}