# Hedronal

A React Native mobile application built with Expo SDK 54, featuring authentication, dark/light mode support with earthy tones, and demo mode functionality.

## Features

- ✅ Expo SDK 54 with TypeScript
- ✅ Authentication screens (Login, Register, Forgot Password)
- ✅ Dark/Light mode with earthy tone theme
- ✅ Demo mode (activate by long-pressing logo for 6 seconds on auth screen)
- ✅ Skeleton components, loading states, and empty states
- ✅ Backend API server with Node.js
- ✅ Safe area management
- ✅ Navigation setup with React Navigation

## Project Structure

```
Hedronal/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # Screen components
│   │   └── auth/           # Authentication screens
│   ├── navigation/          # Navigation configuration
│   ├── services/           # API services
│   ├── context/            # React Context providers
│   ├── constants/          # Constants and theme
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── backend/                # Node.js backend server
│   └── src/
│       ├── routes/         # API routes
│       ├── controllers/    # Route controllers
│       └── config/         # Configuration files
└── assets/                 # Images and static assets
```

## Getting Started

### Prerequisites

- Node.js 20.19.x or higher
- npm or yarn
- Expo CLI (optional, can use npx)

### Installation

1. Install frontend dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

### Running the App

#### Frontend (Mobile App)

Start the Expo development server:
```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your device

#### Backend (API Server)

Start the backend server:
```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:3000` by default.

## Demo Mode

To enable demo mode:
1. Navigate to the Login screen
2. Long-press the Hedronal logo (H) for 6 seconds
3. Demo mode will be activated and persisted

## Theme

The app uses an earthy tone color palette with full dark/light mode support. The theme automatically adapts to the system theme, but can be manually toggled.

## Backend API

### Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user (requires auth)
- `GET /health` - Health check

## Development

### Code Style

- TypeScript strict mode
- Functional components with hooks
- Named exports preferred
- Follow Expo and React Native best practices

### Adding New Features

1. Create components in `src/components/`
2. Create screens in `src/screens/`
3. Add types in `src/types/`
4. Add API services in `src/services/`
5. Update navigation in `src/navigation/`

## Building for Production

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## License

Private project
