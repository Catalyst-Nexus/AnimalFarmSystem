import { DataTable, StatusBadge, IconButton } from '@/components/ui'
import { Pencil, Trash2 } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  registeredAt: string
}

interface UserListProps {
  users: User[]
  search: string
  onSearchChange: (value: string) => void
  onEdit: (user: User) => void
  onDelete: (id: string) => void
}

const UserList = ({ users, search, onSearchChange, onEdit, onDelete }: UserListProps) => {
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'name', header: 'Name', render: (user: User) => user.name },
    { key: 'email', header: 'Email', render: (user: User) => user.email },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => <StatusBadge status={user.status} />,
    },
    { key: 'registeredAt', header: 'Registered', render: (user: User) => user.registeredAt },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <IconButton onClick={() => onEdit(user)} title="Edit">
            <Pencil className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={() => onDelete(user.id)} title="Delete" variant="danger">
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <DataTable
      data={filteredUsers}
      columns={columns}
      keyField="id"
      searchPlaceholder="Search users..."
      searchValue={search}
      onSearchChange={onSearchChange}
      emptyMessage="No users found"
    />
  )
}

export default UserList
