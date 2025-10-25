# BlockchainBull Referral System Server

This is the backend API for the BlockchainBull referral system that tracks user registrations and referral relationships.

## Features

- User registration with referrer tracking
- Multi-level referral system (1st and 2nd level)
- Referral statistics and analytics
- Referral tree visualization
- Commission tracking
- RESTful API endpoints

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- pnpm (recommended) or npm

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
Create a `.env` file in the server directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blockchainbull
NODE_ENV=development
```

3. Start MongoDB:
Make sure MongoDB is running on your system.

4. Set up the database:
```bash
node setup.js
```

5. Start the server:
```bash
pnpm start
```

For development with auto-reload:
```bash
pnpm run dev
```

## API Endpoints

### Users
- `POST /api/users/register` - Register a new user with referrer
- `GET /api/users/:address` - Get user information
- `GET /api/users/:address/referrals` - Get user's referral statistics
- `GET /api/users` - Get all users (with pagination)

### Referrals
- `GET /api/referrals/stats/:address` - Get referral statistics
- `GET /api/referrals/tree/:address` - Get referral tree structure
- `GET /api/referrals/top` - Get top referrers
- `PUT /api/referrals/commission` - Update commission for a referral

## Database Models

### User
- `address`: User's wallet address (unique)
- `referrerAddress`: Address of the user who referred them
- `registrationDate`: When the user registered
- `totalReferrals`: Total number of referrals
- `level1Referrals`: Number of direct referrals
- `level2Referrals`: Number of second-level referrals
- `totalInvestment`: Total amount invested
- `totalEarnings`: Total earnings from referrals

### Referral
- `referrerAddress`: Address of the referrer
- `referredAddress`: Address of the referred user
- `level`: Referral level (1 or 2)
- `registrationDate`: When the referral was made
- `commissionEarned`: Commission earned from this referral

## Usage

The API is designed to work with the BlockchainBull frontend application. When a user registers through the smart contract, the frontend should also call the `/api/users/register` endpoint to track the referral relationship in the database.

## Development

The server uses:
- Express.js for the web framework
- MongoDB with Mongoose for data persistence
- CORS for cross-origin requests
- Environment variables for configuration

## Production Deployment

For production deployment:
1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Configure proper CORS settings
4. Set up monitoring and logging
5. Use a process manager like PM2
