# Database Migration Guide

This application has been migrated from MongoDB to support PostgreSQL and SQLite.

## Database Options

### SQLite (Default)
- **No setup required** - Works out of the box
- Database file: `./data/notes.db` (created automatically)
- Best for: Development, small deployments, single-user applications

### PostgreSQL
- **Requires PostgreSQL installation**
- Best for: Production, multi-user applications, scalability

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# For SQLite (default)
DATABASE_TYPE=sqlite
SQLITE_PATH=./data/notes.db

# For PostgreSQL
DATABASE_TYPE=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=notes
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

## Setup Instructions

### SQLite Setup
1. No additional setup needed
2. The database file will be created automatically in `./data/notes.db`
3. Make sure the `data` directory exists or is writable

### PostgreSQL Setup
1. Install PostgreSQL on your system
2. Create a database:
   ```sql
   CREATE DATABASE notes;
   ```
3. Update `.env` file with your PostgreSQL credentials
4. Run the application - tables will be created automatically

## Migration from MongoDB

If you have existing MongoDB data:

1. Export your notes from MongoDB as JSON
2. Use the Import feature in the application to import the notes
3. The application will automatically convert the data format

## Database Schema

The Note model includes:
- `id` (Primary Key, Auto-increment)
- `title` (String)
- `content` (Text)
- `tags` (JSON Array)
- `isPinned` (Boolean)
- `isArchived` (Boolean)
- `isDeleted` (Boolean)
- `priority` (Enum: low, medium, high, urgent)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)
- `deletedAt` (Timestamp, nullable)

## Notes

- The application automatically creates tables on first run
- All database operations go through the `databaseService` abstraction layer
- The frontend receives normalized data with both `id` and `_id` for compatibility

