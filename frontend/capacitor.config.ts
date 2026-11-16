import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shareship.app',
  appName: 'Shareship',
  webDir: 'dist/frontend/browser',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SSLPinning: {
      enabled: true,
      certs: ['onrender.com.pem'],
      domains: [
        {
          name: 'shareship.onrender.com',
          includeSubdomains: true,
          hashes: [
            'SHA256/8emdl/UmneUm0I4Y/vHzOTQzb9eJwG4voRHtNmBPk=', // onrender.com.pem (User Provided)
            'SHA256/hxqRlPTuQrgcxIRSDioywQ+52TqqLF8nLRGOqqTt50Y=', // Google Trust Services GTS Root R1
            'SHA256/Vfd95BwDeSQo+NUYxVEEWYr8mx3Xph6Anq+ElAZ2Hnw=', // Google Trust Services GTS Root R2
            'SHA256/kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=', // Cloudflare Inc ECC CA-3
            'SHA256/C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=', // Let's Encrypt ISRG Root X1
          ],
        },
        {
          name: 'onrender.com',
          includeSubdomains: true,
          hashes: [
            'SHA256/8emdl/UmneUm0I4Y/vHzOTQzb9eJwG4voRHtNmBPk=', // onrender.com.pem (User Provided)
            'SHA256/hxqRlPTuQrgcxIRSDioywQ+52TqqLF8nLRGOqqTt50Y=',
            'SHA256/kIdp6NNEd8wsugYyyIYFsi1ylMCED3hZbSR8ZFsa/A4=',
            'SHA256/C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=',
          ],
        },
      ],
    },
  },
};

export default config;
