# Docker infrastructure

PostgreSQL is defined at the repository root in `docker-compose.yml`.

Start the database:

```bash
pnpm db:up
```

Credentials are read from environment variables documented in the root `.env.example`.