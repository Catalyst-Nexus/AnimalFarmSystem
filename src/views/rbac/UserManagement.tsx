import { useState, useEffect } from 'react'
import { UserList, UserDialog } from '@/components/rbac'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, Tabs, PlaceholderCard } from '@/components/ui'
import { Users, Plus, RefreshCw } from 'lucide-react'
import { fetchUsers, fetchRoles, assignRoleToUser, getUserRoles, type User as DBUser, type Role } from '@/services/rbacService'
import RoleModuleAccessManagement from './RoleModuleAccessManagement'

interface User {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  registeredAt: string
}

type TabKey = 'users' | 'assignments' | 'roles' | 'access'

const tabs = [
  { key: 'users', label: 'Users' },
  { key: 'assignments', label: 'User Assignments' },
  { key: 'roles', label: 'User Roles' },
  { key: 'access', label: 'Role Module Access' },
]

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('users')
  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedUserRole, setSelectedUserRole] = useState<string>('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  // Fetch users and roles on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [fetchedUsers, fetchedRoles] = await Promise.all([
        fetchUsers(),
        fetchRoles()
      ])

      // Transform DB users to component users
      const transformedUsers: User[] = fetchedUsers.map((user: DBUser) => ({
        id: user.id,
        name: user.username,
        email: user.email,
        status: user.status as 'active' | 'inactive',
        registeredAt: new Date(user.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      }))

      setUsers(transformedUsers)
      setRoles(fetchedRoles)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      alert('Please fill in all fields')
      return
    }

    if (!selectedUserRole) {
      alert('Please select a role')
      return
    }

    try {
      // If editing, update the role assignment
      if (editingUserId) {
        const result = await assignRoleToUser(editingUserId, selectedUserRole)
        if (!result.success) {
          alert(`Failed to update role: ${result.error}`)
          return
        }
      }

      // Reset form and reload data
      setFormName('')
      setFormEmail('')
      setSelectedUserRole('')
      setEditingUserId(null)
      setShowModal(false)
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      alert(message)
    }
  }

  const total = users.length
  const active = users.filter((u) => u.status === 'active').length
  const inactive = users.filter((u) => u.status === 'inactive').length

  const handleEditUser = async (user: User) => {
    setFormName(user.name)
    setFormEmail(user.email)
    setEditingUserId(user.id)
    
    // Fetch current user role
    try {
      const userRoles = await getUserRoles(user.id)
      if (userRoles.length > 0) {
        setSelectedUserRole(userRoles[0].id)
      }
    } catch (err) {
      console.error('Error fetching user roles:', err)
    }
    
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="Manage users in your role-based access control system"
        icon={<Users className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Users" value={total} />
        <StatCard label="Active Status" value={active} color="success" />
        <StatCard label="Inactive Status" value={inactive} color="warning" />
      </StatsRow>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabKey)}
      />

      {activeTab === 'users' && (
        <>
          <ActionsBar>
            <PrimaryButton onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </PrimaryButton>
            <PrimaryButton onClick={() => {
              setFormName('')
              setFormEmail('')
              setSelectedUserRole('')
              setEditingUserId(null)
              setShowModal(true)
            }}>
              <Plus className="w-4 h-4" />
              Add User
            </PrimaryButton>
          </ActionsBar>

          {error && (
            <div className="px-4 py-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted">Loading users...</p>
            </div>
          ) : (
            <UserList
              users={users}
              search={search}
              onSearchChange={setSearch}
              onEdit={handleEditUser}
              onDelete={(id) => console.log('Delete', id)}
            />
          )}
        </>
      )}

      {activeTab === 'assignments' && (
        <PlaceholderCard>User Assignments content coming soon...</PlaceholderCard>
      )}

      {activeTab === 'roles' && (
        <PlaceholderCard>User Roles content coming soon...</PlaceholderCard>
      )}

      {activeTab === 'access' && <RoleModuleAccessManagement />}

      <UserDialog
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingUserId(null)
        }}
        onSubmit={handleCreate}
        name={formName}
        onNameChange={setFormName}
        email={formEmail}
        onEmailChange={setFormEmail}
        roles={roles}
        selectedRole={selectedUserRole}
        onRoleChange={setSelectedUserRole}
        editMode={!!editingUserId}
      />
    </div>
  )
}

export default UserManagement
