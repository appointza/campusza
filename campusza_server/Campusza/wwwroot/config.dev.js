// Development Configuration - used when building with --mode development
window.APP_CONFIG = {
  // API Configuration - Development Server
  baseurl: 'http://localhost:8080',
  templateBaseUrl: 'http://localhost:8080/template',
  
  // Environment
  production: false,
  debugMode: true,
  
  // Google Maps
  googleMapsApiKey: 'AIzaSyCpgFKWRzhotWFPW5smIfAAXxPGGHQMsHQ',
  
  // Razorpay Configuration - Test Mode for Development
  razorpayKeyId: 'rzp_test_xxxxxxxxxxxxx',
  razorpayKeySecret: 'xxxxxxxxxxxxxxxxxxxxx',
  razorpayTestMode: true,
  
  // App Information
  appTitle: 'Appointza (Dev)',
  version: '1.0.0-dev',
  
  // Feature Flags
  features: {
    enableDebugLogs: true,
    enableAnalytics: false,
    enableErrorReporting: false
  }
};

