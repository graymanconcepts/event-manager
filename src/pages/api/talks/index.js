import { db } from '../../../db';
import { verifyAdminToken } from '../../../utils/auth';

export async function get({ request }) {
  try {
    const talks = await db('talks')
      .select(
        'talks.*',
        'speakers.name as speaker_name',
        'speakers.company as speaker_company'
      )
      .leftJoin('speakers', 'talks.speaker_id', 'speakers.id')
      .orderBy('talks.start_time', 'asc');

    return new Response(JSON.stringify(talks), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching talks:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch talks' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function post({ request }) {
  try {
    const adminToken = request.headers.get('authorization')?.split(' ')[1];
    if (!verifyAdminToken(adminToken)) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const talk = await request.json();

    // Validate required fields
    if (!talk.title || !talk.speaker_id || !talk.start_time || !talk.end_time) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Check if speaker exists
    const speaker = await db('speakers')
      .where({ id: talk.speaker_id })
      .first();

    if (!speaker) {
      return new Response(JSON.stringify({ message: 'Speaker not found' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const [newTalk] = await db('talks')
      .insert({
        title: talk.title,
        description: talk.description,
        speaker_id: talk.speaker_id,
        room: talk.room,
        start_time: talk.start_time,
        end_time: talk.end_time
      })
      .returning('*');

    // Add speaker information to response
    newTalk.speaker_name = speaker.name;
    newTalk.speaker_company = speaker.company;

    return new Response(JSON.stringify(newTalk), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating talk:', error);
    return new Response(JSON.stringify({ message: 'Failed to create talk' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
