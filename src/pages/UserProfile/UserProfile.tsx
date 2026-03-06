import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/store'
import { cn } from '@/lib/utils'
import { uploadImage } from '@/services/imageUpload'
import { hasRegisteredFace } from '@/services/biometricsService'
import { FaceRegistration } from '@/components/FaceRecognition'
import { getIconByName } from '@/lib/iconMap'
import { supabase } from '@/services/supabase'
import {
  Shield,
  Edit,
  User,
  Mail,
  IdCard,
  Calendar,
  CheckCircle,
  Lock,
  Key,
  Smartphone,
  Activity,
  X,
  Camera,
  Scan,
  Building2,
  Layers,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'

const UserProfile = () => {
  const user = useAuthStore((state) => state.user)
  const updateProfilePicture = useAuthStore((state) => state.updateProfilePicture)
  const [showEditModal, setShowEditModal] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [pictureError, setPictureError] = useState<string | null>(null)
  const pictureInputRef = useRef<HTMLInputElement>(null)
  
  // Face recognition state
  const [hasFaceRegistered, setHasFaceRegistered] = useState(false)
  const [checkingFace, setCheckingFace] = useState(true)
  const [showFaceRegistration, setShowFaceRegistration] = useState(false)
  
  // Facilities state
  interface Facility {
    id: string
    facility_name: string
    is_active: boolean
  }
  const [userFacilities, setUserFacilities] = useState<Facility[]>([])
  const [facilitiesLoading, setFacilitiesLoading] = useState(true)
  
  // Permissions state (organised by role)
  interface ModulePermission {
    module_id: string
    module_name: string
    icons: string | null
    can_select: boolean
    can_insert: boolean
    can_update: boolean
    can_delete: boolean
  }
  interface RoleWithPermissions {
    role_id: string
    role_name: string
    role_code: string
    modules: ModulePermission[]
  }
  const [userRolePermissions, setUserRolePermissions] = useState<RoleWithPermissions[]>([])
  const [permissionsLoading, setPermissionsLoading] = useState(true)

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const accountInfo = [
    { icon: IdCard, label: "User ID", value: user?.id || "1" },
    { icon: User, label: "Username", value: user?.username || "user" },
    {
      icon: Mail,
      label: "Email Address",
      value: user?.email || "user@example.com",
    },
    {
      icon: CheckCircle,
      label: "Account Status",
      value: "Active",
      isStatus: true,
    },
    { icon: Calendar, label: "Member Since", value: "January 2026" },
  ];

  const securityItems = [
    {
      icon: Scan,
      label: 'Face Recognition',
      description: hasFaceRegistered 
        ? 'Your face is registered for quick login'
        : 'Register your face for passwordless login',
      status: checkingFace ? '...' : hasFaceRegistered ? 'Enabled' : 'Not Set',
      statusType: hasFaceRegistered ? 'success' : 'warning',
      action: hasFaceRegistered ? 'Update' : 'Register',
      actionType: hasFaceRegistered ? 'outline' : 'success',
      onClick: () => setShowFaceRegistration(true),
    },
    {
      icon: Smartphone,
      label: "Two-Factor Authentication",
      description: "Add an extra layer of security to your account",
      status: "Disabled",
      statusType: "warning",
      action: "Enable",
      actionType: "success",
    },
    {
      icon: Key,
      label: "Password",
      description: "Last changed 3 months ago",
      action: "Change",
      actionType: "outline",
    },
    {
      icon: Activity,
      label: "Active Sessions",
      description: "2 devices currently logged in",
      action: "View All",
      actionType: "outline",
    },
  ];

  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPicture(true);
    setPictureError(null);

    const userId = user?.id || "user";
    const result = await uploadImage(
      file,
      "profile_picture",
      `${userId}-${Date.now()}`,
    );

    if (result.success && result.url) {
      updateProfilePicture(result.url);
    } else {
      setPictureError(result.error || "Failed to upload profile picture");
    }

    setUploadingPicture(false);

    // Reset file input
    if (pictureInputRef.current) {
      pictureInputRef.current.value = "";
    }
  };

  const handleRemoveProfilePicture = () => {
    updateProfilePicture(null);
    setPictureError(null);
  };

  // Check if user has registered face on mount
  useEffect(() => {
    const checkFaceRegistration = async () => {
      if (!user?.id) {
        setCheckingFace(false)
        return
      }

      try {
        const isRegistered = await hasRegisteredFace(user.id)
        setHasFaceRegistered(isRegistered)
      } catch (error) {
        console.error('Error checking face registration:', error)
      } finally {
        setCheckingFace(false)
      }
    }

    checkFaceRegistration()
  }, [user?.id])

  // Load user facilities
  useEffect(() => {
    const loadFacilities = async () => {
      if (!user?.id || !supabase) {
        setFacilitiesLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('user_facilities')
          .select(`
            facilities:facility_id (
              id,
              facility_name,
              is_active
            )
          `)
          .eq('user_id', user.id)

        if (error) throw error
        const facilities = (data || [])
          .flatMap((entry: { facilities: { id: string; facility_name: string; is_active: boolean }[] }) => entry.facilities ?? [])
          .filter(Boolean) as Facility[]
        setUserFacilities(facilities)
      } catch (error) {
        console.error('Error loading facilities:', error)
      } finally {
        setFacilitiesLoading(false)
      }
    }

    loadFacilities()
  }, [user?.id])

  // Load role permissions and modules (organised by role → module → permissions)
  useEffect(() => {
    const loadPermissions = async () => {
      if (!user?.id || !supabase) {
        setPermissionsLoading(false)
        return
      }

      try {
        // 1. Get the user's assigned roles (with role details)
        const { data: userRolesData, error: userRolesError } = await supabase
          .from('user_roles')
          .select('role_id, roles:role_id(id, role_name, role_code)')
          .eq('user_id', user.id)

        if (userRolesError) throw userRolesError
        if (!userRolesData || userRolesData.length === 0) {
          setUserRolePermissions([])
          setPermissionsLoading(false)
          return
        }

        // 2. Load all active modules once
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('id, module_name, icons')
          .eq('is_active', true)

        if (modulesError) throw modulesError
        const moduleMap = new Map((modulesData || []).map((m: { id: string; module_name: string; icons: string | null }) => [m.id, m]))

        // 3. For each role fetch role_permission rows and combine
        const results: RoleWithPermissions[] = []

        for (const entry of userRolesData) {
          const roleInfo = (entry.roles as unknown as { id: string; role_name: string; role_code: string } | null)
          if (!roleInfo) continue

          const { data: permsData, error: permsError } = await supabase
            .from('role_permissions')
            .select('module_id, can_select, can_insert, can_update, can_delete')
            .eq('role_id', roleInfo.id)

          if (permsError) throw permsError

          const modules: ModulePermission[] = (permsData || []).reduce(
            (acc: ModulePermission[], perm: { module_id: string; can_select: boolean; can_insert: boolean; can_update: boolean; can_delete: boolean }) => {
              const mod = moduleMap.get(perm.module_id)
              if (!mod) return acc
              acc.push({
                module_id: perm.module_id,
                module_name: (mod as { id: string; module_name: string; icons: string | null }).module_name,
                icons: (mod as { id: string; module_name: string; icons: string | null }).icons ?? null,
                can_select: perm.can_select,
                can_insert: perm.can_insert,
                can_update: perm.can_update,
                can_delete: perm.can_delete,
              })
              return acc
            },
            [],
          )

          results.push({
            role_id: roleInfo.id,
            role_name: roleInfo.role_name,
            role_code: roleInfo.role_code,
            modules,
          })
        }

        setUserRolePermissions(results)
      } catch (error) {
        console.error('Error loading permissions:', error)
      } finally {
        setPermissionsLoading(false)
      }
    }

    loadPermissions()
  }, [user?.id])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">User Profile</h1>
        <p className="text-sm text-muted mt-1">
          View and manage your profile information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Left Sidebar - Profile Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 text-center h-fit">
          {/* Avatar */}
          <div className="flex justify-center mb-4 relative group">
            {user?.profilePicture ? (
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                  <img
                    src={user.profilePicture}
                    alt={user.username || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={handleRemoveProfilePicture}
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-danger/90"
                  title="Remove picture"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-3xl font-bold">
                {user?.username ? getInitials(user.username) : "U"}
              </div>
            )}

            {/* Upload Button */}
            <div className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-2">
              <input
                ref={pictureInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
                id="profile-picture-upload"
                disabled={uploadingPicture}
                aria-label="Profile picture upload"
              />
              <label
                htmlFor="profile-picture-upload"
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full",
                  "bg-primary text-white cursor-pointer shadow-lg",
                  "hover:bg-primary-light transition-colors",
                  uploadingPicture && "opacity-50 cursor-not-allowed",
                )}
                title="Change profile picture"
              >
                <Camera className="w-5 h-5" />
              </label>
            </div>
          </div>

          {pictureError && (
            <div className="mb-3 p-2 rounded-lg text-xs bg-danger/10 text-danger border border-danger/20">
              {pictureError}
            </div>
          )}

          <h2 className="text-xl font-bold text-primary">
            {user?.username || "User"}
          </h2>
          <p className="text-sm text-muted mt-1">
            {user?.email || "user@example.com"}
          </p>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Active Account
          </div>

          {/* Edit Button */}
          <button
            className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-light transition-colors"
            onClick={() => setShowEditModal(true)}
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        </div>

        {/* Right Content */}
        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                <User className="w-5 h-5" />
                Account Information
              </h3>
              <p className="text-sm text-muted mt-1">
                Your personal account details
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accountInfo.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 p-4 bg-background rounded-xl"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10 text-success">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs text-muted font-medium uppercase tracking-wide">
                        {item.label}
                      </span>
                      {item.isStatus ? (
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-success mt-1">
                          <span className="w-2 h-2 rounded-full bg-success" />
                          {item.value}
                        </span>
                      ) : (
                        <span className="block text-sm font-semibold text-foreground mt-1">
                          {item.value}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Assigned Facilities */}
              <div className="flex items-start gap-3 p-4 bg-background rounded-xl">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10 text-success flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs text-muted font-medium uppercase tracking-wide">
                    Assigned Facilities
                  </span>
                  {facilitiesLoading ? (
                    <span className="block text-sm text-muted mt-1">
                      Loading...
                    </span>
                  ) : userFacilities.length === 0 ? (
                    <span className="block text-sm text-muted mt-1">
                      No facilities assigned
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {userFacilities.map((facility) => (
                        <div
                          key={facility.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-semibold",
                            facility.is_active
                              ? "text-foreground"
                              : "text-muted",
                          )}
                        >
                          <Building2 className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>{facility.facility_name}</span>
                          <span
                            className={cn(
                              "font-medium",
                              facility.is_active
                                ? "text-success"
                                : "text-muted",
                            )}
                          >
                            {facility.is_active ? "● Active" : "● Inactive"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Roles, Modules & Permissions */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  Roles, Modules &amp; Permissions
                </span>
              </div>

              {permissionsLoading ? (
                <div className="flex items-center justify-center py-6 text-muted text-sm">
                  Loading permissions...
                </div>
              ) : userRolePermissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted">
                  <Layers className="w-7 h-7 opacity-40" />
                  <span className="text-sm">No roles or module access assigned</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {userRolePermissions.map((roleEntry) => (
                    <div key={roleEntry.role_id} className="rounded-xl border border-border overflow-hidden">
                      {/* Role header */}
                      <div className="flex items-center gap-2.5 px-4 py-3 bg-primary/5 border-b border-border">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">
                            {roleEntry.role_name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {roleEntry.role_code}
                          </span>
                        </div>
                        <span className="ml-auto text-xs text-muted">
                          {roleEntry.modules.length} module{roleEntry.modules.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {roleEntry.modules.length === 0 ? (
                        <div className="flex items-center justify-center py-5 text-sm text-muted">
                          No modules assigned to this role
                        </div>
                      ) : (
                        <>
                          {/* Table column headers */}
                          <div className="grid grid-cols-[1fr_64px_64px_64px_64px] items-center px-4 py-2 bg-background border-b border-border">
                            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                              Module
                            </span>
                            {['View', 'Create', 'Edit', 'Delete'].map((h) => (
                              <span
                                key={h}
                                className="text-xs font-semibold text-muted uppercase tracking-wider text-center"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                          {/* Module rows */}
                          <div className="divide-y divide-border">
                            {roleEntry.modules.map((mod) => {
                              const ModIcon = getIconByName(mod.icons ?? null)
                              const cols = [
                                mod.can_select,
                                mod.can_insert,
                                mod.can_update,
                                mod.can_delete,
                              ]
                              return (
                                <div
                                  key={mod.module_id}
                                  className="grid grid-cols-[1fr_64px_64px_64px_64px] items-center px-4 py-3 bg-surface hover:bg-background transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-info/10 text-info flex-shrink-0">
                                      <ModIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground truncate">
                                      {mod.module_name}
                                    </span>
                                  </div>
                                  {cols.map((val, i) => (
                                    <div key={i} className="flex justify-center">
                                      {val ? (
                                        <CheckCircle2 className="w-5 h-5 text-success" />
                                      ) : (
                                        <XCircle className="w-5 h-5 text-border" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Security & Privacy */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Lock className="w-5 h-5" />
                Security & Privacy
              </h3>
              <p className="text-sm text-muted mt-1">
                Manage your security settings
              </p>
            </div>

            <div className="space-y-4">
              {securityItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between p-4 bg-background rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-info/10 text-info">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-foreground">
                          {item.label}
                        </span>
                        <span className="block text-xs text-muted mt-0.5">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.status && (
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium",
                            item.statusType === "warning"
                              ? "bg-warning/10 text-warning"
                              : "bg-success/10 text-success",
                          )}
                        >
                          {item.status}
                        </span>
                      )}
                      <button
                        onClick={item.onClick}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                          item.actionType === "success"
                            ? "bg-success text-white hover:bg-success/90"
                            : "border border-border text-foreground hover:bg-background",
                        )}
                      >
                        {item.action}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Face Registration Modal */}
      <FaceRegistration
        isOpen={showFaceRegistration}
        onClose={() => setShowFaceRegistration(false)}
        onSuccess={() => setHasFaceRegistered(true)}
      />

      {/* Edit Profile Modal */}
      <Dialog.Root open={showEditModal} onOpenChange={setShowEditModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl z-50">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <Dialog.Title className="text-lg font-semibold text-primary">
                Edit Profile
              </Dialog.Title>
              <Dialog.Close className="p-2 rounded-lg hover:bg-background transition-colors text-muted">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                  defaultValue={user?.username || ""}
                  placeholder="Enter username"
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Contact Details
                </span>
                <div className="space-y-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
                      defaultValue={user?.email || ""}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <Dialog.Close className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-background transition-colors">
                Cancel
              </Dialog.Close>
              <button
                className="px-4 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 transition-colors"
                onClick={() => setShowEditModal(false)}
              >
                Save Changes
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default UserProfile;
