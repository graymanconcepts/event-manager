import { db } from '../../../db';
import { verifyAdminToken } from '../../../utils/auth';

export async function get({ params }) {
  try {
    const talk = await db('talks')
      .select(
        'talks.*',
        'speakers.name as speaker_name',
        'speakers.company as speaker_company'
      )
      .leftJoin('speakers', 'talks.speaker_id', 'speakers.id')
      .where('talks.id', params.id)
      .first();

    if (!talk) {
      return new Response(JSON.stringify({ message: 'Talk not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify(talk), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching talk:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch talk' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function put({ request, params }) {
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

    const [updatedTalk] = await db('talks')
      .where({ id: params.id })
      .update({
        title: talk.title,
        description: talk.description,
        speaker_id: talk.speaker_id,
        room: talk.room,
        start_time: talk.start_time,
        end_time: talk.end_time
      })
      .returning('*');

    if (!updatedTalk) {
      return new Response(JSON.stringify({ message: 'Talk not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Add speaker information to response
    updatedTalk.speaker_name = speaker.name;
    updatedTalk.speaker_company = speaker.company;

    return new Response(JSON.stringify(updatedTalk), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error updating talk:', error);
    return new Response(JSON.stringify({ message: 'Failed to update talk' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function del({ request, params }) {
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

    const deletedCount = await db('talks')
      .where({ id: params.id })
      .del();

    if (!deletedCount) {
      return new Response(JSON.stringify({ message: 'Talk not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({ message: 'Talk deleted successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error deleting talk:', error);
    return new Response(JSON.stringify({ message: 'Failed to delete talk' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
