# Event Manager

A modern, full-stack event management platform designed for tech conferences and professional events. Built with Astro and Express, it provides a seamless experience for both attendees and event organizers.

## 📱 User Interface

### Home Page
![Home Page](./readme-img/home.png)

The public-facing interface offers:
- Dynamic hero section highlighting upcoming events
- Featured talks and speaker showcase
- Real-time event statistics and updates
- Streamlined registration process
- Responsive design for all devices

### Admin Dashboard
![Admin Dashboard](./readme-img/admin-dashboard.png)

The admin interface provides:
- Comprehensive event management tools
- Content management system
- Speaker and talk administration
- Registration tracking
- Real-time analytics

## 🎯 Core Features

### For Attendees
- **Event Discovery**: Browse upcoming tech events and conferences
- **Speaker Profiles**: Learn about industry experts and their talks
- **Easy Registration**: Streamlined signup process with instant confirmation
- **Schedule Access**: View and plan your conference schedule

### For Organizers
- **Event Creation**: Set up new events with detailed information
- **Content Management**: Edit website content through an intuitive interface
- **Speaker Management**: Review and manage speaker submissions
- **Registration Tracking**: Monitor attendee signups and generate reports

## 🛠️ Technical Implementation

### Frontend
- **Framework**: Astro.js with React components
- **Styling**: Tailwind CSS for modern, responsive design
- **State Management**: React hooks and context
- **Type Safety**: TypeScript throughout

### Backend
- **Server**: Express.js
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT with secure cookie storage
- **API**: RESTful endpoints with TypeScript types

## 🚀 Getting Started

1. **Clone and Install**
   ```bash
   git clone [repository-url]
   cd event-manager
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Update .env with your settings
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:4321
   - Backend: http://localhost:3000

## 📝 Development Scripts

| Command              | Purpose                                              |
|---------------------|------------------------------------------------------|
| `npm run dev`       | Start both frontend and backend (recommended)        |
| `npm run dev:frontend` | Start Astro development server                    |
| `npm run dev:backend`  | Start Express API server                          |
| `npm run build`     | Create production build                              |
| `npm run preview`   | Preview production build locally                     |

## 🔐 Security

- JWT-based authentication
- HTTP-only cookies
- Role-based access control
- Input validation with Zod
- SQL injection protection

## 📚 API Documentation

### Public Endpoints
- `GET /api/events` - List all events
- `GET /api/talks` - List all talks
- `POST /api/registrations` - Register for an event

### Protected Endpoints
- `POST /api/admin/events` - Create event
- `PUT /api/admin/content` - Update content
- `GET /api/admin/registrations` - View registrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.
