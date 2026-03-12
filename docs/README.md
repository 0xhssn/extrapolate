# Extrapolate Developer Documentation

Welcome to the Extrapolate developer documentation. This guide will help you understand, set up, and extend the Extrapolate application.

## Documentation Structure

- **[Overview](./01-overview.md)** - Architecture, tech stack, and core concepts
- **[Setup Guide](./02-setup.md)** - Installation and configuration instructions
- **[Usage Guide](./03-usage.md)** - How to use the application features
- **[API Reference](./04-api-reference.md)** - Server actions, webhooks, and endpoints
- **[Examples](./05-examples.md)** - Code examples and common patterns
- **[Troubleshooting](./06-troubleshooting.md)** - Common issues and solutions

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/extrapolate.git
cd extrapolate

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Key Features

- AI-powered age transformation using Replicate
- OAuth authentication via Supabase
- Credit-based payment system with Stripe
- Real-time updates using Supabase Realtime
- Image storage with Supabase Storage
- Responsive design with Tailwind CSS
- End-to-end testing with Playwright

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Google OAuth)
- **AI Processing:** Replicate
- **Payments:** Stripe
- **Storage:** Supabase Storage
- **Testing:** Playwright

## Getting Help

- Check the [Troubleshooting Guide](./06-troubleshooting.md)
- Review [Examples](./05-examples.md) for common patterns
- Open an issue on GitHub
- Contact the maintainers

## Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
