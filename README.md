# Project K - Recruitment Platform

A modern recruitment platform built with Next.js, Firebase, and Cloudinary.

## Features

- User authentication (Admin and Candidate roles)
- Google Sign-in integration
- Resume upload and storage
- Profile management
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Cloudinary account

## Environment Variables

### Backend (.env)

Create a `.env` file in the backend directory with the following variables:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Frontend (.env.local)

Create a `.env.local` file in the frontend directory with the following variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd project-k
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Project Structure

```
project-k/
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   └── users.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── contexts/
│   │   └── lib/
│   └── package.json
└── README.md
```

## Technologies Used

- Frontend:
  - Next.js
  - TypeScript
  - Tailwind CSS
  - React Hook Form
  - Yup
  - Firebase Authentication
  - Axios

- Backend:
  - Node.js
  - Express
  - Firebase Admin SDK
  - Cloudinary
  - JWT Authentication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 