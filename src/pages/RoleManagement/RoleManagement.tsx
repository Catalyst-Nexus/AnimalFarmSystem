import { useState } from 'react'
import './RoleManagement.css'

interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
  userCount: number
}

const RoleManagement = () => {
  // TODO: Replace with API call to fetch roles
  const [roles, setRoles] = useState<Role[]>([])

  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  })

  const availablePermissions = [
    'create',
    'read',
    'update',
    'delete',
    'manage_users',
    'manage_roles',
    'view_reports',
    'export_data',
  ]

  const handleAddRole = () => {
    setEditingRole(null)
    setFormData({ name: '', description: '', permissions: [] })
    setShowModal(true)
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    })
    setShowModal(true)
  }

  const handleDeleteRole = (id: number) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter((role) => role.id !== id))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingRole) {
      setRoles(
        roles.map((role) =>
          role.id === editingRole.id
            ? { ...role, ...formData }
            : role
        )
      )
    } else {
      const newRole: Role = {
        id: Math.max(...roles.map((r) => r.id), 0) + 1,
        ...formData,
        userCount: 0,
      }
      setRoles([...roles, newRole])
    }

    setShowModal(false)
  }

  const handlePermissionChange = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const getRoleBadgeClass = (roleName: string) => {
    const name = roleName.toLowerCase()
    if (name === 'admin') return 'badge-admin'
    if (name === 'manager') return 'badge-manager'
    return 'badge-user'
  }

  return (
    <div className="rbac">
      <div className="page-header">
        <h1 className="page-title">Role-Based Access Control (RBAC)</h1>
        <p className="page-description">
          Manage roles and permissions for your system
        </p>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Roles Management</h2>
          <button className="btn btn-primary" onClick={handleAddRole}>
            + Add New Role
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Description</th>
              <th>Permissions</th>
              <th>Users</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td>
                  <span className={`badge ${getRoleBadgeClass(role.name)}`}>
                    {role.name}
                  </span>
                </td>
                <td>{role.description}</td>
                <td>{role.permissions.length} permissions</td>
                <td>{role.userCount} users</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEditRole(role)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteRole(role.id)}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-header">
              {editingRole ? 'Edit Role' : 'Add New Role'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Role Name</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter role name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter role description"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Permissions</label>
                <div className="checkbox-group">
                  {availablePermissions.map((permission) => (
                    <label key={permission} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={() => handlePermissionChange(permission)}
                      />
                      {permission.replace('_', ' ')}
                    </label>
                  ))}
                </div>
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
                  {editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleManagement
