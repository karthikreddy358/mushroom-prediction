import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState('Home')
  const [dragActive, setDragActive] = useState(false)

  const navItems = ['Home', 'AI Image Analysis', 'Analytics Dashboard']

  const scrollToSection = (section) => {
    setActiveNav(section)
    let sectionId = ''
    if (section === 'Home') {
      sectionId = 'home'
    } else if (section === 'AI Image Analysis') {
      sectionId = 'analysis'
    } else if (section === 'Analytics Dashboard') {
      sectionId = 'analytics'
    }
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      const token = authAPI.getToken()
      if (!token) {
        navigate('/login')
        return
      }

      try {
        const userData = await authAPI.getMe(token)
        setUser(userData)
      } catch (err) {
        authAPI.removeToken()
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  const handleLogout = () => {
    authAPI.removeToken()
    navigate('/login')
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    // Handle file upload here
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-container">
          <div className="header-left">
            <Link to="/" className="logo">
              <span className="logo-icon">🍄</span>
              <span className="logo-text">Smart Mushroom AI</span>
            </Link>
          </div>
          <nav className="dashboard-nav">
            {navItems.map((item) => (
              <button
                key={item}
                className={`nav-item ${activeNav === item ? 'active' : ''}`}
                onClick={() => scrollToSection(item)}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="header-right">
            <div className="user-icon" onClick={handleLogout} title="Logout">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
        </div>
      </header>

      {/* Home Section */}
      <section id="home" className="dashboard-hero">
        <div className="hero-content">
          <h1>AI-powered mushroom<br />growth monitoring</h1>
          <p>Maximize your yield with real-time oyster mushroom monitoring platform using high-precision computer vision and IoT analytics.</p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => scrollToSection('AI Image Analysis')}>Start Analysis</button>
            <button className="btn-outline">View Demo</button>
          </div>
        </div>
      </section>

      {/* AI Image Analysis Section */}
      <section id="analysis" className="analysis-section">
        <div className="analysis-container">
          <h3>AI Image Analysis</h3>
          <div className="analysis-preview">
            <div className="preview-image">
              <img src="https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=400&h=300&fit=crop" alt="Mushroom" />
              <span className="harvest-badge">HARVEST READY</span>
              <span className="confidence-badge">Confidence: 98.5%</span>
            </div>
          </div>
          <div 
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <span className="drop-icon">☁️</span>
            <p className="drop-text">Drag & drop image to analyze</p>
            <p className="drop-hint">Support for JPG, PNG (Max 10MB)</p>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section id="analytics" className="analytics-section">
        <div className="analytics-container">
          <h2>Analytics Dashboard</h2>
          <p className="analytics-subtitle">View your mushroom analysis history and insights</p>
          
          <div className="analytics-stats">
            <div className="analytics-stat-card">
              <span className="analytics-stat-value">24</span>
              <span className="analytics-stat-label">Total Analyses</span>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-value">92%</span>
              <span className="analytics-stat-label">Accuracy Rate</span>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-value">18</span>
              <span className="analytics-stat-label">Edible Found</span>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-value">6</span>
              <span className="analytics-stat-label">Poisonous Found</span>
            </div>
          </div>

          <div className="analytics-history">
            <h3>Recent Analyses</h3>
            <div className="history-list">
              <div className="history-item">
                <span className="history-date">Today, 2:30 PM</span>
                <span className="history-result edible">Edible - 98.5% confidence</span>
              </div>
              <div className="history-item">
                <span className="history-date">Today, 11:15 AM</span>
                <span className="history-result edible">Edible - 95.2% confidence</span>
              </div>
              <div className="history-item">
                <span className="history-date">Yesterday, 4:45 PM</span>
                <span className="history-result poisonous">Poisonous - 97.8% confidence</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© 2021 Smart Mushroom AI Monitoring Suite. Precision agriculture powered by Intelligence.</p>
      </footer>
    </div>
  )
}

export default Dashboard
