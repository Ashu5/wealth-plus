import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, ShieldCheck, Users, AlertTriangle, CheckCircle2, RefreshCw, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './admin.css';
import { addNewUser, forceLogoutUser, searchUsers, updateUserRole, type AdminRole } from '../../services/admin-service';

type AdminUser = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
  lastSeen: string;
  createdAt: string;
};

type AdminUserForm = {
  email: string;
  username: string;
  fullName: string;
  password: string;
  role: AdminRole;
};

const roleOptions: Array<{ value: AdminRole; label: string; description: string }> = [
  { value: 'READ_ONLY', label: 'Read Only', description: 'View access only' },
  { value: 'CAN_EDIT', label: 'Can Edit', description: 'Can edit portfolio data' },
  { value: 'DELETE', label: 'Delete', description: 'Full operational access' },
];

const normalizeUsers = (payload: unknown): AdminUser[] => {
  if (Array.isArray(payload)) {
    return payload.map((item, index) => normalizeUser(item, index));
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.users)) {
      return record.users.map((item, index) => normalizeUser(item, index));
    }
    if (Array.isArray(record.data)) {
      return record.data.map((item, index) => normalizeUser(item, index));
    }
  }

  return [];
};

const normalizeUser = (item: unknown, index: number): AdminUser => {
  const record = (item ?? {}) as Record<string, unknown>;
  const email = typeof record.email === 'string' ? record.email : '';
  const username = typeof record.username === 'string' ? record.username : (typeof record.userName === 'string' ? record.userName : email.split('@')[0] || `user-${index + 1}`);
  const fullName = typeof record.fullName === 'string' ? record.fullName : [record.firstName, record.lastName].filter(Boolean).join(' ').trim() || username;
  const roleValue = (typeof record.role === 'string' ? record.role : 'READ_ONLY') as AdminRole;
  const isActive = typeof record.isActive === 'boolean' ? record.isActive : true;

  return {
    id: typeof record.id === 'string' ? record.id : `${email}-${index + 1}`,
    email,
    username,
    fullName,
    role: roleOptions.some((option) => option.value === roleValue) ? roleValue : 'READ_ONLY',
    isActive,
    lastSeen: typeof record.lastSeen === 'string' ? record.lastSeen : 'Recently active',
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : 'N/A',
  };
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminRole | 'ALL'>('ALL');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<AdminUserForm>({
    email: '',
    username: '',
    fullName: '',
    password: '',
    role: 'READ_ONLY',
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('wealth-plus-auth') === 'true';
    if (!isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async (term = '') => {
    try {
      setLoading(true);
      const result = await searchUsers(term);
      setUsers(normalizeUsers(result));
      setMessage(null);
    } catch (error) {
      console.error('Unable to load admin users:', error);
      setMessage('Unable to fetch users right now.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !term || [user.email, user.username, user.fullName].some((value) => value.toLowerCase().includes(term));
      const matchesRole = selectedRole === 'ALL' || user.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [search, selectedRole, users]);

  const handleRoleChange = async (userId: string, role: AdminRole) => {
    const targetUser = users.find((user) => user.id === userId);
    if (!targetUser) {
      return;
    }

    try {
      await updateUserRole(targetUser.email, role);
      setUsers((current) => current.map((user) => (user.id === userId ? { ...user, role } : user)));
      setMessage(`Role updated to ${role}.`);
    } catch (error) {
      console.error('Unable to update role:', error);
      setMessage('Unable to update role right now.');
    }
  };

  const handleAddUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.email || !form.username || !form.fullName || !form.password) {
      setMessage('Please complete all fields before adding a user.');
      return;
    }

    try {
      await addNewUser({
        email: form.email,
        firstName: form.fullName.split(' ')[0] || '',
        lastName: form.fullName.split(' ').slice(1).join(' ') || '',
        password: form.password,
        role: form.role,
      });

      setForm({ email: '', username: '', fullName: '', password: '', role: 'READ_ONLY' });
      setMessage(`User ${form.email} was added successfully.`);
      await loadUsers(search);
    } catch (error) {
      console.error('Unable to add user:', error);
      setMessage('Unable to add user right now.');
    }
  };

  const handleRefresh = async () => {
    await loadUsers(search);
  };

  const handleForceLogout = async (email: string) => {
    try {
      await forceLogoutUser(email);
      setMessage(`Force logout request sent for ${email}.`);
      await loadUsers(search);
    } catch (error) {
      console.error('Unable to force logout user:', error);
      setMessage('Unable to force logout that user.');
    }
  };

  return (
    <div className="admin-page-shell">
      <div className="admin-page-card">
        <section className="admin-hero">
          <div>
            <p className="admin-kicker">Admin workspace</p>
            <h1>Manage users and access controls</h1>
            <p className="admin-subtitle">Monitor active sessions, search for users quickly, and assign role-based permissions in a secure, audit-friendly workflow.</p>
          </div>
          <button type="button" className="admin-refresh-btn" onClick={() => void handleRefresh()} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </section>

        {message && (
          <div className="admin-alert" role="status">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        <div className="admin-grid">
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-label">User directory</p>
                <h2>Active users</h2>
              </div>
              <div className="panel-stat">
                <Users size={18} />
                <span>{users.filter((user) => user.isActive).length} active</span>
              </div>
            </div>

            <div className="toolbar">
              <label className="search-box">
                <Search size={16} />
                <input
                  type="search"
                  value={search}
                  placeholder="Search by email, username, or name"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>

              <label className="select-box">
                <span>Role</span>
                <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as AdminRole | 'ALL')}>
                  <option value="ALL">All roles</option>
                  <option value="READ_ONLY">Read Only</option>
                  <option value="CAN_EDIT">Can Edit</option>
                  <option value="DELETE">Delete</option>
                </select>
                <ChevronDown size={16} />
              </label>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last seen</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar">{user.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                          <div>
                            <strong>{user.fullName}</strong>
                            <div className="user-meta">{user.email}</div>
                            <div className="user-meta">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select value={user.role} onChange={(event) => void handleRoleChange(user.id, event.target.value as AdminRole)}>
                          {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={`status-pill ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{user.lastSeen}</td>
                      <td>
                        <button type="button" className="ghost-btn" onClick={() => void handleForceLogout(user.email)}>
                          Force logout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="admin-panel side-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-label">Add user</p>
                <h2>Create account</h2>
              </div>
              <ShieldCheck size={20} />
            </div>

            <form className="admin-form" onSubmit={(event) => void handleAddUser(event)}>
              <label>
                <span>Full name</span>
                <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Jane Doe" />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="jane@example.com" />
              </label>
              <label>
                <span>Username</span>
                <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="jane.user" />
              </label>
              <label>
                <span>Password</span>
                <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Create a password" />
              </label>
              <label>
                <span>Role</span>
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as AdminRole })}>
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <button type="submit" className="primary-btn">
                <Plus size={16} />
                Add user
              </button>
            </form>

            <div className="info-card">
              <div className="info-card-title">
                <AlertTriangle size={16} />
                <span>Recommended practices</span>
              </div>
              <ul>
                <li>Use least-privilege roles for new users.</li>
                <li>Review active sessions frequently for suspicious access.</li>
                <li>Rotate passwords for users with DELETE access.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
