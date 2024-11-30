import React from 'react';
import type { Speaker } from '../utils/api/types';

interface SpeakerCardProps {
  speaker: Speaker;
}

export default function SpeakerCard({ speaker }: SpeakerCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
      <div className="mb-6 flex justify-center">
        <img 
          src={speaker.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(speaker.name)}&background=random`}
          alt={speaker.name} 
          className="w-32 h-32 rounded-full object-cover border-4 border-blue-400 shadow-lg"
        />
      </div>
      <a 
        href={`/speakers/${speaker.id}`}
        className="inline-block"
      >
        <h2 className="text-2xl font-bold mb-2 dark:text-white hover:text-primary dark:hover:text-primary-light transition-colors">
          {speaker.name}
        </h2>
      </a>
      <div className="space-y-2">
        <p className="text-gray-600 dark:text-gray-300">{speaker.role}</p>
        {speaker.company && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">{speaker.company}</p>
        )}
      </div>
      {speaker.bio && (
        <p className="text-gray-700 dark:text-gray-200 mt-4 mb-4 text-sm line-clamp-3">{speaker.bio}</p>
      )}
      {speaker.talkTitle && (
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full py-2 px-4 inline-block">
          <p className="text-blue-600 dark:text-blue-300">Speaking on: {speaker.talkTitle}</p>
        </div>
      )}
    </div>
  );
}
