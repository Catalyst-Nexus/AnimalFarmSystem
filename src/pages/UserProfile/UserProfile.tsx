import { useAuth } from '../../contexts/AuthContext'
import './UserProfile.css'
import '../RoleManagement/RoleManagement.css'

const UserProfile = () => {
  const { user } = useAuth()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="user-profile">
      <div className="page-header">
        <h1 className="page-title">User Profile</h1>
        <p className="page-description">View and manage your profile information</p>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-large">
              {user?.username ? getInitials(user.username) : 'U'}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{user?.username || 'User'}</h2>
              <p className="profile-email">{user?.email || 'user@example.com'}</p>
              <span className="profile-role-badge">{user?.role || 'User'}</span>
            </div>
          </div>

          <h3 className="profile-section-title">Account Information</h3>
          <div className="profile-grid">
            <div className="profile-field">
              <span className="profile-field-label">User ID</span>
              <span className="profile-field-value">{user?.id || '1'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Username</span>
              <span className="profile-field-value">{user?.username || 'user'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Email Address</span>
              <span className="profile-field-value">{user?.email || 'user@example.com'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Role</span>
              <span className="profile-field-value">{user?.role || 'User'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Account Status</span>
              <span className="profile-field-value">Active</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Member Since</span>
              <span className="profile-field-value">January 2026</span>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-primary">Edit Profile</button>
            <button className="btn btn-secondary">Change Password</button>
          </div>
        </div>

        <div className="profile-card">
          <h3 className="profile-section-title">Security & Privacy</h3>
          <div className="profile-grid">
            <div className="profile-field">
              <span className="profile-field-label">Two-Factor Authentication</span>
              <span className="profile-field-value">Disabled</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Last Password Change</span>
              <span className="profile-field-value">3 months ago</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Login Sessions</span>
              <span className="profile-field-value">2 active sessions</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Last Login</span>
              <span className="profile-field-value">Today at 10:30 AM</span>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-primary">Enable 2FA</button>
            <button className="btn btn-secondary">View Login History</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
