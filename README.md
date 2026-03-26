# sce-linkedin
Club's internal alumni directory

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- **Firecrawl API key** (get one at https://firecrawl.dev)

## Configuration

Create a `.env` file in the project root:

```bash
DATABASE_HOST=127.0.0.1
FIRECRAWL_API_KEY=fc-your-key-here
APOLLO_API_KEY=your-key-here  # optional
```

## Getting Started

```bash
# Start the dev environment (Express + MongoDB)
docker compose -f docker-compose.dev.yml up --build

# Access the app at http://localhost:8081
```
