import { useState } from 'react'
import './UserActivation.css'
import '../RoleManagement/RoleManagement.css'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  joinDate: string
  lastLogin: string
}

const UserActivation = () => {
  // TODO: Replace with API call to fetch users
  const [users, setUsers] = useState<User[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeUsers = users.filter((u) => u.status === 'active').length
  const inactiveUsers = users.filter((u) => u.status === 'inactive').length

  const toggleUserStatus = (id: number) => {
    setUsers(
      users.map((user) =>
        user.id === id
          ? {
              ...user,
              status: user.status === 'active' ? 'inactive' : 'active',
            }
          : user
      )
    )
  }

  const handleSelectUser = (id: number) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id))
    }
  }

  const handleBulkActivate = () => {
    setUsers(
      users.map((user) =>
        selectedUsers.includes(user.id) ? { ...user, status: 'active' } : user
      )
    )
    setSelectedUsers([])
  }

  const handleBulkDeactivate = () => {
    setUsers(
      users.map((user) =>
        selectedUsers.includes(user.id) ? { ...user, status: 'inactive' } : user
      )
    )
    setSelectedUsers([])
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowModal(true)
  }

  const handleDeleteUser = (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter((u) => u.id !== id))
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="user-activation">
      <div className="page-header">
        <h1 className="page-title">User Activation Management</h1>
        <p className="page-description">
          Activate, deactivate, and manage user accounts
        </p>
      </div>

      <div className="stats-summary">
        <div className="stat-box">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-box">
          <div className="stat-number stat-number-active">
            {activeUsers}
          </div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-box">
          <div className="stat-number stat-number-inactive">
            {inactiveUsers}
          </div>
          <div className="stat-label">Inactive Users</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">User Management</h2>
          <button className="btn btn-primary">+ Add New User</button>
        </div>

        <div className="search-bar">
          <label htmlFor="user-search" className="visually-hidden">Search users</label>
          <input
            id="user-search"
            className="search-input"
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search users by name or email"
          />
        </div>

        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <button className="btn btn-primary" onClick={handleBulkActivate}>
              Activate Selected ({selectedUsers.length})
            </button>
            <button className="btn btn-danger" onClick={handleBulkDeactivate}>
              Deactivate Selected ({selectedUsers.length})
            </button>
          </div>
        )}

        <div className="users-table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length === filteredUsers.length &&
                      filteredUsers.length > 0
                    }
                    onChange={handleSelectAll}
                    aria-label="Select all users"
                  />
                </th>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Join Date</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      aria-label={`Select ${user.name}`}
                    />
                  </td>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">{getInitials(user.name)}</div>
                      <div className="user-details">
                        <span className="user-name">{user.name}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.role}</td>
                  <td>
                    <div className="user-status">
                      <span
                        className={`status-indicator ${user.status}`}
                        aria-label={`Status: ${user.status}`}
                      ></span>
                      <span>{user.status}</span>
                    </div>
                  </td>
                  <td>{user.joinDate}</td>
                  <td>{user.lastLogin}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className={`action-btn ${
                          user.status === 'active'
                            ? 'btn-deactivate'
                            : 'btn-activate'
                        }`}
                        onClick={() => toggleUserStatus(user.id)}
                      >
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="action-btn btn-edit"
                        onClick={() => handleEditUser(user)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-btn btn-danger"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-header">Edit User</h2>
            <form>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-user-name">Name</label>
                <input
                  id="edit-user-name"
                  className="form-input"
                  type="text"
                  defaultValue={editingUser.name}
                  aria-label="User name"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-user-email">Email</label>
                <input
                  id="edit-user-email"
                  className="form-input"
                  type="email"
                  defaultValue={editingUser.email}
                  aria-label="User email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-user-role">Role</label>
                <select
                  id="edit-user-role"
                  className="form-input"
                  defaultValue={editingUser.role}
                  aria-label="Select user role"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="User">User</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-user-status">Status</label>
                <select
                  id="edit-user-status"
                  className="form-input"
                  defaultValue={editingUser.status}
                  aria-label="Select user status"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowModal(false)}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserActivation
