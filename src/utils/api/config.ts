import { z } from 'zod';
import type { LoginResponse } from './types';

export { type LoginResponse };

export const API_CONFIG = {
  baseUrl: 'http://localhost:3000',
  endpoints: {
    auth: {
      login: '/api/auth/login'
    },
    speakers: {
      list: '/api/speakers',
      create: '/api/speakers',
      get: (id: number) => `/api/speakers/${id}`,
      update: (id: number) => `/api/speakers/${id}`,
      delete: (id: number) => `/api/speakers/${id}`
    },
    talks: {
      list: '/api/talks',
      create: '/api/talks',
      get: (id: number) => `/api/talks/${id}`,
      update: (id: number) => `/api/talks/${id}`,
      delete: (id: number) => `/api/talks/${id}`
    },
    registrations: {
      create: '/api/registrations',
      list: '/api/registrations',
      get: (id: number) => `/api/registrations/${id}`,
      update: (id: number) => `/api/registrations/${id}`,
      delete: (id: number) => `/api/registrations/${id}`
    },
    talkRegistrations: {
      create: '/api/talk-registrations',
      list: (talkId: number) => `/api/talk-registrations/talk/${talkId}`,
      listForRegistration: (registrationId: number) => `/api/talk-registrations/registration/${registrationId}`,
      delete: (registrationId: number, talkId: number) => `/api/talk-registrations/${registrationId}/${talkId}`
    }
  },
  defaultHeaders: {
    'Content-Type': 'application/json'
  }
};

export const LoginResponseSchema = z.object({
  token: z.string()
});