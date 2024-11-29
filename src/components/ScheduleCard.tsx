import React from 'react';
import type { Talk } from '../utils/api/types';

interface ScheduleCardProps {
  talk: Talk;
}

export default function ScheduleCard({ talk }: ScheduleCardProps) {
  const startTime = new Date(talk.start_time);
  const endTime = new Date(talk.end_time);

  const formatTime = (date: Date) => {
    if (isNaN(date.getTime())) {
      return 'Time TBD';
    }
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    if (isNaN(date.getTime())) {
      return 'Date TBD';
    }
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="border-l-4 border-blue-400 pl-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-gray-600 dark:text-gray-400">
          {formatTime(startTime)} - {formatTime(endTime)}
        </p>
        {talk.room && (
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
            Room {talk.room}
          </span>
        )}
      </div>
      <h3 className="text-xl font-semibold dark:text-white mb-1">{talk.title}</h3>
      {talk.speaker && (
        <p className="text-gray-700 dark:text-gray-300">
          Speaker: {talk.speaker.name}
          {talk.speaker.role && (
            <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
              ({talk.speaker.role})
            </span>
          )}
        </p>
      )}
      <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">
        {talk.description}
      </p>
    </div>
  );
}
