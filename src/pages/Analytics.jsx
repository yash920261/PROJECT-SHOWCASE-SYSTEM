import { Activity, Users, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Analytics.css';

// Mock Data
const MONTHLY_DATA = [
  { name: 'Jan', submissions: 12, approved: 8 },
  { name: 'Feb', submissions: 19, approved: 15 },
  { name: 'Mar', submissions: 25, approved: 20 },
  { name: 'Apr', submissions: 32, approved: 28 },
  { name: 'May', submissions: 45, approved: 35 },
  { name: 'Jun', submissions: 60, approved: 50 },
];

const DEPT_DATA = [
  { name: 'CS', value: 45 },
  { name: 'EE', value: 25 },
  { name: 'ME', value: 15 },
  { name: 'CE', value: 10 },
  { name: 'IT', value: 30 },
];

const COLORS = ['#4285f4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Analytics = () => {
  return (
    <div className="analytics-page container animate-fade-in">
      
      <div className="page-header">
        <h1>Platform Analytics</h1>
        <p>Real-time statistics and insights on university projects.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon bg-primary-light">
            <FileText size={24} className="text-primary" />
          </div>
          <div className="stat-info">
            <h3>Total Projects</h3>
            <p className="stat-value">156</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon bg-success-light">
            <CheckCircle size={24} className="text-success" />
          </div>
          <div className="stat-info">
            <h3>Approved</h3>
            <p className="stat-value">124</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon bg-warning-light">
            <Clock size={24} className="text-warning" />
          </div>
          <div className="stat-info">
            <h3>Pending Review</h3>
            <p className="stat-value">23</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon bg-danger-light">
            <XCircle size={24} className="text-danger" />
          </div>
          <div className="stat-info">
            <h3>Rejected</h3>
            <p className="stat-value">9</p>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        
        <div className="chart-card glass-panel col-span-2">
          <div className="chart-header">
            <h3>Submission Trends</h3>
            <select className="chart-filter">
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="submissions" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSub)" name="Total Submissions" />
                <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorApp)" name="Approved Projects" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card glass-panel">
          <div className="chart-header">
            <h3>Projects by Department</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DEPT_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {DEPT_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  itemStyle={{ color: '#1e293b' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            {DEPT_DATA.map((dept, i) => (
              <div key={dept.name} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: COLORS[i] }}></span>
                <span className="legend-label">{dept.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
