import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ListTodo,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const StatCard = ({ title, value, icon: Icon, trend, colorClass }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={cn("p-3 rounded-xl", colorClass)}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-sm">
        <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
        <span className="text-emerald-500 font-medium">{trend}</span>
        <span className="text-gray-500 ml-2">vs last week</span>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard');
        setStats(res.data);
      } catch (err) {
        setError('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error) return <div className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your projects today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Tasks" 
          value={stats?.totalTasks || 0} 
          icon={ListTodo}
          colorClass="bg-blue-50 text-blue-600"
        />
        <StatCard 
          title="To Do" 
          value={stats?.tasksByStatus?.todo || 0} 
          icon={Clock}
          colorClass="bg-gray-50 text-gray-600"
        />
        <StatCard 
          title="In Progress" 
          value={stats?.tasksByStatus?.in_progress || 0} 
          icon={TrendingUp}
          colorClass="bg-amber-50 text-amber-600"
        />
        <StatCard 
          title="Completed" 
          value={stats?.tasksByStatus?.done || 0} 
          icon={CheckCircle2}
          colorClass="bg-emerald-50 text-emerald-600"
        />
      </div>

      {stats?.overdueTasks > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-4">
          <div className="bg-red-100 p-2 rounded-lg shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-800">Action Required</h3>
            <p className="text-red-600 text-sm mt-1">
              You have {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''} across your projects.
            </p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          Upcoming Tasks (My Assignments)
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {stats?.myAssignedTasks?.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {stats.myAssignedTasks.map((task) => {
                const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'done';
                return (
                  <li key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <Link to={`/projects/${task.project_id._id || task.project_id}`} className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className={cn(
                          "text-sm font-medium",
                          isOverdue ? "text-red-600" : "text-gray-900"
                        )}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-0.5 rounded">
                            {task.project_id.name || 'Project'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium border",
                          task.status === 'done' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          task.status === 'in_progress' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                        )}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No tasks assigned to you right now. You're all caught up!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
