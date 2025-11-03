// Google OAuth Utility
declare global {
  interface Window {
    google?: any;
  }
}

export const initGoogleAuth = (clientId: string, callback: (credential: string) => void) => {
  if (!window.google) {
    console.error('Google Identity Services script not loaded');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: any) => {
      if (response.credential) {
        callback(response.credential);
      }
    },
  });
};

export const promptGoogleSignIn = () => {
  if (!window.google) {
    console.error('Google Identity Services not initialized');
    return;
  }

  window.google.accounts.id.prompt((notification: any) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // Fallback: use popup
      window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.VITE_GOOGLE_CLIENT_ID || '',
        scope: 'email profile',
        callback: (response: any) => {
          if (response.access_token) {
            // Handle token response
            fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`)
              .then(res => res.json())
              .then(data => {
                console.log('Google user:', data);
              });
          }
        },
      }).requestAccessToken();
    }
  });
};

export const renderGoogleButton = (elementId: string, clientId: string, callback: (credential: string) => void) => {
  if (!window.google) {
    console.error('Google Identity Services script not loaded');
    return;
  }

  initGoogleAuth(clientId, callback);

  window.google.accounts.id.renderButton(
    document.getElementById(elementId),
    {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      width: '100%',
    }
  );
};

