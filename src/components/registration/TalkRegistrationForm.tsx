import React, { useState } from 'react';
import { apiRequest } from '../../utils/api/client';
import { API_CONFIG } from '../../utils/api/config';

interface TalkRegistrationFormProps {
  talkId: number;
}

const TalkRegistrationForm: React.FC<TalkRegistrationFormProps> = ({ talkId }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    dietary_requirements: '',
    ticket_type: 'regular'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSubmitting(true);

    try {
      console.log('Submitting registration:', formData);
      
      // Step 1: Create the registration
      const registration = await apiRequest(API_CONFIG.endpoints.registrations.create, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (!registration || !registration.id) {
        throw new Error('Failed to create registration');
      }

      console.log('Registration created:', registration);

      // Step 2: Register for the talk
      const talkRegistration = await apiRequest(API_CONFIG.endpoints.talkRegistrations.create, {
        method: 'POST',
        body: JSON.stringify({
          registration_id: registration.id,
          talk_id: talkId
        })
      });

      console.log('Talk registration created:', talkRegistration);

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        company: '',
        dietary_requirements: '',
        ticket_type: 'regular'
      });

      // Redirect after successful registration
      setTimeout(() => {
        window.location.href = '/talks';
      }, 2000);

    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (success) {
    return (
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
        <span className="block sm:inline">Successfully registered! Redirecting to talks list...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Company
        </label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="ticket_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Ticket Type
        </label>
        <select
          id="ticket_type"
          name="ticket_type"
          required
          value={formData.ticket_type}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="regular">Regular</option>
          <option value="vip">VIP</option>
          <option value="student">Student</option>
        </select>
      </div>

      <div>
        <label htmlFor="dietary_requirements" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Dietary Requirements
        </label>
        <textarea
          id="dietary_requirements"
          name="dietary_requirements"
          value={formData.dietary_requirements}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isSubmitting ? 'Registering...' : 'Register for Talk'}
        </button>
      </div>
    </form>
  );
};

export default TalkRegistrationForm;
