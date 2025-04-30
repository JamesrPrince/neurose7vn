# NeuroSe7vn

A comprehensive platform for connecting freelance tech professionals with clients.

## Security Practices

This project follows security best practices to ensure sensitive information like API keys, database credentials, and JWT secrets are properly protected:

1. **Environment Variables**: Sensitive data is stored in environment variables, not in the code
2. **No Hardcoded Credentials**: We've removed all hardcoded credentials from the codebase
3. **Secure by Default**: Our configuration requires proper environment setup before running

## Setup Instructions

### Prerequisites

- Node.js 16+
- PostgreSQL database
- pnpm package manager

### Environment Setup

1. Copy the `.env.example` file to create environment-specific files:

   ```bash
   cp .env.example .env.development
   cp .env.example .env.test
   cp .env.example .env.production
   ```

2. Update each environment file with the appropriate values:
   - Set secure database credentials
   - Generate a strong JWT secret (you can use the command in the example file)
   - Configure other environment-specific settings

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

## Project Structure

The project is organized as a monorepo with the following packages:

- `packages/backend`: API server and database models
- `packages/frontend`: Gatsby-based frontend application

## Important Security Notes

- **Never commit .env files**: Only the .env.example template should be committed
- **Use strong, unique passwords**: Especially in production environments
- **Regenerate JWT secret**: Use a fresh, secure secret for each environment

## License

[MIT](LICENSE)
