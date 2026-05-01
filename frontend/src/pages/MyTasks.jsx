import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get('/dashboard'); // Contains myAssignedTasks
        // To be thorough, normally we'd have a /tasks/my endpoint, 
        // but dashboard endpoint already gives user tasks.
        setTasks(res.data.myAssignedTasks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-brand-500" />
          My Tasks
        </h1>
        <p className="text-gray-500 mt-1">All tasks assigned to you across all projects.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {tasks.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {tasks.map((task) => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
              return (
                <li key={task.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <Link to={`/projects/${task.project_id._id || task.project_id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium border uppercase tracking-wide",
                          task.priority === 'high' ? "bg-red-50 text-red-700 border-red-200" :
                          task.priority === 'medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                          {task.priority}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium border uppercase tracking-wide",
                          task.status === 'done' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          task.status === 'in_progress' ? "bg-purple-50 text-purple-700 border-purple-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                        )}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <h4 className={cn(
                        "text-base font-semibold",
                        isOverdue ? "text-red-600" : "text-gray-900"
                      )}>
                        {task.title}
                      </h4>
                      
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {task.description || "No description"}
                      </p>

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                          <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                          {task.project_id.name || 'Project'}
                        </span>
                        <span className={cn("flex items-center gap-1", isOverdue && "text-red-600 font-medium")}>
                          <Calendar className="w-4 h-4" />
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                          {isOverdue && " (Overdue)"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="hidden sm:block text-brand-600 font-medium text-sm bg-brand-50 px-3 py-1.5 rounded-lg">
                      View Project →
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-lg font-medium text-gray-900">You're all caught up!</p>
            <p className="mt-1">You don't have any assigned tasks right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;
