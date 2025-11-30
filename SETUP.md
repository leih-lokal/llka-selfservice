# Environment Setup for Kiosk Mode

This app requires the following environment variables to be set in your `.env.local` file:

## Required Variables

```bash
# PocketBase Server URL
NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090

# Auto-authentication credentials (for kiosk mode)
NEXT_PUBLIC_POCKETBASE_USER=your-admin-username
NEXT_PUBLIC_POCKETBASE_PASSWORD=your-admin-password
```

## Setup Instructions

1. Create a `.env.local` file in the root directory (if it doesn't exist)
2. Copy the variables above and replace with your actual values:
   - `NEXT_PUBLIC_POCKETBASE_URL`: Your PocketBase server URL
   - `NEXT_PUBLIC_POCKETBASE_USER`: Admin username for PocketBase
   - `NEXT_PUBLIC_POCKETBASE_PASSWORD`: Admin password for PocketBase

3. Restart the development server for changes to take effect

## Security Note

The `.env.local` file is gitignored and will not be committed to version control. 

For kiosk deployment, ensure the kiosk environment is physically secure since credentials are stored in the environment file.

## How It Works

The app will automatically authenticate with PocketBase on startup using the credentials provided in the environment variables. The authentication token is refreshed every 10 minutes to maintain the session.

If authentication fails, the app will display an error message instead of loading the main interface.
