// Suki Web API Configuration
// Uses relative URLs so the API calls go to the same server hosting this page
// This works regardless of IP address or network

class SukiApiConfig {
  constructor() {
    // Backend URL - will be auto-detected or set manually
    this.backendUrl = '';
    this.isInitialized = false;
  }

  /**
   * Initialize API configuration
   * Auto-detects the backend URL based on hosting environment
   */
  async init() {
    // Check for custom backend URL in localStorage (for advanced users)
    const customUrl = localStorage.getItem('suki_backend_url');
    if (customUrl) {
      this.backendUrl = customUrl;
      console.log('[Suki API Config] Using custom backend URL:', this.backendUrl);
    } else {
      // PRODUCTION: Set your Render backend URL here after deployment
      // Replace 'pos-backend' with your actual Render service name
      const PRODUCTION_BACKEND = 'https://pos-backend-l6vg.onrender.com';
      
      const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalhost || currentPort === '8000') {
        // Local development - use same server or port 8000
        if (currentPort === '8000') {
          this.backendUrl = '';
        } else {
          this.backendUrl = `${window.location.protocol}//${window.location.hostname}:8000`;
        }
        console.log('[Suki API Config] Local development mode:', this.backendUrl || 'relative');
      } else {
        // Production - use Render backend
        this.backendUrl = PRODUCTION_BACKEND;
        console.log('[Suki API Config] Production mode, using:', this.backendUrl);
      }
    }
    this.isInitialized = true;
    return this;
  }

  /**
   * Get the full API URL for an endpoint
   * @param {string} endpoint - The API endpoint (e.g., '/api/suki_points')
   * @returns {string} Full URL
   */
  getUrl(endpoint) {
    return this.backendUrl + endpoint;
  }

  /**
   * Set a custom backend URL (persists in localStorage)
   * @param {string} url - The backend URL (e.g., 'http://192.168.1.100:8000')
   */
  setCustomUrl(url) {
    if (url) {
      localStorage.setItem('suki_backend_url', url);
      this.backendUrl = url;
    } else {
      localStorage.removeItem('suki_backend_url');
      this.backendUrl = '';
    }
  }
}

// Global instance
const sukiApiConfig = new SukiApiConfig();

// Auto-initialize
sukiApiConfig.init();
