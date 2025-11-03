import { useEffect, useState } from 'react';

export const useGoogleMapsScript = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window.google !== 'undefined' && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setLoadError(new Error('Google Maps API key is not configured'));
      return;
    }

    const scriptId = 'google-maps-script';

    if (document.getElementById(scriptId)) {
      const checkIfLoaded = setInterval(() => {
        if (typeof window.google !== 'undefined' && window.google.maps) {
          setIsLoaded(true);
          clearInterval(checkIfLoaded);
        }
      }, 100);

      return () => clearInterval(checkIfLoaded);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setLoadError(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return { isLoaded, loadError };
};
