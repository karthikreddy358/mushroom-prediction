import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI, predictAPI } from '../services/api'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState('Home')
  const [dragActive, setDragActive] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)

  const navItems = ['Home', 'AI Image Analysis', 'Analytics Dashboard']

  const getHistoryStorageKey = (email) => `mushroom-history:${String(email || 'anonymous').trim().toLowerCase()}`

  const readCachedHistory = (email) => {
    try {
      const raw = localStorage.getItem(getHistoryStorageKey(email))
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  const writeCachedHistory = (email, records) => {
    try {
      localStorage.setItem(getHistoryStorageKey(email), JSON.stringify(records))
    } catch {
      // Ignore storage quota / private mode failures.
    }
  }

  const getHistorySignature = (item) =>
    [item?.id || '', item?.created_at || '', item?.image_url || '', item?.stage || '', String(item?.confidence || '')].join('|')

  const mergeHistoryRecords = (records = []) => {
    const seen = new Set()
    const merged = []

    for (const item of records) {
      if (!item) continue
      const signature = getHistorySignature(item)
      if (seen.has(signature)) continue
      seen.add(signature)
      merged.push(item)
    }

    return merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  }

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

  const loadHistory = async (token, email) => {
    setHistoryLoading(true)
    try {
      const records = await predictAPI.getHistory(token)
      
      // Trust server data completely when it succeeds. Cache is fallback only.
      setHistory(records)
      writeCachedHistory(email, records)
      return records
    } catch (err) {
      // Only use cache if server fails
      const cached = mergeHistoryRecords(readCachedHistory(email))
      setHistory(cached)
      if (cached.length === 0) {
        setAnalysisError(err.message)
      }
      return cached
    } finally {
      setHistoryLoading(false)
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
        await loadHistory(token, userData.email)
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

  const runAnalysis = async (file) => {
    const token = authAPI.getToken()
    if (!token) {
      navigate('/login')
      return
    }

    if (!file) {
      return
    }

    setAnalysisError('')
    setAnalysisLoading(true)

    try {
      const result = await predictAPI.analyzeImage(file, token)
      setAnalysisResult(result)

      const userEmail = user?.email
      const latestPrediction = result?.predictions?.[0]
      const latestHistoryItem = latestPrediction
        ? {
            id: `${result.image_url || 'analysis'}-${latestPrediction.stage || 'unknown'}-${Date.now()}`,
            created_at: new Date().toISOString(),
            image_url: result.image_url,
            stage: latestPrediction.stage,
            confidence: latestPrediction.confidence,
          }
        : null

      if (latestHistoryItem) {
        setHistory((prev) => {
          const merged = mergeHistoryRecords([latestHistoryItem, ...prev])
          writeCachedHistory(userEmail, merged)
          return merged
        })
      }

      await loadHistory(token, userEmail)

      scrollToSection('Analytics Dashboard')
    } catch (err) {
      setAnalysisError(err.message)
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files && e.dataTransfer.files[0]
    runAnalysis(file)
  }

  const handleFilePick = (e) => {
    const file = e.target.files && e.target.files[0]
    runAnalysis(file)
    e.target.value = ''
  }

  const normalizeStage = (stage) => String(stage || '').trim().toLowerCase()

  const isHarvestReadyStage = (stage) => {
    const value = normalizeStage(stage)
    return value === 'mature' || value === 'harvest ready' || value === 'harvest_ready'
  }

  const stats = useMemo(() => {
    const total = history.length
    const readyCount = history.filter((item) => isHarvestReadyStage(item.stage)).length
    const avgConfidence =
      total > 0
        ? Math.round((history.reduce((sum, item) => sum + Number(item.confidence || 0), 0) / total) * 100)
        : 0

    return {
      total,
      readyCount,
      notReadyCount: Math.max(total - readyCount, 0),
      avgConfidence,
    }
  }, [history])

  const formatHistoryDate = (rawDate) => {
    if (!rawDate) return 'Unknown date'
    const d = new Date(rawDate)
    return d.toLocaleString()
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
            <Link to="/environment" className="nav-item">
              Environment
            </Link>
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

      {/* Home Section */}
      <section id="home" className="dashboard-hero">
        <div className="hero-content">
          <h1>AI-powered mushroom<br />growth monitoring</h1>
          <p>Maximize your yield with real-time oyster mushroom monitoring platform using high-precision computer vision and IoT analytics.</p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => scrollToSection('AI Image Analysis')}>Start Analysis</button>
            <button className="btn-outline" onClick={() => scrollToSection('Analytics Dashboard')}>View Analytics</button>
          </div>
        </div>
      </section>

      {/* AI Image Analysis Section */}
      <section id="analysis" className="analysis-section">
        <div className="analysis-container">
          <h3>AI Image Analysis</h3>

          <div className="analysis-preview">
            {analysisResult?.image_url ? (
              <div className="preview-image">
                <img src={analysisResult.image_url} alt="Latest analyzed mushroom" />
                {analysisResult.predictions?.[0] && (
                  <>
                    <span className="harvest-badge">{String(analysisResult.predictions[0].stage || '').toUpperCase()}</span>
                    <span className="confidence-badge">
                      Confidence: {Math.round(Number(analysisResult.predictions[0].confidence || 0) * 100)}%
                    </span>
                  </>
                )}
              </div>
            ) : (
              <p className="empty-preview">Upload an image to see prediction results here.</p>
            )}
          </div>

          <div 
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <span className="drop-icon">☁️</span>
            <p className="drop-text">Drag and drop image to analyze</p>
            <p className="drop-hint">Support for JPG, PNG (Max 10MB)</p>
            <button className="upload-btn" type="button" onClick={() => fileInputRef.current?.click()} disabled={analysisLoading}>
              {analysisLoading ? 'Analyzing...' : 'Choose Image'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFilePick} />
          </div>

          {analysisError && <p className="analysis-error">{analysisError}</p>}
        </div>
      </section>

      {/* Analytics Section */}
      <section id="analytics" className="analytics-section">
        <div className="analytics-container">
          <h2>Analytics Dashboard</h2>
          <p className="analytics-subtitle">View your mushroom analysis history and insights</p>
          
          <div className="analytics-stats">
            <div className="analytics-stat-card">
              <span className="analytics-stat-value">{stats.total}</span>
              <span className="analytics-stat-label">Total Analyses</span>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-value">{stats.avgConfidence}%</span>
              <span className="analytics-stat-label">Avg Confidence</span>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-value">{stats.readyCount}</span>
              <span className="analytics-stat-label">Harvest Ready</span>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-value">{stats.notReadyCount}</span>
              <span className="analytics-stat-label">Needs Growth</span>
            </div>
          </div>

          <div className="analytics-history">
            <h3>Recent Analyses</h3>
            {historyLoading ? (
              <p className="history-empty">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="history-empty">No analyses yet. Upload a mushroom image to get started.</p>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div className="history-item" key={`${item.id || item.created_at}-${item.image_url || item.stage}`}>
                    <span className="history-date">{formatHistoryDate(item.created_at)}</span>
                    <span
                      className={`history-result ${isHarvestReadyStage(item.stage) ? 'edible' : 'poisonous'}`}
                    >
                      {item.stage || 'Unknown stage'} - {Math.round(Number(item.confidence || 0) * 100)}% confidence
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© 2026 Smart Mushroom AI Monitoring Suite. Precision agriculture powered by Intelligence.</p>
      </footer>
    </div>
  )
}

export default Dashboard
