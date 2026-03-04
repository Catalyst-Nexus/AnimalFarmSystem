import { supabase } from './supabase'

export interface User {
  id: string
  username: string
  email: string
  status: 'active' | 'inactive'
  created_at: string
  is_super_admin: boolean
}

export interface Role {
  id: string
  role_name: string
  role_code: string
  is_active: boolean
  created_at: string
}

export interface Module {
  id: string
  module_name: string
  route_path: string
  is_active: boolean
  created_at: string
  icons?: string | null
}

export interface UserRole {
  user_id: string
  role_id: string
  assigned_at: string
}

export interface RoleModuleAccess {
  role_id: string
  module_id: string
  assigned_at: string
}

// Fetch all users from pending_users table
export const fetchUsers = async (): Promise<User[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('pending_users')
      .select('id, username, email, created_at, is_confirmed')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    interface PendingUserData {
      id: string
      username: string
      email: string
      created_at: string
      is_confirmed: boolean
    }

    const users: User[] = (data || []).map((user: PendingUserData) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      status: user.is_confirmed ? ('active' as const) : ('inactive' as const),
      created_at: user.created_at,
      is_super_admin: false,
    }))

    return users
  } catch (err) {
    console.error('Error in fetchUsers:', err)
    return []
  }
}

// Fetch all roles
export const fetchRoles = async (): Promise<Role[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching roles:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error in fetchRoles:', err)
    return []
  }
}

// Fetch all active modules
export const fetchModules = async (): Promise<Module[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching modules:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error in fetchModules:', err)
    return []
  }
}

// Assign a role to a user
export const assignRoleToUser = async (
  userId: string,
  roleId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase not configured' }

  try {
    // Check if the assignment already exists
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId)
      .eq('role_id', roleId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return { success: false, error: `Error checking role assignment: ${checkError.message}` }
    }

    if (existingRole) {
      return { success: true } // Role already assigned
    }

    // First, remove any existing role assignment (assuming one role per user)
    const { error: deleteError } = await supabase.from('user_roles').delete().eq('user_id', userId)

    if (deleteError) {
      console.error('Error removing old role:', deleteError)
    }

    // Assign the new role
    const { error } = await supabase.from('user_roles').insert([
      {
        user_id: userId,
        role_id: roleId,
        assigned_at: new Date().toISOString(),
      },
    ])

    if (error) {
      return { success: false, error: `Failed to assign role: ${error.message}` }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// Get roles assigned to a user
export const getUserRoles = async (userId: string): Promise<Role[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('roles(*)')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user roles:', error)
      return []
    }

    interface UserRoleEntry {
      roles: Role
    }

    return (data as unknown as UserRoleEntry[] | null)?.map((entry) => entry.roles).filter(Boolean) || []
  } catch (err) {
    console.error('Error in getUserRoles:', err)
    return []
  }
}

// Assign modules to a role
export const assignModulesToRole = async (
  roleId: string,
  moduleIds: string[]
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase not configured' }

  try {
    // Remove all existing module assignments for this role
    const { error: deleteError } = await supabase
      .from('role_module_access')
      .delete()
      .eq('role_id', roleId)

    if (deleteError) {
      console.error('Error removing old module assignments:', deleteError)
    }

    // Add new module assignments
    if (moduleIds.length > 0) {
      const assignments = moduleIds.map((moduleId) => ({
        role_id: roleId,
        module_id: moduleId,
        assigned_at: new Date().toISOString(),
      }))

      const { error } = await supabase.from('role_module_access').insert(assignments)

      if (error) {
        return { success: false, error: `Failed to assign modules: ${error.message}` }
      }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// Get modules assigned to a role
export const getRoleModules = async (roleId: string): Promise<Module[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('role_module_access')
      .select('modules(*)')
      .eq('role_id', roleId)

    if (error) {
      console.error('Error fetching role modules:', error)
      return []
    }

    interface RoleModuleEntry {
      modules: Module
    }

    return (data as unknown as RoleModuleEntry[] | null)?.map((entry) => entry.modules).filter(Boolean) || []
  } catch (err) {
    console.error('Error in getRoleModules:', err)
    return []
  }
}

// Get all role-module assignments
export const fetchRoleModuleAssignments = async (): Promise<RoleModuleAccess[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('role_module_access')
      .select('*')
      .order('assigned_at', { ascending: false })

    if (error) {
      console.error('Error fetching role module assignments:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error in fetchRoleModuleAssignments:', err)
    return []
  }
}
