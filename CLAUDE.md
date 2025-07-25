# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MaaS (Mac as a Server) is a Next.js web application that provides a modern interface for monitoring and managing macOS system services via `launchctl`. The application allows users to view running services, create custom labels for categorization, and filter services with a real-time dashboard.

## Core Technology Stack

- **Runtime**: Bun (recommended) with fallback to Node.js
- **Framework**: Next.js 15 with React 19
- **Database**: SQLite using `bun:sqlite` driver
- **Styling**: Tailwind CSS v4
- **TypeScript**: Strict mode enabled
- **UI Components**: Custom components built on Radix UI primitives

## Development Commands

```bash
# Development server with Turbopack
bun run dev

# Production build
bun run build

# Production server
bun run start

# Linting
bun run lint

# Database initialization (automatic on first run)
# SQLite database created at data/maas.db
```

## Service Setup and Deployment

The project includes `init-maas.sh` script for setting up MaaS as a macOS LaunchAgent service:

```bash
# Quick setup as system service
./init-maas.sh

# Service management commands
launchctl list | grep com.maas.dev     # Check status
launchctl stop com.maas.dev            # Stop service
launchctl start com.maas.dev           # Start service
```

## Architecture

### API Layer (`src/app/api/`)
- **Services API** (`/api/services`): Interfaces with macOS `launchctl` command to fetch real-time service data, including PID mapping to network URLs via `lsof` and process hierarchy analysis
- **Labels API** (`/api/labels`): CRUD operations for service label management using SQLite

### Database Layer (`src/lib/database.ts`)
- Uses `bun:sqlite` for local SQLite database operations
- Single table schema: `service_labels` with auto-incrementing ID, label text, and timestamp
- Static methods for label operations: getAllLabels, addLabel, removeLabel, removeLabelByName

### Frontend Architecture
- **Main Dashboard** (`src/app/page.tsx`): Service monitoring interface with real-time filtering, search, and label-based categorization
- **Label Management** (`src/app/labels/page.tsx`): Interface for managing service labels
- **Component Library** (`src/components/`): Reusable UI components built on Radix UI primitives

### System Integration
- **launchctl Integration**: Direct shell execution to fetch macOS service data
- **Network Discovery**: Uses `lsof` command to map process IDs to listening network ports
- **Process Hierarchy**: Analyzes parent-child process relationships to identify service origins

## Key Features Implementation

### Service Monitoring
- Real-time launchctl service status polling
- PID to network URL mapping using system commands
- Apple service filtering (configurable show/hide)
- Status badges and real-time refresh capabilities

### Label System
- SQLite-based persistent label storage
- Multi-label filtering with AND/OR logic
- Dynamic label-based service categorization
- Label management interface with CRUD operations

### Search and Filtering
- Text-based search across service names, PIDs, and status
- Combinable filters (search + labels + network URLs)
- Toggle between "show all" and "saved labels only" modes

## File Structure Patterns

- API routes follow Next.js 13+ app router conventions
- Database operations centralized in `/lib/database.ts`
- UI components in `/components/` with consistent naming
- Type definitions inline with usage (no separate types directory)

## Important Development Notes

- Database is auto-created on first application run at `data/maas.db`
- All system commands are executed via Node.js `child_process.exec`
- Component state management uses React hooks (no external state library)
- Styling uses Tailwind utility classes with custom gradients and animations
- macOS-specific functionality requires macOS environment for full testing