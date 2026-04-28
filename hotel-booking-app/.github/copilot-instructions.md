<!-- Hotel Booking Testing Application - Copilot Instructions -->

## Project Overview

Fullstack hotel booking testing application with intentional bugs for QA and testing purposes.

- **Backend**: Node.js with Express
- **Frontend**: React
- **Database**: In-memory mock data

## Development Workflow

1. Backend runs on port 5000
2. Frontend runs on port 3000
3. Frontend proxies API calls to backend
4. All bugs are intentional for testing

## Known Bugs (Intentional)

### Security Issues
- Passwords stored in plain text
- No token expiration
- No user status validation
- No authentication on delete operations

### Logic Bugs
- Date validation not enforced
- Price filter comparison bug (string vs number)
- Availability check not enforced

### Frontend Issues
- Missing client-side validation
- Test credentials exposed in UI
- No date validation

## Testing Credentials

- testuser / password123 (enabled)
- disableduser / password123 (disabled)
- admin / admin123 (admin)

## Installation Commands

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm start
```
