import { useState } from 'react'
import './UserManagement.css'
import '../RoleManagement/RoleManagement.css'

interface User {
  id: number
  name: string
  email: string
  role: string
  department: string
  status: 'active' | 'inactive'
  permissions: string[]
}

const UserManagement = () => {
  // TODO: Replace with API call to fetch users
  const [users, setUsers] = useState<User[]>([])

  const [showModal, setShowModal] = useState(false)

  return (
    <div className="user-management">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-description">
          Manage system users, roles, and permissions
        </p>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">All Users</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add New User
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge badge-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.department}</td>
                <td>
                  <span
                    className={`badge ${
                      user.status === 'active' ? 'badge-admin' : 'badge-user'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td>{user.permissions.length} permissions</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-secondary">Edit</button>
                    <button className="btn btn-danger">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-header">Add New User</h2>
            <form>
              <div className="form-group">
                <label className="form-label" htmlFor="new-user-name">
                  Name
                </label>
                <input
                  id="new-user-name"
                  className="form-input"
                  type="text"
                  placeholder="Enter user name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-user-email">
                  Email
                </label>
                <input
                  id="new-user-email"
                  className="form-input"
                  type="email"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-user-role">
                  Role
                </label>
                <select
                  id="new-user-role"
                  className="form-input"
                  aria-label="Select user role"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="User">User</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-user-department">
                  Department
                </label>
                <input
                  id="new-user-department"
                  className="form-input"
                  type="text"
                  placeholder="Enter department"
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
