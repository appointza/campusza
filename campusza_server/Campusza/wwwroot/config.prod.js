// Production Configuration - used when building for production
window.APP_CONFIG = {
  // API Configuration - Production Server
  baseurl: 'https://appointza.com',
  templateBaseUrl: 'https://appointza.com/template',
  
  // Environment
  production: true,
  debugMode: false,
  
  // Google Maps
  googleMapsApiKey: 'AIzaSyCpgFKWRzhotWFPW5smIfAAXxPGGHQMsHQ',
  
  // Razorpay Configuration - Live Mode for Production
  razorpayKeyId: 'rzp_live_RCRKKPVDZ3tLDv',
  razorpayKeySecret: 'cLvDMGMb9AWeggkxTbs5qZms',
  razorpayTestMode: false,
  
  // App Information
  appTitle: 'Appointza',
  version: '1.0.0',
  
  // Feature Flags
  features: {
    enableDebugLogs: false,
    enableAnalytics: true,
    enableErrorReporting: true
  }
};

