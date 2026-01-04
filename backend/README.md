# Hedronal Backend

Node.js backend API server for the Hedronal mobile application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Update the environment variables in `.env` as needed.

## Development

Start the development server with hot reload:
```bash
npm run dev
```

## Production

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ email: string, password: string, name: string }`

- `POST /api/auth/login` - Login user
  - Body: `{ email: string, password: string }`

- `POST /api/auth/forgot-password` - Request password reset
  - Body: `{ email: string }`

- `POST /api/auth/reset-password` - Reset password
  - Body: `{ token: string, password: string }`

- `GET /api/auth/me` - Get current user (requires Authorization header)
  - Headers: `Authorization: Bearer <token>`

### Health Check

- `GET /health` - Health check endpoint

## Notes

- Currently using in-memory storage for demo purposes
- In production, implement proper database integration
- Add JWT token generation and validation
- Implement password hashing with bcrypt
- Add proper error handling and logging
