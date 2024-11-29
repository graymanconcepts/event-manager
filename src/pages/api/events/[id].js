import { db } from '../../../db';
import { verifyAdminToken } from '../../../utils/auth';

export async function get({ params }) {
  try {
    const event = await db('events')
      .where({ id: params.id })
      .first();

    if (!event) {
      return new Response(JSON.stringify({ message: 'Event not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify(event), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch event' }), {
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

    const [updatedEvent] = await db('events')
      .where({ id: params.id })
      .update({
        title: event.title,
        description: event.description,
        type: event.type,
        location: event.location,
        start_time: event.start_time,
        end_time: event.end_time
      })
      .returning('*');

    if (!updatedEvent) {
      return new Response(JSON.stringify({ message: 'Event not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify(updatedEvent), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return new Response(JSON.stringify({ message: 'Failed to update event' }), {
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

    const deletedCount = await db('events')
      .where({ id: params.id })
      .del();

    if (!deletedCount) {
      return new Response(JSON.stringify({ message: 'Event not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({ message: 'Event deleted successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return new Response(JSON.stringify({ message: 'Failed to delete event' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
