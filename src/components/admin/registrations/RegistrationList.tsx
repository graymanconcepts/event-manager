import React, { useEffect, useState } from 'react';

interface Registration {
  id: number;
  name: string;
  email: string;
  company: string;
  ticket_type: string;
  created_at: string;
  payment_status: 'paid' | 'pending' | 'refunded';
  status: 'active' | 'cancelled';
  payment_amount: number;
}

const RegistrationList = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3000/api/registrations', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (registration: Registration) => {
    if (registration.status === 'cancelled') {
      alert('This registration is already cancelled.');
      return;
    }

    if (registration.payment_status === 'paid') {
      setSelectedRegistration(registration);
      setShowRefundModal(true);
    } else {
      await processCancellation(registration.id);
    }
  };

  const processCancellation = async (id: number, refundNotes?: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3000/api/registrations/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ refundNotes })
      });

      if (response.ok) {
        await fetchRegistrations(); // Refresh the list
        setShowRefundModal(false);
        setSelectedRegistration(null);
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      alert('Failed to cancel registration. Please try again.');
    }
  };

  const RefundModal = () => {
    const [refundNotes, setRefundNotes] = useState('');

    if (!selectedRegistration) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Process Refund</h2>
          <p className="mb-4">
            Registration for: {selectedRegistration.name}<br />
            Amount to refund: ${selectedRegistration.payment_amount}
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Refund Notes</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              value={refundNotes}
              onChange={(e) => setRefundNotes(e.target.value)}
              placeholder="Enter any notes about the refund..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowRefundModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => processCancellation(selectedRegistration.id, refundNotes)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              Process Refund & Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Registrations</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Ticket Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Payment Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Registration Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Registration Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {registrations.map(registration => (
              <tr key={registration.id} className={registration.status === 'cancelled' ? 'bg-gray-50 dark:bg-gray-900' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {registration.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {registration.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {registration.company}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {registration.ticket_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${registration.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                      registration.payment_status === 'refunded' ? 'bg-gray-100 text-gray-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {registration.payment_status ? 
                      registration.payment_status.charAt(0).toUpperCase() + registration.payment_status.slice(1) 
                      : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${registration.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                    {registration.status ? 
                      registration.status.charAt(0).toUpperCase() + registration.status.slice(1)
                      : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {new Date(registration.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <button
                    onClick={() => handleCancelRegistration(registration)}
                    disabled={registration.status === 'cancelled'}
                    className={`inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white 
                      ${registration.status === 'cancelled'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                      }`}
                  >
                    {registration.status === 'cancelled' ? 'Cancelled' : 'Cancel Registration'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showRefundModal && <RefundModal />}
    </div>
  );
};

export default RegistrationList;