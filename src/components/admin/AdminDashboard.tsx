import React, { useEffect, useState } from 'react';

interface Stats {
  speakers: number;
  talks: number;
  registrations: number;
  events: number;
}

interface Update {
  id: number;
  type: 'registration' | 'talk' | 'event' | 'speaker';
  message: string;
  timestamp: string;
}

interface Registration {
  id: number;
  name: string;
  company?: string;
  created_at: string;
}

interface Talk {
  id: number;
  title: string;
  created_at: string;
}

interface Event {
  id: number;
  name: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    speakers: 0,
    talks: 0,
    registrations: 0,
    events: 0
  });
  const [recentUpdates, setRecentUpdates] = useState<Update[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          window.location.href = '/admin/login';
          return;
        }

        const fetchWithAuth = async (url: string) => {
          const response = await fetch(url, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        };

        const [speakers, talks, registrations, events] = await Promise.all([
          fetchWithAuth('http://localhost:3000/api/speakers'),
          fetchWithAuth('http://localhost:3000/api/talks'),
          fetchWithAuth('http://localhost:3000/api/registrations'),
          fetchWithAuth('http://localhost:3000/api/events')
        ]);

        setStats({
          speakers: speakers.length,
          talks: talks.length,
          registrations: registrations.length,
          events: events.length
        });

        // Get most recent items for updates
        const updates: Update[] = [
          ...registrations.slice(-3).map((reg: Registration) => ({
            id: reg.id,
            type: 'registration' as const,
            message: `New registration: ${reg.name} from ${reg.company || 'Individual'}`,
            timestamp: new Date(reg.created_at).toLocaleString()
          })),
          ...talks.slice(-2).map((talk: Talk) => ({
            id: talk.id,
            type: 'talk' as const,
            message: `New talk scheduled: "${talk.title}"`,
            timestamp: new Date(talk.created_at).toLocaleString()
          })),
          ...events.slice(-2).map((event: Event) => ({
            id: event.id,
            type: 'event' as const,
            message: `New event added: "${event.name}"`,
            timestamp: new Date(event.created_at).toLocaleString()
          }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
         .slice(0, 5);

        setRecentUpdates(updates);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-4">
          <a
            href="/admin/schedule"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary text-center"
          >
            Manage Schedule
          </a>
          <a
            href="/admin/talks/new"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary text-center"
          >
            Add Talk
          </a>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Conference Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Schedule Items</div>
              <div className="text-2xl font-bold text-primary">{stats.events + stats.talks}</div>
              <a href="/admin/schedule" className="text-primary hover:text-secondary text-sm">
                View Schedule →
              </a>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Speakers</div>
              <div className="text-2xl font-bold text-primary">{stats.speakers}</div>
              <a href="/admin/speakers" className="text-primary hover:text-secondary text-sm">
                View Speakers →
              </a>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Talks</div>
              <div className="text-2xl font-bold text-primary">{stats.talks}</div>
              <a href="/admin/talks" className="text-primary hover:text-secondary text-sm">
                View Talks →
              </a>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Registrations</div>
              <div className="text-2xl font-bold text-primary">{stats.registrations}</div>
              <a href="/admin/registrations" className="text-primary hover:text-secondary text-sm">
                View All →
              </a>
            </div>
          </div>
        </div>

        {/* Recent Updates Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Recent Updates</h2>
          <div className="space-y-3">
            {recentUpdates.map((update) => (
              <div 
                key={`${update.type}-${update.id}`}
                className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {update.type === 'registration' && (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 0112 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  )}
                  {update.type === 'talk' && (
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  {update.type === 'event' && (
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{update.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{update.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;