import { useState, useEffect } from 'react'
import './App.css'

interface SensorData {
  temperature: number;
  moisture: number;
  oxygenLevel: number;
  phLevel: number;
  lastUpdated: string;
}

interface CompostLog {
  id: number;
  timestamp: string;
  event: string;
  details: string;
}

function App() {
  // State
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 58,
    moisture: 62,
    oxygenLevel: 75,
    phLevel: 6.8,
    lastUpdated: new Date().toISOString()
  });
  const [systemStatus, setSystemStatus] = useState<'active' | 'paused' | 'maintenance'>('active');
  const [autoMode, setAutoMode] = useState<boolean>(true);
  const [mixerActive, setMixerActive] = useState<boolean>(false);
  const [aerationActive, setAerationActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'settings'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [logs, setLogs] = useState<CompostLog[]>([
    { id: 1, timestamp: '2025-04-06T09:15:00', event: 'Temperature Alert', details: 'Temperature exceeded optimal range (62°C).' },
    { id: 2, timestamp: '2025-04-06T08:30:00', event: 'Mixing Cycle', details: 'Automatic mixing cycle completed.' },
    { id: 3, timestamp: '2025-04-06T06:45:00', event: 'Moisture Adjustment', details: 'Added water to increase moisture to 60%.' }
  ]);
  
  // Helper functions
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  
  const getStatusColor = (value: number, type: 'temperature' | 'moisture' | 'oxygen' | 'ph'): string => {
    switch(type) {
      case 'temperature': return value < 45 ? 'low' : value > 55 ? 'high' : 'optimal';
      case 'moisture': return value < 50 ? 'low' : value > 70 ? 'high' : 'optimal';
      case 'oxygen': return value < 60 ? 'low' : value > 85 ? 'high' : 'optimal';
      case 'ph': return value < 6 ? 'low' : value > 7.5 ? 'high' : 'optimal';
      default: return 'optimal';
    }
  };
  
  const calculateProgress = (value: number, min: number, max: number): number => {
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  };
  
  // Effects
  useEffect(() => {
    if (systemStatus !== 'active') return;
    
    const interval = setInterval(() => {
      setSensorData(prev => ({
        temperature: Math.max(40, Math.min(65, prev.temperature + (Math.random() * 2 - 1))),
        moisture: Math.max(45, Math.min(75, prev.moisture + (Math.random() * 2 - 1))),
        oxygenLevel: Math.max(55, Math.min(90, prev.oxygenLevel + (Math.random() * 3 - 1.5))),
        phLevel: Math.max(5.5, Math.min(8, prev.phLevel + (Math.random() * 0.2 - 0.1))),
        lastUpdated: new Date().toISOString()
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [systemStatus]);
  
  useEffect(() => {
    if (!autoMode) return;
    
    // Auto controls for mixer and aeration based on sensor readings
    if (sensorData.moisture > 68 && !mixerActive) {
      setMixerActive(true);
      setTimeout(() => setMixerActive(false), 8000);
      addLog('Auto Mixing', `Activated mixer due to high moisture (${sensorData.moisture.toFixed(1)}%)`);
    }
    
    if (sensorData.oxygenLevel < 65 && !aerationActive) {
      setAerationActive(true);
      setTimeout(() => setAerationActive(false), 10000);
      addLog('Auto Aeration', `Activated aeration due to low oxygen (${sensorData.oxygenLevel.toFixed(1)}%)`);
    }
  }, [sensorData, autoMode, mixerActive, aerationActive]);
  
  // Action functions
  const addLog = (event: string, details: string) => {
    const newLog = {
      id: logs.length + 1,
      timestamp: new Date().toISOString(),
      event,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };
  
  const toggleMixer = () => {
    if (autoMode) return;
    setMixerActive(!mixerActive);
    if (!mixerActive) {
      addLog('Manual Mixing', 'Mixer manually activated by user.');
    }
  };
  
  const toggleAeration = () => {
    if (autoMode) return;
    setAerationActive(!aerationActive);
    if (!aerationActive) {
      addLog('Manual Aeration', 'Aeration system manually activated by user.');
    }
  };

  // UI Components
  const renderSensorGauge = (type: 'temperature' | 'moisture' | 'oxygen' | 'ph', value: number, min: number, max: number, unit: string) => {
    const status = getStatusColor(value, type);
    const progress = calculateProgress(value, min, max);
    
    return (
      <div className={`sensor-card ${type}`}>
        <div className={`card-content ${status}`}>
          <div className="sensor-header">
            <div className="sensor-icon"></div>
            <div className="sensor-title">
              <h3>{type.charAt(0).toUpperCase() + type.slice(1)}{type === 'ph' ? ' Level' : type === 'oxygen' ? ' Level' : ''}</h3>
              <div className={`status-badge ${status}`}>
                {status === 'optimal' ? 'Optimal' : status === 'high' ? 'High' : 'Low'}
              </div>
            </div>
          </div>
          
          <div className="gauge-container">
            <div className="gauge">
              <svg viewBox="0 0 120 120" className="gauge-svg">
                <circle className="gauge-bg" cx="60" cy="60" r="54" fill="none" strokeWidth="12"/>
                <circle 
                  className="gauge-fill" 
                  cx="60" cy="60" r="54" fill="none" strokeWidth="12"
                  strokeDasharray="339.292"
                  strokeDashoffset={339.292 - (339.292 * progress / 100)}
                />
                <text className="gauge-text" x="60" y="60" textAnchor="middle" dy="7">
                  {value.toFixed(1)}{unit}
                </text>
              </svg>
              <div className="gauge-min-max">
                <span>{min}{unit}</span>
                <span>{max}{unit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="smart-composter-app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">SC</div>
            {!sidebarCollapsed && <h1>Smart Composter</h1>}
          </div>
          <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
        
        <nav className="main-nav">
          {['dashboard', 'logs', 'settings'].map((tab) => (
            <button 
              key={tab}
              className={activeTab === tab ? 'active' : ''} 
              onClick={() => setActiveTab(tab as any)}
            >
              <svg className="nav-icon" viewBox="0 0 24 24">
                {tab === 'dashboard' && <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />}
                {tab === 'logs' && <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />}
                {tab === 'settings' && <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />}
              </svg>
              {!sidebarCollapsed && <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>}
            </button>
          ))}
        </nav>
        
        {!sidebarCollapsed && (
          <div className="system-status">
            <h3>System Status</h3>
            <div className={`status-pill ${systemStatus}`}>
              <span className="status-dot"></span>
              <span className="status-text">
                {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
              </span>
            </div>
            <div className="control-mode">
              <span>Control Mode:</span>
              <span className="mode">{autoMode ? 'Automatic' : 'Manual'}</span>
            </div>
          </div>
        )}
      </aside>
      
      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <header className="app-header">
          <div className="header-content">
            <h2 className="page-title">
              {activeTab === 'dashboard' ? 'System Dashboard' : 
               activeTab === 'logs' ? 'Activity Logs' : 'System Settings'}
            </h2>
            
            <div className="header-actions">
              <div className="last-updated">
                <svg className="sync-icon" viewBox="0 0 24 24">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                </svg>
                <span>{formatDate(sensorData.lastUpdated)}</span>
              </div>
            </div>
          </div>
        </header>
        
        <div className="content-wrapper">
          {activeTab === 'dashboard' && (
            <div className="dashboard">
              {/* Sensor gauges */}
              <section className="sensor-overview">
                {renderSensorGauge('temperature', sensorData.temperature, 40, 65, '°C')}
                {renderSensorGauge('moisture', sensorData.moisture, 45, 75, '%')}
                {renderSensorGauge('oxygen', sensorData.oxygenLevel, 55, 90, '%')}
                {renderSensorGauge('ph', sensorData.phLevel, 5.5, 8, '')}
              </section>
              
              {/* Control panel and logs */}
              <div className="dashboard-grid">
                <section className="control-panel">
                  <div className="panel-header">
                    <h3>System Control</h3>
                    <div className="control-toggle">
                      <button className={autoMode ? 'active' : ''} onClick={() => setAutoMode(true)}>Auto</button>
                      <button className={!autoMode ? 'active' : ''} onClick={() => setAutoMode(false)}>Manual</button>
                    </div>
                  </div>
                  
                  <div className="panel-body">
                    <div className="control-group">
                      <div className="control-label">System Power</div>
                      <div className="toggle-buttons">
                        {['active', 'paused', 'maintenance'].map((status) => (
                          <button 
                            key={status}
                            className={systemStatus === status ? 'active' : ''} 
                            onClick={() => setSystemStatus(status as any)}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="control-actions">
                      <button 
                        className={`action-button ${mixerActive ? 'active' : ''} ${autoMode ? 'disabled' : ''}`}
                        disabled={autoMode}
                        onClick={toggleMixer}
                      >
                        <div className="action-icon mixer"></div>
                        <div className="action-label">
                          <span>Mixer</span>
                          <span className="status">{mixerActive ? 'Running' : 'Idle'}</span>
                        </div>
                      </button>
                      
                      <button 
                        className={`action-button ${aerationActive ? 'active' : ''} ${autoMode ? 'disabled' : ''}`}
                        disabled={autoMode}
                        onClick={toggleAeration}
                      >
                        <div className="action-icon aeration"></div>
                        <div className="action-label">
                          <span>Aeration</span>
                          <span className="status">{aerationActive ? 'Running' : 'Idle'}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </section>
                
                <section className="recent-activity">
                  <div className="section-header">
                    <h3>Recent Activity</h3>
                    <button className="view-all" onClick={() => setActiveTab('logs')}>View All</button>
                  </div>
                  
                  <div className="activity-list">
                    {logs.slice(0, 3).map(log => (
                      <div key={log.id} className="activity-item">
                        <div className="activity-time">{formatDate(log.timestamp)}</div>
                        <div className="activity-event">{log.event}</div>
                        <div className="activity-description">{log.details}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}
          
          {activeTab === 'logs' && (
            <div className="logs-view">
              <div className="logs-toolbar">
                <div className="search-container">
                  <svg className="search-icon" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                  <input type="text" placeholder="Search logs..." />
                </div>
              </div>
              
              <div className="logs-list">
                {logs.map(log => (
                  <div key={log.id} className="log-item">
                    <div className="log-header">
                      <div className="log-info">
                        <span className="log-event">{log.event}</span>
                        <span className="log-time">{formatDate(log.timestamp)}</span>
                      </div>
                    </div>
                    <div className="log-details">{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="settings-view">
              <div className="settings-grid">
                {['temperature', 'moisture', 'oxygen', 'system'].map(settingType => (
                  <div key={settingType} className="settings-card">
                    <div className="card-header">
                      <h3>{settingType.charAt(0).toUpperCase() + settingType.slice(1)} Settings</h3>
                    </div>
                    <div className="setting-group">
                      {settingType !== 'system' ? (
                        <>
                          <div className="setting-row">
                            <label>Minimum {settingType}</label>
                            <div className="setting-control">
                              <input type="number" defaultValue={settingType === 'temperature' ? '45' : '50'} />
                              <span className="unit">{settingType === 'temperature' ? '°C' : '%'}</span>
                            </div>
                          </div>
                          <div className="setting-row">
                            <label>Maximum {settingType}</label>
                            <div className="setting-control">
                              <input type="number" defaultValue={settingType === 'temperature' ? '60' : '70'} />
                              <span className="unit">{settingType === 'temperature' ? '°C' : '%'}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="setting-row">
                            <label>Data Logging Interval</label>
                            <div className="setting-control">
                              <input type="number" defaultValue="5" />
                              <span className="unit">min</span>
                            </div>
                          </div>
                          <div className="setting-row">
                            <label>Remote Access</label>
                            <div className="setting-control">
                              <label className="toggle">
                                <input type="checkbox" defaultChecked />
                                <span className="toggle-slider"></span>
                              </label>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="settings-actions">
                <button className="btn-secondary">Reset</button>
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App