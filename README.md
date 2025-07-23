# Maas - Mac as a Server

A modern web interface for monitoring and managing macOS system services via `launchctl`. Built with Next.js, React, and SQLite for local service label management.

## Overview

Maas provides a clean, intuitive web interface to view and filter macOS system services (daemons and agents) managed by `launchctl`. Instead of running terminal commands, you can:

- View all running and stopped services in a table format
- Search services by name, PID, or status
- Create custom labels to categorize and filter services
- Real-time service status monitoring with refresh capabilities
- Dark mode support for comfortable viewing

## Features

### 🔍 Service Monitoring
- Real-time display of all `launchctl` services
- Shows PID, status (Running/Stopped), and service labels
- Live refresh functionality to update service states
- Clean table interface with status indicators

### 🏷️ Label Management
- Create custom labels to categorize services (e.g., "docker", "database", "web")
- Filter services by one or multiple labels
- Toggle between showing all services or only labeled ones
- Persistent label storage using SQLite database

### 🔎 Search & Filter
- Search services by name, PID, or status
- Combine search with label filtering
- Clear search and filter options
- Real-time filtering as you type

### 🎨 Modern UI
- Responsive design that works on desktop and mobile
- Dark mode support
- Loading states and error handling
- Accessibility-focused interface

## Prerequisites

- macOS (required for `launchctl` command)
- [Bun](https://bun.sh/) - Fast JavaScript runtime and package manager
- Node.js 18+ (if not using Bun for runtime)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd maas
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Initialize the database:**
   The SQLite database will be automatically created on first run at `data/maas.db`

4. **Start the development server:**
   ```bash
   bun run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Viewing Services

The main page displays a table of all macOS services with:
- **Status**: Green badge for running services, gray for stopped
- **PID**: Process ID (shows "Not Running" for stopped services)
- **Service Label**: The launchctl service identifier

### Managing Labels

1. Click "Manage Labels" to access the label management page
2. Add new labels by typing keywords that appear in service names
3. Labels are automatically saved to the local SQLite database
4. Remove labels you no longer need

### Filtering Services

1. **By Labels**: Select one or more saved labels to filter services
2. **By Search**: Type in the search box to filter by name, PID, or status
3. **Toggle Views**: Switch between "Show All Services" and "Show Saved Only"
4. **Combine Filters**: Use search and labels together for precise filtering

## Project Structure

```
maas/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── services/route.ts    # launchctl API endpoint
│   │   │   └── labels/route.ts      # Label CRUD operations
│   │   ├── labels/page.tsx          # Label management page
│   │   ├── page.tsx                 # Main services dashboard
│   │   ├── layout.tsx               # App layout
│   │   └── globals.css              # Global styles
│   └── lib/
│       └── database.ts              # SQLite database setup
├── data/
│   └── maas.db                      # SQLite database file
├── public/                          # Static assets
├── package.json                     # Dependencies and scripts
└── README.md                        # This file
```

## Available Scripts

```bash
# Development
bun run dev          # Start development server with Turbopack

# Production
bun run build        # Build for production
bun run start        # Start production server

# Code Quality
bun run lint         # Run ESLint
```

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with better-sqlite3
- **Runtime**: Bun (recommended) or Node.js
- **System Integration**: macOS `launchctl` command

## API Endpoints

### GET /api/services
Returns all launchctl services with their status and PID information.

**Response:**
```json
{
  "services": [
    {
      "pid": "1234",
      "status": "0",
      "label": "com.example.service"
    }
  ]
}
```

### GET /api/labels
Returns all saved service labels.

**Response:**
```json
{
  "labels": [
    {
      "id": 1,
      "label": "docker",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/labels
Creates a new service label.

**Request:**
```json
{
  "label": "docker"
}
```

### DELETE /api/labels?id=1
Removes a service label by ID.

## Development

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run linting: `bun run lint`
5. Test your changes: `bun run build`
6. Commit your changes: `git commit -m 'Add feature'`
7. Push to the branch: `git push origin feature-name`
8. Submit a pull request

### Local Development Setup

1. Ensure you have Bun installed: `curl -fsSL https://bun.sh/install | bash`
2. Clone and install dependencies as described in Installation
3. The app uses file-based routing - add new pages in `src/app/`
4. API routes go in `src/app/api/`
5. Database schema is automatically created on first run

## Troubleshooting

### Common Issues

**Database Permission Errors:**
- Ensure the `data/` directory is writable
- Check file permissions on `data/maas.db`

**launchctl Command Not Found:**
- This app only works on macOS systems
- Ensure you're running on macOS with launchctl available

**Port Already in Use:**
- Change the port: `bun run dev -- -p 3001`
- Or kill the process using port 3000

**Build Errors:**
- Clear node_modules: `rm -rf node_modules && bun install`
- Clear Next.js cache: `rm -rf .next`

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Bun](https://bun.sh/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Database handled by [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)