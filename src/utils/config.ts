// API configuration
export const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3000/api'
  : '/api';

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login'
  },
  speakers: {
    list: '/speakers',
    create: '/speakers',
    update: (id: number) => `/speakers/${id}`,
    delete: (id: number) => `/speakers/${id}`
  },
  talks: {
    list: '/talks',
    create: '/talks',
    update: (id: number) => `/talks/${id}`,
    delete: (id: number) => `/talks/${id}`
  },
  registrations: {
    list: '/registrations',
    create: '/registrations',
    delete: (id: number) => `/registrations/${id}`
  }
};