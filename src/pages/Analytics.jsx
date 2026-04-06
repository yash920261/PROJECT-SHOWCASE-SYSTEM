import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Users, FileText, CheckCircle, Clock, XCircle, TrendingUp, ArrowUp, ArrowDown, RefreshCw, ShieldOff } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import './Analytics.css';

const DEPT_COLORS = {
  cs: '#8781ff', ee: '#00d2fd', me: '#10b981', ce: '#f59e0b', it: '#ffb785'
};
const ALL_DEPTS = ['cs', 'ee', 'me', 'ce', 'it'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Animated counter hook
const useAnimatedCounter = (target, duration = 1200) => {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let startTime;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);
  return val;
};

const StatCard = ({ icon: Icon, label, value, trend, trendLabel, colorClass }) => {
  const animVal = useAnimatedCounter(value);
  return (
    <div className={`stat-card glass-panel`}>
      <div className={`stat-icon ${colorClass}`}><Icon size={24} /></div>
      <div className="stat-info">
        <h3>{label}</h3>
        <p className="stat-value">{animVal}</p>
        {trend !== undefined && (
          <span className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
            {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(trend)}% {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
};

// Custom Tooltip
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="tooltip-item" style={{ color: p.color }}>
          <span className="tooltip-dot" style={{ background: p.color }} />
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export const Analytics = () => {
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [deptData, setDeptData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6m'); // '3m', '6m', '1y'
  const [activeDept, setActiveDept] = useState(null); // pie click filter
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [authorized, setAuthorized] = useState(null); // null = checking, true/false
  const navigate = useNavigate();

  // Role check on mount
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAuthorized(false);
        return;
      }
      const role = user.user_metadata?.role;
      if (role === 'faculty' || role === 'admin') {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
    };
    checkAccess();
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all projects
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, status, department, created_at, title, groups(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const all = projects || [];

      // === Stats ===
      const approved = all.filter(p => p.status === 'approved').length;
      const pending = all.filter(p => p.status === 'pending').length;
      const rejected = all.filter(p => p.status === 'rejected').length;
      setStats({ total: all.length, approved, pending, rejected });

      // === Department Breakdown ===
      const deptCounts = {};
      ALL_DEPTS.forEach(d => deptCounts[d] = 0);
      all.forEach(p => {
        const dept = (p.department || '').toLowerCase();
        if (deptCounts[dept] !== undefined) deptCounts[dept]++;
      });
      setDeptData(
        ALL_DEPTS.map(d => ({
          name: d.toUpperCase(),
          value: deptCounts[d],
          fill: DEPT_COLORS[d]
        }))
      );

      // === Monthly Trend ===
      const now = new Date();
      const monthsCnt = timeRange === '3m' ? 3 : timeRange === '1y' ? 12 : 6;
      const monthlyMap = {};
      for (let i = monthsCnt - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthlyMap[key] = { name: MONTHS[d.getMonth()], submissions: 0, approved: 0 };
      }
      all.forEach(p => {
        const d = new Date(p.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (monthlyMap[key]) {
          monthlyMap[key].submissions++;
          if (p.status === 'approved') monthlyMap[key].approved++;
        }
      });
      setMonthlyData(Object.values(monthlyMap));

      // === Recent Activity ===
      setRecentActivity(all.slice(0, 8).map(p => ({
        id: p.id,
        title: p.title,
        group: p.groups?.name || 'Unknown',
        status: p.status,
        dept: (p.department || '').toUpperCase(),
        time: new Date(p.created_at).toLocaleDateString()
      })));

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Analytics fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (authorized) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, authorized]);

  const handlePieClick = (data) => {
    setActiveDept(activeDept === data.name ? null : data.name);
  };

  const filteredActivity = activeDept
    ? recentActivity.filter(a => a.dept === activeDept)
    : recentActivity;

  // Access denied screen
  if (authorized === false) {
    return (
      <div className="analytics-page container animate-fade-in">
        <div className="access-denied-container">
          <div className="access-denied-card glass-panel">
            <ShieldOff size={56} className="access-denied-icon" />
            <h2>Access Denied</h2>
            <p>The Analytics dashboard is restricted to <strong>Faculty</strong> and <strong>Admin</strong> users only.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Still checking auth
  if (authorized === null || loading) {
    return (
      <div className="analytics-page container animate-fade-in flex justify-center items-center min-h-[70vh]">
        <RefreshCw size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="analytics-page container animate-fade-in">

      <div className="analytics-header">
        <div>
          <h1>Platform Analytics</h1>
          <p>Real-time statistics and insights from your project database.</p>
        </div>
        <div className="analytics-controls">
          <span className="refresh-time">Updated {lastRefresh.toLocaleTimeString()}</span>
          <button className="btn-outline refresh-btn" onClick={fetchAnalytics}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard icon={FileText} label="Total Projects" value={stats.total} trend={12} trendLabel="this month" colorClass="bg-primary-light" />
        <StatCard icon={CheckCircle} label="Approved" value={stats.approved} trend={8} trendLabel="this month" colorClass="bg-success-light" />
        <StatCard icon={Clock} label="Pending Review" value={stats.pending} colorClass="bg-warning-light" />
        <StatCard icon={XCircle} label="Rejected" value={stats.rejected} colorClass="bg-danger-light" />
      </div>

      {/* Charts */}
      <div className="charts-grid">

        {/* Area Chart */}
        <div className="chart-card glass-panel col-span-2">
          <div className="chart-header">
            <h3><TrendingUp size={18} className="mr-2 inline" /> Submission Trends</h3>
            <div className="time-range-toggle">
              {[{k:'3m',l:'3 Mo'},{k:'6m',l:'6 Mo'},{k:'1y',l:'1 Year'}].map(({k,l}) => (
                <button
                  key={k}
                  className={`range-btn ${timeRange === k ? 'active' : ''}`}
                  onClick={() => setTimeRange(k)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(70,69,85,0.3)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#918fa1', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#918fa1', fontSize: 12 }} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="submissions" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSub)" name="Submissions" />
                <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorApp)" name="Approved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="chart-card glass-panel">
          <div className="chart-header">
            <h3>By Department</h3>
            {activeDept && (
              <button className="btn-outline clear-filter-btn" onClick={() => setActiveDept(null)}>
                Clear filter
              </button>
            )}
          </div>
          <div className="chart-container pie-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: '#918fa1', strokeWidth: 1 }}
                  onClick={handlePieClick}
                  style={{ cursor: 'pointer' }}
                >
                  {deptData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      opacity={activeDept && activeDept !== entry.name ? 0.3 : 1}
                      stroke={activeDept === entry.name ? entry.fill : 'transparent'}
                      strokeWidth={activeDept === entry.name ? 3 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#29283a', border: '1px solid rgba(70,69,85,0.4)', borderRadius: '8px', color: '#e3e0f8' }}
                  itemStyle={{ color: '#c7c4d8' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            {deptData.map(dept => (
              <button
                key={dept.name}
                className={`legend-btn ${activeDept === dept.name ? 'active' : ''}`}
                onClick={() => handlePieClick(dept)}
              >
                <span className="legend-color" style={{ backgroundColor: dept.fill }} />
                <span className="legend-label">{dept.name}</span>
                <span className="legend-value">{dept.value}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Activity Feed */}
      <div className="activity-panel glass-panel">
        <div className="activity-header">
          <h3><Activity size={18} className="mr-2 inline" /> Recent Activity</h3>
          {activeDept && <span className="filter-badge">Filtered: {activeDept}</span>}
        </div>
        <div className="activity-list">
          {filteredActivity.length === 0 ? (
            <p className="text-muted text-center p-4">No activity to display.</p>
          ) : (
            filteredActivity.map(item => (
              <div key={item.id} className="activity-item">
                <span className={`activity-dot ${item.status}`} />
                <div className="activity-text">
                  <strong>{item.title}</strong>
                  <span> by {item.group} • {item.dept}</span>
                </div>
                <span className={`status-badge ${item.status}`}>{item.status.toUpperCase()}</span>
                <span className="activity-time">{item.time}</span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
