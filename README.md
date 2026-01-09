# Plex Share Manager

A modern web application for managing Plex media library sharing with friends. Built with Next.js, TypeScript, and TailwindCSS, this tool provides an intuitive interface to control what content you share with specific Plex users.

## Features

- **Library Browser**: Browse all your Plex media libraries with a visual grid interface
- **Friend Management**: View and manage all your Plex friends in one place
- **Selective Sharing**: Choose specific movies, shows, or media items to share with individual friends
- **Share Tracking**: View which items are currently shared with each friend
- **Bulk Operations**: Select and share multiple items at once
- **Real-time Updates**: Instantly see what's shared with your friends
- **Label-based System**: Uses Plex labels for efficient share management
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) with Radix UI primitives
- **State Management**: [TanStack Query (React Query)](https://tanstack.com/query)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Plex API**: [@lukehagar/plexjs](https://github.com/LukeHagar/plexjs)

## Prerequisites

- Node.js 18.x or higher
- A Plex Media Server
- Plex Pass subscription (required for sharing features)
- Plex authentication token

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/PlexShareManager.git
cd PlexShareManager
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
PLEX_SERVER_URL=http://localhost:32400
PLEX_AUTH_TOKEN=your-plex-auth-token-here
PLEX_SERVER_ID=your-plex-server-id-here
```

### Getting Your Plex Token

To find your Plex authentication token:

1. Open Plex Web App
2. Play any media item
3. Click the three dots (...) and select "Get Info"
4. Click "View XML"
5. Look for `X-Plex-Token` in the URL

Alternatively, visit: https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Usage

### Browse Mode

1. Click on any friend to view what media is currently shared with them
2. The library browser will filter to show only shared items
3. Click the "Clear Filter" button to return to the full library view

### Select Mode

1. Toggle "Select Mode" in the Friends panel
2. Select a friend from your friends list
3. Choose a library from the dropdown
4. Check/uncheck items you want to share or unshare
5. Click "Update Sharing" in the Share Manager panel
6. Items are tagged with labels like `shared-with-{friendId}` for tracking

### Managing Shares

The Share Manager panel shows:
- Currently selected friend
- Number of items selected
- Changes to be made (items to share/unshare)
- Update and Clear buttons

## How It Works

This application uses Plex labels to manage sharing:

1. When you share items with a friend, they're tagged with a label: `shared-with-{friendId}`
2. These labels are used to track what's shared with each friend
3. The app fetches library items with specific labels to show shared content
4. When you unshare items, the corresponding labels are removed

## Project Structure

```
PlexShareManager/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes for Plex operations
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Main page
│   ├── components/         # React components
│   │   ├── friends/        # Friend-related components
│   │   ├── layout/         # Layout components
│   │   ├── library/        # Library browser components
│   │   ├── share/          # Share management components
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   └── types/              # TypeScript type definitions
├── public/                 # Static assets
└── ...config files
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Plex API integration via [@lukehagar/plexjs](https://github.com/LukeHagar/plexjs)

## Support

If you encounter any issues or have questions:
1. Check the [Plex API documentation](https://www.plexopedia.com/plex-media-server/api/)
2. Ensure your Plex token and server configuration are correct
3. Verify you have a Plex Pass subscription for sharing features
