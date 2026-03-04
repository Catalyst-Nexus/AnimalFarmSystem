# Admin System Template

A modern React + TypeScript admin system template with authentication, role-based access control, and multiple management modules.

## Features

- **Authentication System** - Secure login and session management
- **Dashboard Overview** - Quick stats and navigation
- **Role Management** - Role-Based Access Control management
- **Assignment Management** - Task and assignment tracking
- **Module Management** - Enable/disable system modules
- **User Management** - Comprehensive user account management
- **User Activation** - User account activation controls

## Tech Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: CSS3 (Custom styles)

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

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

### Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

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
- Bulk actions
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
2. Add route in `Dashboard.tsx`
3. Add menu item in `Sidebar.tsx`
4. Implement your component logic

### API Integration

All pages include TODO comments indicating where to add API calls. Replace the empty state arrays with actual API data fetching.

## License

MIT License
