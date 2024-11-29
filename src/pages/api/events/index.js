import { db } from '../../../db';
import { verifyAdminToken } from '../../../utils/auth';

export async function get({ request }) {
  try {
    const events = await db('events')
      .select('*')
      .orderBy('start_time', 'asc');

    return new Response(JSON.stringify(events), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch events' }), {
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

    const event = await request.json();

    // Validate required fields
    if (!event.title || !event.type || !event.start_time || !event.end_time) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const [newEvent] = await db('events')
      .insert({
        title: event.title,
        description: event.description,
        type: event.type,
        location: event.location,
        start_time: event.start_time,
        end_time: event.end_time
      })
      .returning('*');

    return new Response(JSON.stringify(newEvent), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return new Response(JSON.stringify({ message: 'Failed to create event' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
