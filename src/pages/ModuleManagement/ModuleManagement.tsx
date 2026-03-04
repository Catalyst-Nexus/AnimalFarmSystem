import { useState } from 'react'
import './ModuleManagement.css'
import '../RoleManagement/RoleManagement.css'

interface Module {
  id: number
  name: string
  description: string
  icon: string
  status: 'active' | 'inactive'
  config: Record<string, any>
}

const ModuleManagement = () => {
  // TODO: Replace with API call to fetch modules
  const [modules, setModules] = useState<Module[]>([])

  const [showModal, setShowModal] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)

  const toggleModuleStatus = (id: number) => {
    setModules(
      modules.map((module) =>
        module.id === id
          ? {
              ...module,
              status: module.status === 'active' ? 'inactive' : 'active',
              config: {
                ...module.config,
                enabled: module.status !== 'active',
              },
            }
          : module
      )
    )
  }

  const handleConfigureModule = (module: Module) => {
    setSelectedModule(module)
    setShowModal(true)
  }

  const handleDeleteModule = (id: number) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      setModules(modules.filter((m) => m.id !== id))
    }
  }

  return (
    <div className="dynamic-module">
      <div className="page-header">
        <h1 className="page-title">Dynamic Module Management</h1>
        <p className="page-description">
          Enable, disable, and configure dynamic modules for your system
        </p>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Available Modules</h2>
          <button className="btn btn-primary">+ Add New Module</button>
        </div>

        <div className="modules-container">
          {modules.map((module) => (
            <div key={module.id} className="module-card">
              <div className="module-icon">{module.icon}</div>
              <h3 className="module-name">{module.name}</h3>
              <p className="module-description">{module.description}</p>

              <div className="module-status">
                <div
                  className={`status-dot ${
                    module.status === 'active' ? 'status-active' : 'status-inactive'
                  }`}
                />
                <span className="status-text">
                  Status: {module.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="module-actions">
                <button
                  className={`toggle-button ${
                    module.status === 'active' ? 'deactivate' : 'activate'
                  }`}
                  onClick={() => toggleModuleStatus(module.id)}
                  aria-label={`${module.status === 'active' ? 'Deactivate' : 'Activate'} ${module.name}`}
                >
                  {module.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  className="btn btn-secondary btn-configure"
                  onClick={() => handleConfigureModule(module)}
                  aria-label={`Configure ${module.name}`}
                >
                  Configure
                </button>
                <button
                  className="btn btn-danger btn-delete"
                  onClick={() => handleDeleteModule(module.id)}
                  aria-label={`Delete ${module.name}`}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section config-section">
        <div className="section-header">
          <h2 className="section-title">Global Configuration</h2>
        </div>

        <div className="config-form">
          <div className="form-group">
            <label className="form-label" htmlFor="auto-update">Auto-Update Modules</label>
            <div className="form-switch">
              <label className="switch">
                <input
                  id="auto-update"
                  type="checkbox"
                  defaultChecked
                  aria-label="Enable auto-update modules"
                />
                <span className="slider"></span>
              </label>
              <span className="status-text">Enabled</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="module-logging">Module Logging</label>
            <div className="form-switch">
              <label className="switch">
                <input
                  id="module-logging"
                  type="checkbox"
                  defaultChecked
                  aria-label="Enable module logging"
                />
                <span className="slider"></span>
              </label>
              <span className="status-text">Enabled</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="security-scan">Security Scan</label>
            <div className="form-switch">
              <label className="switch">
                <input
                  id="security-scan"
                  type="checkbox"
                  aria-label="Enable security scan"
                />
                <span className="slider"></span>
              </label>
              <span className="status-text">Disabled</span>
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedModule && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-header">Configure {selectedModule.name}</h2>
            <form>
              <div className="form-group">
                <label className="form-label" htmlFor="module-status">Module Status</label>
                <select
                  id="module-status"
                  className="form-input"
                  defaultValue={selectedModule.status}
                  aria-label="Select module status"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Configuration Notes</label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter any configuration notes..."
                  defaultValue={JSON.stringify(selectedModule.config, null, 2)}
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
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowModal(false)}
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModuleManagement
