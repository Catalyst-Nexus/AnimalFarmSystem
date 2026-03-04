import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Header.css'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="header">
      <div className="header-left">
        <div className="header-search">
          <span className="header-search-icon">🔍</span>
          <input
            type="text"
            className="header-search-input"
            placeholder="Search..."
            aria-label="Search"
          />
        </div>
      </div>
      <div className="header-user">
        <button className="header-notification" aria-label="Notifications">
          🔔
        </button>
        <div className="header-avatar">
          {user?.username ? getInitials(user.username) : 'U'}
        </div>
        <button className="header-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}

export default Header
