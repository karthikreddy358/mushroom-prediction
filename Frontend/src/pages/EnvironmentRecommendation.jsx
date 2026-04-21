import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import './EnvironmentRecommendation.css'

function EnvironmentRecommendation() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState('Medium')

  const stages = {
    Early: {
      badge: 'early',
      temp: { min: 18, max: 22, ideal: 20 },
      humidity: { min: 80, max: 95, ideal: 88 },
      message: 'Maintain high humidity and warm temperature for optimal early growth. Ensure proper air circulation and keep the substrate moist.',
      tips: [
        'Maintain consistent moisture levels on substrate',
        'Provide gentle air circulation 2-3 times daily',
        'Keep spawn running temperature steady'
      ]
    },
    Medium: {
      badge: 'medium',
      temp: { min: 16, max: 20, ideal: 18 },
      humidity: { min: 85, max: 95, ideal: 90 },
      message: 'Continue maintaining optimal humidity levels while slightly reducing temperature. Increase air exchange for healthy fruiting body development.',
      tips: [
        'Increase fresh air exchange frequency',
        'Monitor for contamination signs',
        'Prepare for pin formation stage'
      ]
    },
    Harvest: {
      badge: 'harvest',
      temp: { min: 14, max: 18, ideal: 16 },
      humidity: { min: 85, max: 92, ideal: 88 },
      message: 'Optimize conditions for mature mushroom development. Reduce misting frequency slightly to prevent bacterial issues while maintaining humidity.',
      tips: [
        'Begin harvesting when caps flatten',
        'Maintain high humidity to prevent cap cracks',
        'Prepare for second flush cycle'
      ]
    }
  }

  const currentStageData = stages[selectedStage]

  const getProgressPercentage = (current, min, max) => {
    if (current < min) return 0
    if (current > max) return 100
    return ((current - min) / (max - min)) * 100
  }

  const handleLogout = () => {
    authAPI.removeToken()
    navigate('/login')
  }

  const user = {
    email: authAPI.getToken() ? 'user@example.com' : 'Guest'
  }

  return (
    <div className="environment-page">
      {/* Header */}
      <header className="env-header">
        <div className="env-header-container">
          <div className="header-left">
            <Link to="/dashboard" className="logo">
              <span className="logo-icon">🍄</span>
              <span className="logo-text">Smart Mushroom AI</span>
            </Link>
          </div>
          <nav className="env-nav">
            <Link to="/dashboard" className="nav-item">Analytics Dashboard</Link>
            <a href="#environment" className="nav-item active">Environment</a>
          </nav>
          <div className="header-right">
            <button className="user-icon" onClick={() => setMenuOpen((prev) => !prev)} title="Profile" type="button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
            {menuOpen && (
              <div className="profile-menu">
                <p className="profile-title">Signed in as</p>
                <p className="profile-email">{user?.email || 'Unknown user'}</p>
                <button className="logout-btn" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="env-main">
        <div className="env-container">
          {/* Page Header */}
          <section className="page-header">
            <h1>Environment Recommendation</h1>
            <p className="subtitle">AI-based temperature and humidity suggestions for optimal mushroom growth</p>
            <span className="header-icon">🍄</span>
          </section>

          {/* Stage Selection */}
          <section className="stage-selector">
            <h2>Select Growth Stage</h2>
            <div className="stage-buttons">
              {Object.keys(stages).map((stage) => (
                <button
                  key={stage}
                  className={`stage-btn ${selectedStage === stage ? 'active' : ''}`}
                  onClick={() => setSelectedStage(stage)}
                >
                  {stage}
                </button>
              ))}
            </div>
          </section>

          {/* Content Grid */}
          <div className="content-grid">
            {/* Current Growth Stage Card */}
            <div className="card stage-card">
              <h3>Current Growth Stage</h3>
              <div className={`stage-badge ${currentStageData.badge}`}>
                {selectedStage}
              </div>
              <p className="stage-description">
                {selectedStage === 'Early' && 'Initial spawn colonization and mycelium development'}
                {selectedStage === 'Medium' && 'Pin formation and fruiting body initiation'}
                {selectedStage === 'Harvest' && 'Mature mushroom development and readiness'}
              </p>
            </div>

            {/* Recommended Conditions Card */}
            <div className="card conditions-card">
              <h3>Recommended Conditions</h3>
              
              <div className="condition-item">
                <div className="condition-header">
                  <span className="condition-icon">🌡️</span>
                  <span className="condition-name">Temperature</span>
                </div>
                <div className="condition-values">
                  <span className="ideal-value">{currentStageData.temp.ideal}°C</span>
                  <span className="range">({currentStageData.temp.min}°C - {currentStageData.temp.max}°C)</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '50%'}}></div>
                </div>
              </div>

              <div className="condition-item">
                <div className="condition-header">
                  <span className="condition-icon">💧</span>
                  <span className="condition-name">Humidity</span>
                </div>
                <div className="condition-values">
                  <span className="ideal-value">{currentStageData.humidity.ideal}%</span>
                  <span className="range">({currentStageData.humidity.min}% - {currentStageData.humidity.max}%)</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: '75%'}}></div>
                </div>
              </div>
            </div>

            {/* AI Recommendation Message Card */}
            <div className="card recommendation-card">
              <h3>AI Recommendation</h3>
              <div className="recommendation-box">
                <span className="rec-icon">💡</span>
                <p>{currentStageData.message}</p>
              </div>
            </div>

            {/* Visual Indicators Card */}
            <div className="card indicators-card">
              <h3>Condition Gauges</h3>
              
              <div className="gauge-item">
                <div className="gauge-label">
                  <span>Temperature</span>
                  <span className="gauge-value">20/22°C</span>
                </div>
                <div className="gauge-container">
                  <div className="gauge-bar">
                    <div className="gauge-fill temp-gauge" style={{width: '91%'}}></div>
                  </div>
                  <div className="gauge-range">
                    <span className="min">{currentStageData.temp.min}°C</span>
                    <span className="max">{currentStageData.temp.max}°C</span>
                  </div>
                </div>
              </div>

              <div className="gauge-item">
                <div className="gauge-label">
                  <span>Humidity</span>
                  <span className="gauge-value">88/95%</span>
                </div>
                <div className="gauge-container">
                  <div className="gauge-bar">
                    <div className="gauge-fill humidity-gauge" style={{width: '93%'}}></div>
                  </div>
                  <div className="gauge-range">
                    <span className="min">{currentStageData.humidity.min}%</span>
                    <span className="max">{currentStageData.humidity.max}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips for Farmers Card */}
            <div className="card tips-card">
              <h3>Tips for Farmers</h3>
              <ul className="tips-list">
                {currentStageData.tips.map((tip, idx) => (
                  <li key={idx}>
                    <span className="tip-bullet">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="env-footer">
        <p>© 2026 Smart Mushroom AI | Intelligent Agricultural System</p>
      </footer>
    </div>
  )
}

export default EnvironmentRecommendation
