import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

const Sidebar = () => {
  const location = useLocation()

  return (
    <div className="sidebar">
      <div className="sidebar-logo">Admin System</div>
      
      <div className="sidebar-section">
        <div className="sidebar-section-header">MAIN</div>
        <ul className="sidebar-menu">
          <li className="sidebar-menu-item">
            <Link
              to="/dashboard"
              className={`sidebar-menu-link ${
                location.pathname === '/dashboard' ? 'active' : ''
              }`}
            >
              <span className="sidebar-menu-icon">📊</span>
              <span>Dashboard</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">USER</div>
        <ul className="sidebar-menu">
          <li className="sidebar-menu-item">
            <Link
              to="/dashboard/profile"
              className={`sidebar-menu-link ${
                location.pathname === '/dashboard/profile' ? 'active' : ''
              }`}
            >
              <span className="sidebar-menu-icon">👤</span>
              <span>User Profile</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">ROLE-BASED ACCESS CONTROL</div>
        <ul className="sidebar-menu">
          <li className="sidebar-menu-item">
            <Link
              to="/dashboard/assignment"
              className={`sidebar-menu-link ${
                location.pathname === '/dashboard/assignment' ? 'active' : ''
              }`}
            >
              <span className="sidebar-menu-icon">📋</span>
              <span>Assignment Management</span>
            </Link>
          </li>
          <li className="sidebar-menu-item">
            <Link
              to="/dashboard/dynamic"
              className={`sidebar-menu-link ${
                location.pathname === '/dashboard/dynamic' ? 'active' : ''
              }`}
            >
              <span className="sidebar-menu-icon">⚙️</span>
              <span>Module Management</span>
            </Link>
          </li>
          <li className="sidebar-menu-item">
            <Link
              to="/dashboard/rbac"
              className={`sidebar-menu-link ${
                location.pathname === '/dashboard/rbac' ? 'active' : ''
              }`}
            >
              <span className="sidebar-menu-icon">🛡️</span>
              <span>Role Management</span>
            </Link>
          </li>
          <li className="sidebar-menu-item">
            <Link
              to="/dashboard/user-management"
              className={`sidebar-menu-link ${
                location.pathname === '/dashboard/user-management' ? 'active' : ''
              }`}
            >
              <span className="sidebar-menu-icon">👥</span>
              <span>User Management</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-header">AUTH</div>
        <ul className="sidebar-menu">
          <li className="sidebar-menu-item">
            <Link
              to="/dashboard/user-activation"
              className={`sidebar-menu-link ${
                location.pathname === '/dashboard/user-activation' ? 'active' : ''
              }`}
            >
              <span className="sidebar-menu-icon">🔑</span>
              <span>User Activation</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar
