# MaaS - Mac as a Server - TODO & Roadmap

## Current Features
- Service monitoring with real-time status
- Label management for service categorization
- Search and filtering capabilities
- Plist generator for creating LaunchAgent configurations
- Dark mode support
- Network URL detection and filtering

## Missing Features & Next Steps

### 1. **Process Management & Control**
- Start/stop/restart services directly from the UI
- Enable/disable services (load/unload from launchctl)
- Kill processes by PID
- Batch operations for multiple services

### 2. **Advanced Monitoring**
- CPU and memory usage per service
- Service uptime tracking
- Performance metrics dashboard
- Historical data and trends
- Resource alerts/notifications

### 3. **Log Management**
- Real-time log viewing for services
- Log file aggregation and search
- Log rotation management
- Error highlighting and filtering

### 4. **System Information Dashboard**
- Overall system metrics (CPU, RAM, disk usage)
- Running processes overview
- Network connections and ports
- System load and performance indicators

### 5. **Automation & Scheduling**
- Cron job management interface
- Service dependency mapping
- Automated service health checks
- Custom monitoring scripts

### 6. **Security & Access Control**
- User authentication/authorization
- Service permission management
- Audit logging for system changes
- Secure remote access capabilities

### 7. **Notification System**
- Email/SMS alerts for service failures
- Slack/Discord webhook integrations
- Custom notification rules
- Status change notifications

### 8. **Backup & Configuration Management**
- Export/import service configurations
- Backup and restore plist files
- Configuration versioning
- Service templates

### 9. **Network & Port Management**
- Port usage monitoring
- Network service discovery
- Firewall rule management
- Remote service health checks

### 10. **API & Integration**
- REST API for external integrations
- Webhook support for external monitoring
- Third-party service integrations
- Command-line tools for automation

## Priority Implementation Order

The most impactful next features would be:

1. **Process control** (start/stop services) - Core functionality
2. **Advanced monitoring** (resource usage) - Essential for server management
3. **Log management** - Critical for debugging and monitoring

These would make MaaS a comprehensive server management solution for macOS.