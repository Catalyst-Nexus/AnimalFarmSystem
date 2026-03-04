import { useState } from 'react'
import './AssignmentManagement.css'
import '../RoleManagement/RoleManagement.css'

interface Assignment {
  id: number
  title: string
  description: string
  assignedTo: string
  status: 'pending' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  progress: number
}

const AssignmentManagement = () => {
  // TODO: Replace with API call to fetch assignments
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    status: 'pending' as Assignment['status'],
    priority: 'medium' as Assignment['priority'],
    dueDate: '',
  })

  const filteredAssignments = assignments.filter((assignment) => {
    const statusMatch = filterStatus === 'all' || assignment.status === filterStatus
    const priorityMatch =
      filterPriority === 'all' || assignment.priority === filterPriority
    return statusMatch && priorityMatch
  })

  const handleAddAssignment = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: '',
      status: 'pending',
      priority: 'medium',
      dueDate: '',
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newAssignment: Assignment = {
      id: Math.max(...assignments.map((a) => a.id), 0) + 1,
      ...formData,
      progress: 0,
    }

    setAssignments([...assignments, newAssignment])
    setShowModal(false)
  }

  const handleDeleteAssignment = (id: number) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      setAssignments(assignments.filter((a) => a.id !== id))
    }
  }

  const getStatusClass = (status: string) => {
    if (status === 'pending') return 'status-pending'
    if (status === 'in-progress') return 'status-in-progress'
    return 'status-completed'
  }

  return (
    <div className="assignment">
      <div className="page-header">
        <h1 className="page-title">Assignment Module</h1>
        <p className="page-description">Manage and track all assignments</p>
      </div>

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">All Assignments</h2>
          <button className="btn btn-primary" onClick={handleAddAssignment}>
            + Create Assignment
          </button>
        </div>

        <div className="filters">
          <label htmlFor="status-filter" className="filter-label">
            <select
              id="status-filter"
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <label htmlFor="priority-filter" className="filter-label">
            <select
              id="priority-filter"
              className="filter-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              aria-label="Filter by priority"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>

        <div className="assignments-grid">
          {filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="assignment-card">
              <div className="assignment-header">
                <div>
                  <h3 className="assignment-title">{assignment.title}</h3>
                </div>
                <span
                  className={`assignment-status ${getStatusClass(
                    assignment.status
                  )}`}
                >
                  {assignment.status}
                </span>
              </div>

              <p className="assignment-description">{assignment.description}</p>

              <div className="assignment-meta">
                <div className="meta-item">
                  <span className="meta-icon">👤</span>
                  <span>Assigned to: {assignment.assignedTo}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">⚠️</span>
                  <span>Priority: {assignment.priority}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  <span>Due: {assignment.dueDate}</span>
                </div>
              </div>

              {assignment.status !== 'pending' && (
                <div>
                  <div className="progress-label">
                    Progress: {assignment.progress}%
                  </div>
                  <div className="progress-bar" role="progressbar" aria-label={`Progress: ${assignment.progress}%`}>
                    <div
                      className="progress-fill"
                      style={{ width: `${assignment.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="assignment-actions">
                <button className="btn btn-secondary btn-small">View</button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleDeleteAssignment(assignment.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-header">Create New Assignment</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Assignment title"
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
                  placeholder="Assignment description"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned To</label>
                <input
                  className="form-input"
                  type="text"
                  value={formData.assignedTo}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedTo: e.target.value })
                  }
                  placeholder="Person name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="assignment-priority">Priority</label>
                <select
                  id="assignment-priority"
                  className="form-input"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as Assignment['priority'],
                    })
                  }
                  aria-label="Select priority level"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="assignment-due-date">Due Date</label>
                <input
                  id="assignment-due-date"
                  className="form-input"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  aria-label="Select due date"
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssignmentManagement
