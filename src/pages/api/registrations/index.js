import { db } from '../../../db';

export async function get({ request }) {
  try {
    const registrations = await db('registrations')
      .select('*')
      .orderBy('created_at', 'desc');

    return new Response(JSON.stringify(registrations), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch registrations' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function post({ request }) {
  try {
    const registration = await request.json();

    // Validate required fields
    if (!registration.name || !registration.email || !registration.ticketType || !registration.amount) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Insert the registration with the expected schema
    const [newRegistration] = await db('registrations')
      .insert({
        name: registration.name,
        email: registration.email,
        ticket_type: registration.ticketType,
        company: registration.company || '',
        payment_status: 'paid',
        status: 'active',
        payment_amount: registration.amount,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return new Response(JSON.stringify(newRegistration), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating registration:', error);
    return new Response(JSON.stringify({ message: 'Failed to create registration' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
