# Booky

Booky is a modern bookmarking application that allows users to save, organize, and search through their web bookmarks. It features a clean web interface, powerful search capabilities using MeiliSearch, and a robust backend API built with Node.js and TypeScript.

## Features

- **User Authentication**: Secure user registration and login with JWT tokens
- **Bookmark Management**: Save, edit, and delete bookmarks with rich metadata
- **Collections**: Organize bookmarks into collections with sharing capabilities
- **Tagging System**: Tag bookmarks for easy categorization
- **Highlights & Annotations**: Add highlights and notes to bookmark content
- **Full-Text Search**: Fast search through bookmarks using MeiliSearch
- **Responsive UI**: Modern React-based frontend with Tailwind CSS

## Tech Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Search**: MeiliSearch
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Queue**: BullMQ with Redis
- **Deployment**: Docker, AWS (ECS, RDS, ElastiCache)

## Project Structure

```
booky/
├── backend/          # Node.js API server
├── frontend/         # React web application
├── extension/        # Browser extension
├── infra/            # Infrastructure as Code (Terraform)
├── tests/            # Test files
└── docker-compose.yml # Local development setup
```

## Setup Instructions

### Local Development

1. **Prerequisites**

   - Docker and Docker Compose
   - Node.js 18+ (for local development without Docker)

2. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/booky.git
   cd booky
   ```

3. **Start services with Docker Compose**

   ```bash
   docker-compose up -d
   ```

   This will start:

   - PostgreSQL on port 5432
   - Redis on port 6379
   - MeiliSearch on port 7700
   - Backend API on port 3000
   - Frontend on port 5173

4. **Seed the database (optional)**

   ```bash
   cd backend
   npm run seed
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - MeiliSearch: http://localhost:7700

### Manual Setup (without Docker)

1. **Backend Setup**

   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure environment variables
   npm run build
   npm start
   ```

2. **Frontend Setup**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Database Setup**
   - Install PostgreSQL and Redis locally
   - Run the SQL schema from `backend/database-schema.md`
   - Configure connection strings in `.env`

## API Documentation

The API documentation is available in OpenAPI 3.0 format: [backend/openapi-spec.md](backend/openapi-spec.md)

Key endpoints:

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /collections` - List user collections
- `POST /collections/{id}/bookmarks` - Create bookmark
- `GET /search` - Search bookmarks

## Demo

A live demo of the application is available at: [https://booky-demo.com](https://booky-demo.com) (placeholder)

To run a local demo:

1. Follow the setup instructions above
2. Seed the database with sample data
3. Access the frontend at http://localhost:5173

## Seed Data

To populate the database with sample data:

```bash
cd backend
npm run seed
```

This will create:

- A test user (email: test@example.com, password: password123)
- A sample collection with bookmarks

## Deployment

### AWS Deployment

1. **Configure AWS credentials**

   ```bash
   aws configure
   ```

2. **Deploy infrastructure**

   ```bash
   cd infra
   terraform init
   terraform plan
   terraform apply
   ```

3. **Build and push Docker images**

   ```bash
   # Build backend image
   cd backend
   docker build -t your-ecr-repo/booky-backend:latest .
   docker push your-ecr-repo/booky-backend:latest

   # Build frontend image (if needed)
   cd frontend
   docker build -t your-ecr-repo/booky-frontend:latest .
   docker push your-ecr-repo/booky-frontend:latest
   ```

4. **Update ECS service**
   The Terraform configuration will create an ECS service that automatically pulls the latest images.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
