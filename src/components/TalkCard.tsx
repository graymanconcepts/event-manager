import { useState } from 'react';
import type { Talk, Speaker } from '../utils/api/types';

interface TalkCardProps {
  talk: Talk;
  speaker?: Speaker;
}

export default function TalkCard({ talk, speaker }: TalkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          {talk.title}
        </h2>
        {speaker && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Presented by{' '}
            <a 
              href={`/speakers/${speaker.id}`}
              className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary underline"
            >
              {speaker.name}
            </a>
            {speaker.company && ` - ${speaker.company}`}
          </p>
        )}
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {new Date(talk.start_time).toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
          {talk.room && ` - ${talk.room}`}
        </p>
        
        {talk.description && (
          <div className="mt-4">
            <div
              className={`transition-all duration-300 overflow-hidden ${
                isExpanded ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {talk.description}
              </p>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-block bg-primary hover:bg-primary-dark text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
