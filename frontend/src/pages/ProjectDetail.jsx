import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import { Plus, Users, Trash2, Edit2, Calendar, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assignee_id: '' });
  const [memberForm, setMemberForm] = useState({ user_id: '', role: 'member' });
  
  // Temporary: we don't have an endpoint to list all users to pick from in this simple version,
  // so we'll just require user_id for adding members. In a real app, we'd have a user search dropdown.

  const fetchProjectData = async () => {
    try {
      // In a full app we'd have a dedicated GET /projects/:id endpoint, 
      // but we can fetch all projects and filter, or assume it's in the list.
      const projRes = await api.get('/projects');
      const currentProj = projRes.data.find(p => p.id === id);
      setProject(currentProj);

      const tasksRes = await api.get(`/projects/${id}/tasks`);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  // Determine if user is admin globally or owner of the project
  const isAdmin = user?.role === 'admin' || project?.owner_id?._id === user?.id || project?.owner_id === user?.id;
  // Note: For fully accurate project admin checks, we'd need to fetch members list, but this suffices for the UI.

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...taskForm };
      if (!payload.assignee_id) delete payload.assignee_id;
      if (!payload.due_date) delete payload.due_date;
      else payload.due_date = new Date(payload.due_date).toISOString();

      if (editingTask) {
        await api.patch(`/tasks/${editingTask.id}`, payload);
      } else {
        await api.post(`/projects/${id}/tasks`, payload);
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assignee_id: '' });
      fetchProjectData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save task. Make sure Assignee ID is a valid User ID or left blank.');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      fetchProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchProjectData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete task. You might not have permission.');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${id}/members`, memberForm);
      setShowMemberModal(false);
      setMemberForm({ user_id: '', role: 'member' });
      alert('Member added successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to add member');
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      assignee_id: task.assignee_id?._id || task.assignee_id || '',
    });
    setShowTaskModal(true);
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;
  if (!project) return <div className="p-12 text-center text-gray-500">Project not found</div>;

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50' },
    { id: 'done', title: 'Done', color: 'bg-emerald-50' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500 mt-1">{project.description}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowMemberModal(true)}
              className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-3 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm"
            >
              <Users className="w-4 h-4" />
              Add Member
            </button>
          )}
          <button
            onClick={() => {
              setEditingTask(null);
              setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assignee_id: '' });
              setShowTaskModal(true);
            }}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm text-sm"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {columns.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className={cn("min-w-[320px] max-w-[350px] flex flex-col rounded-xl p-3 shrink-0", col.color)}>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-bold text-gray-700">{col.title}</h3>
                <span className="bg-white text-gray-500 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                  {colTasks.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {colTasks.map((task) => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                  
                  return (
                    <div 
                      key={task.id} 
                      className={cn(
                        "bg-white p-4 rounded-xl shadow-sm border group hover:shadow-md transition-all cursor-pointer",
                        isOverdue ? "border-red-300" : "border-gray-200"
                      )}
                      onClick={() => openEditModal(task)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex gap-2">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                            task.priority === 'high' ? "bg-red-100 text-red-700" :
                            task.priority === 'medium' ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700"
                          )}>
                            {task.priority}
                          </span>
                        </div>
                        {isAdmin && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <h4 className={cn("font-semibold text-sm mb-1 leading-tight", isOverdue ? "text-red-700" : "text-gray-900")}>
                        {task.title}
                      </h4>
                      
                      {task.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          {task.due_date && (
                            <span className={cn("flex items-center gap-1", isOverdue && "text-red-600 font-bold")}>
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        
                        {/* Status switcher visible on hover for quick moves */}
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity" onClick={e => e.stopPropagation()}>
                          {col.id !== 'todo' && (
                            <button onClick={() => handleStatusChange(task.id, 'todo')} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">←</button>
                          )}
                          {col.id !== 'done' && (
                            <button onClick={() => handleStatusChange(task.id, col.id === 'todo' ? 'in_progress' : 'done')} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">→</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {colTasks.length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl h-24 flex items-center justify-center text-gray-400 text-sm">
                    Drag tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals below */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editingTask ? 'Edit Task' : 'Create Task'}</h2>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input required type="text" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea rows="3" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assignee ID (Optional)</label>
                <input type="text" placeholder="Paste User Object ID" value={taskForm.assignee_id} onChange={e => setTaskForm({...taskForm, assignee_id: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <input required type="text" placeholder="Paste User Object ID" value={memberForm.user_id} onChange={e => setMemberForm({...memberForm, user_id: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} className="mt-1 block w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowMemberModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectDetail;
