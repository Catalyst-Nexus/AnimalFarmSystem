# Admin System Template

A modern React + TypeScript admin system template with authentication, role-based access control, dynamic image uploads, and multiple management modules.

## Features

- **Authentication System** - Secure login and registration with session management
- **Dashboard Overview** - Quick stats and navigation
- **Role Management** - Role-Based Access Control management
- **Assignment Management** - Task and assignment tracking
- **Module Management** - Enable/disable system modules
- **User Management** - Comprehensive user account management
- **User Activation** - User account activation controls
- **Dynamic Logo Upload** - Upload custom system logo via Settings
- **Profile Picture Upload** - Upload user profile pictures
- **Supabase Integration** - Image storage with Supabase Storage buckets

## Tech Stack

- **Frontend Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Backend/Storage**: Supabase (for image uploads)
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/
│   ├── Header/
│   ├── Layout/
│   ├── Sidebar/
│   └── PrivateRoute.tsx
├── contexts/
│   └── AuthContext.tsx
├── pages/
│   ├── AssignmentManagement/
│   ├── Dashboard/
│   ├── Home/
│   ├── Login/
│   ├── ModuleManagement/
│   ├── RoleManagement/
│   ├── UserActivation/
│   ├── UserManagement/
│   └── UserProfile/
├── App.tsx
├── App.css
├── main.tsx
└── index.css
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. **Configure Supabase (Optional but Recommended)**:
   - Copy `.env.example` to `.env`
   - Follow the [Supabase Setup Guide](./SUPABASE_SETUP.md)
   - Add your Supabase credentials to `.env`

   **Note**: The app works in demo mode without Supabase, but uploaded images will be temporary.

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

### Building for Production

```bash
npm Registration & Login

- Navigate to `/register` to create a new account
- Or use `/login` to sign in
- Enter any username and password to access the system (demo mode)
- You will be redirected to the dashboard

### User Profile & Image Uploads

- Go to **User Profile** from the header dropdown
- Click the camera icon on your avatar to upload a profile picture
- Supports JPEG, PNG, GIF, and WebP (max 5MB)
- Profile picture appears in the header and profile page

### Settings & System Logo

- Go to **Settings** from the header dropdown or sidebar
- Upload a custom system logo in the Appearance section
- Logo appears in the header and sidebar
- Supports JPEG, PNG, GIF, and WebP (max 5MB)
## Usage

### Login

- Navigate to the login page
- Enter any username and password to access the system (demo mode)
- You will be redirected to the dashboard

### Dashboard

The dashboard provides:
- Overview statistics
- Quick links to all modules
- Navigation sidebar

### RBAC Module

Manage roles and permissions:
- Create new roles
- Edit existing roles
- Assign permissions
- View user count per role

### Assignment Module

Track tasks and assignments:
- Create new assignments
- Filter by status and priority
- View progress tracking
- Manage deadlines

### Dynamic Module

Control system modules:
- Enable/disable modules
- Configure module settings
- View module status
- Manage global configuration

### User Activation

Manage user accounts:
- View all users
- Activate/deactivate users
- BuSupabase Storage Buckets

This template expects two Supabase Storage buckets:
- `system_logo` - For application logo
- `profile_picture` - For user profile pictures

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed setup instructions.

### lk actions
- Edit user details
- Search functionality

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Customization

### Adding New Modules

1. Create a new page component in `src/pages/`
2.# Environment Variables

Required environment variables (create a `.env` file):
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See `.env.example` for reference.

## Demo Mode

The application works without Supabase configuration:
- Authentication works with any username/password
- Image uploads are stored temporarily in browser memory
- Uploaded images are lost on page refresh
- A warning message indicates demo mode is active

## Add route in `Dashboard.tsx`
3. Add menu item in `Sidebar.tsx`
4. Implement your component logic

### API Integration

All pages include TODO comments indicating where to add API calls. Replace the empty state arrays with actual API data fetching.

## License

MIT License
