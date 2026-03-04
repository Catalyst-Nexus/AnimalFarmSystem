import { Link } from 'react-router-dom'
import './Home.css'

const Home = () => {
  // TODO: Replace with API call to fetch dashboard stats
  const stats = [
    {
      icon: '👥',
      value: '0',
      label: 'Total Users',
    },
    {
      icon: '🔐',
      value: '0',
      label: 'Active Roles',
    },
    {
      icon: '📝',
      value: '0',
      label: 'Assignments',
    },
    {
      icon: '⚡',
      value: '0',
      label: 'Dynamic Modules',
    },
  ]

  const quickLinks = [
    {
      to: '/dashboard/profile',
      icon: '👤',
      text: 'User Profile',
    },
    {
      to: '/dashboard/assignment',
      icon: '📝',
      text: 'Assignment Management',
    },
    {
      to: '/dashboard/dynamic',
      icon: '⚡',
      text: 'Module Management',
    },
    {
      to: '/dashboard/rbac',
      icon: '🔐',
      text: 'Role Management',
    },
    {
      to: '/dashboard/user-management',
      icon: '👥',
      text: 'User Management',
    },
    {
      to: '/dashboard/user-activation',
      icon: '🔓',
      text: 'User Activation',
    },
  ]

  return (
    <div className="home">
      <h1 className="home-title">Dashboard Overview</h1>
      <p className="home-subtitle">Welcome to your management dashboard</p>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="quick-links">
        <h2 className="section-title">Quick Links</h2>
        <div className="links-grid">
          {quickLinks.map((link, index) => (
            <Link key={index} to={link.to} className="link-card">
              <span className="link-icon">{link.icon}</span>
              <span className="link-text">{link.text}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
