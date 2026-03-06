import { useState, useEffect } from 'react'
import { authService } from '../services/authService'

interface CognitoUser {
  uuid: string
  username: string
  email: string
  status: string
  groups: string[]
}

interface UsersResponse {
  users: CognitoUser[]
  total: number
}

const UserManagement = () => {
  const [users, setUsers] = useState<CognitoUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserGroup, setNewUserGroup] = useState('profesores')
  const [newUserDisplayName, setNewUserDisplayName] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { getApiUrl } = await import('../config/api')
      const response = await fetch(`${getApiUrl()}/api/users`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data: UsersResponse = await response.json()
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUserEmail.trim()) {
      setError('El email es requerido')
      return
    }

    try {
      const { getApiUrl } = await import('../config/api')
      const response = await fetch(`${getApiUrl()}/api/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          group: newUserGroup,
          displayName: newUserDisplayName.trim() || newUserEmail.split('@')[0]
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      setNewUserEmail('')
      setNewUserDisplayName('')
      setNewUserGroup('profesores')
      setShowAddForm(false)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario')
    }
  }

  const deleteUser = async (username: string, email: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${email}?`)) {
      return
    }

    try {
      const { getApiUrl } = await import('../config/api')
      const response = await fetch(`${getApiUrl()}/api/users/${username}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar usuario')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'CONFIRMED': { text: 'Confirmado', class: 'status-confirmed' },
      'FORCE_CHANGE_PASSWORD': { text: 'Cambiar contraseña', class: 'status-pending' },
      'UNCONFIRMED': { text: 'Sin confirmar', class: 'status-unconfirmed' }
    }
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, class: 'status-unknown' }
    
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>
  }

  const getGroupBadge = (group: string) => {
    const groupMap = {
      'profesores': { text: 'Profesor', class: 'group-profesor' },
      'jefatura': { text: 'Jefatura', class: 'group-jefatura' },
      'administradores': { text: 'Admin', class: 'group-admin' }
    }
    
    const groupInfo = groupMap[group as keyof typeof groupMap] || { text: group, class: 'group-unknown' }
    
    return <span className={`group-badge ${groupInfo.class}`}>{groupInfo.text}</span>
  }

  if (loading) {
    return <div className="loading">Cargando usuarios...</div>
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error al cargar usuarios: {error}</p>
        <button onClick={loadUsers}>Reintentar</button>
      </div>
    )
  }

  return (
    <div className="user-management">
      <div className="section-header">
        <h2>Gestión de Usuarios</h2>
        <div>
          <button onClick={() => setShowAddForm(!showAddForm)} className="add-btn">
            ➕ Añadir Usuario
          </button>
          <button onClick={loadUsers} className="refresh-btn">🔄 Actualizar</button>
        </div>
      </div>
      
      {showAddForm && (
        <form onSubmit={addUser} className="add-user-form">
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Nombre a mostrar:</label>
            <input
              type="text"
              value={newUserDisplayName}
              onChange={(e) => setNewUserDisplayName(e.target.value)}
              placeholder="Opcional - se usará el email si está vacío"
            />
          </div>
          <div className="form-group">
            <label>Grupo:</label>
            <select
              value={newUserGroup}
              onChange={(e) => setNewUserGroup(e.target.value)}
            >
              <option value="profesores">Profesores</option>
              <option value="jefatura">Jefatura</option>
              <option value="administradores">Administradores</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit">Crear Usuario</button>
            <button type="button" onClick={() => setShowAddForm(false)}>Cancelar</button>
          </div>
        </form>
      )}
      
      <div className="users-summary">
        <span>Total de usuarios: {users.length}</span>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>UUID</th>
              <th>Estado</th>
              <th>Grupos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.uuid}>
                <td>{user.email}</td>
                <td className="uuid-cell">{user.uuid}</td>
                <td>{getStatusBadge(user.status)}</td>
                <td>
                  {user.groups.map((group) => (
                    <span key={group}>{getGroupBadge(group)}</span>
                  ))}
                </td>
                <td>
                  <button 
                    onClick={() => deleteUser(user.username, user.email)}
                    className="delete-btn"
                    title="Eliminar usuario"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserManagement
