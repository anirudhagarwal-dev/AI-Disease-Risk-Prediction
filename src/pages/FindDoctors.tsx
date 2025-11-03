import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, Navigation, Search, Filter, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGoogleMapsScript } from '../hooks/useGoogleMapsScript';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';

interface Doctor {
  id: string;
  name: string;
  address: string;
  phone?: string;
  rating?: number;
  lat: number;
  lng: number;
}

const FindDoctors = () => {
  const { language } = useLanguage();
  const { isLoaded: isMapsLoaded, loadError } = useGoogleMapsScript();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(5000);
  const [specialization, setSpecialization] = useState('doctor');
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const specializations = [
    { value: 'doctor', labelKey: 'doctors.allDoctors' },
    { value: 'hospital', labelKey: 'doctors.hospitals' },
    { value: 'clinic', labelKey: 'doctors.clinics' },
    { value: 'pharmacy', labelKey: 'doctors.pharmacies' },
  ];

  const radiusOptions = [
    { value: 2000, label: '2 km' },
    { value: 5000, label: '5 km' },
    { value: 10000, label: '10 km' },
    { value: 20000, label: '20 km' },
  ];

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation && isMapsLoaded && window.google) {
      initializeMap();
    }
  }, [userLocation, isMapsLoaded]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Got location:', position.coords.latitude, position.coords.longitude);
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to AKGEC Ghaziabad location
          setUserLocation({ lat: 28.6756, lng: 77.5024 });
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      // Fallback to AKGEC Ghaziabad location
      setUserLocation({ lat: 28.6756, lng: 77.5024 });
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !userLocation) return;

    const map = new google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 14,
      styles: [
        {
          featureType: 'poi.medical',
          elementType: 'geometry',
          stylers: [{ color: '#fce8e8' }],
        },
      ],
    });

    googleMapRef.current = map;

    new google.maps.Marker({
      position: userLocation,
      map: map,
      title: 'Your Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4F46E5',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    searchNearbyDoctors();
  };

  const searchNearbyDoctors = () => {
    if (!googleMapRef.current || !userLocation) return;

    setIsLoading(true);
    clearMarkers();

    // Use client-side PlacesService so it works with HTTP referrer–restricted keys
    const service = new google.maps.places.PlacesService(googleMapRef.current);

    // Map UI selection to Places request
    const request: google.maps.places.PlaceSearchRequest = {
      location: userLocation,
      radius: searchRadius,
      // type must be a valid Places type; add keyword for narrower queries
      type: (['doctor','hospital','pharmacy'].includes(specialization) ? specialization as any : undefined),
      keyword: specialization === 'clinic' ? 'clinic' : undefined,
    };

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const list: Doctor[] = results.slice(0, 20).map((place) => ({
          id: place.place_id || '',
          name: place.name || '',
          address: (place.vicinity as string) || '',
          rating: place.rating,
          lat: place.geometry?.location?.lat() || 0,
          lng: place.geometry?.location?.lng() || 0,
        }));
        setDoctors(list);
        addMarkers(list);
      } else {
        console.warn('Nearby search status:', status);
        setDoctors([]);
      }
      setIsLoading(false);
    });
  };

  const addMarkers = (doctorList: Doctor[]) => {
    if (!googleMapRef.current) return;

    doctorList.forEach((doctor) => {
      const marker = new google.maps.Marker({
        position: { lat: doctor.lat, lng: doctor.lng },
        map: googleMapRef.current!,
        title: doctor.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        setSelectedDoctor(doctor);
        googleMapRef.current?.panTo({ lat: doctor.lat, lng: doctor.lng });
      });

      markersRef.current.push(marker);
    });
  };

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    googleMapRef.current?.panTo({ lat: doctor.lat, lng: doctor.lng });
    googleMapRef.current?.setZoom(16);
  };

  const getDirections = (doctor: Doctor) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation?.lat},${userLocation?.lng}&destination=${doctor.lat},${doctor.lng}`;
    window.open(url, '_blank');
  };

  const callDoctor = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Maps</h2>
          <p className="text-gray-600">Please check your Google Maps API key configuration.</p>
        </div>
      </div>
    );
  }

  if (!isMapsLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {getTranslation(language, 'doctors.title')}
            </h1>
            <p className="text-xl text-gray-600">
              {getTranslation(language, 'doctors.subtitle')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="inline h-4 w-4 mr-1" />
                  {getTranslation(language, 'doctors.specialization')}
                </label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {specializations.map((spec) => (
                    <option key={spec.value} value={spec.value}>
                      {getTranslation(language, spec.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Navigation className="inline h-4 w-4 mr-1" />
                  {getTranslation(language, 'doctors.searchRadius')}
                </label>
                <select
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {radiusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={searchNearbyDoctors}
                  disabled={isLoading}
                  className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isLoading ? getTranslation(language, 'doctors.searching') : getTranslation(language, 'common.search')}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div
                  ref={mapRef}
                  className="w-full h-[600px]"
                  style={{ minHeight: '600px' }}
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 max-h-[600px] overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {getTranslation(language, 'doctors.nearbyLocations')} ({doctors.length})
                </h2>

                {doctors.length === 0 && !isLoading && (
                  <p className="text-gray-500 text-center py-8">
                    {getTranslation(language, 'doctors.noResults')}
                  </p>
                )}

                <div className="space-y-4">
                  {doctors.map((doctor) => (
                    <motion.div
                      key={doctor.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedDoctor?.id === doctor.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleDoctorSelect(doctor)}
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {doctor.name}
                      </h3>

                        <div className="flex items-start text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                        <span><strong>{getTranslation(language, 'doctors.address')}:</strong> {doctor.address}</span>
                      </div>

                      {doctor.rating && (
                        <div className="text-sm text-gray-600 mb-3">
                          {getTranslation(language, 'doctors.rating')}: {doctor.rating} ⭐
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            getDirections(doctor);
                          }}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          {getTranslation(language, 'doctors.getDirections')}
                        </button>

                        {doctor.phone && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              callDoctor(doctor.phone!);
                            }}
                            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center justify-center"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            {getTranslation(language, 'doctors.call')}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FindDoctors;
