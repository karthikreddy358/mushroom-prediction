const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`

export const authAPI = {
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.detail || 'Login failed')
    }

    return response.json()
  },

  async register(email, password, fullName) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name: fullName,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || error.detail || 'Registration failed')
    }

    return response.json()
  },

  async getMe(token) {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    return response.json()
  },

  saveToken(token) {
    localStorage.setItem('access_token', token)
  },

  getToken() {
    return localStorage.getItem('access_token')
  },

  removeToken() {
    localStorage.removeItem('access_token')
  },

  isLoggedIn() {
    return !!this.getToken()
  }
}

export const predictAPI = {
  async analyzeImage(file, token) {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Image analysis failed')
    }

    return data
  },

  async getHistory(token) {
    const response = await fetch(`${API_URL}/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch analysis history')
    }

    return data.history || []
  },
}
