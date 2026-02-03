import { useState, useEffect } from 'react';      
import '../styles/TripPrediction.css';      
      
function TripPrediction({ onBack }) {      
    const [loading, setLoading] = useState(false);      
    const [prediction, setPrediction] = useState(null);      
    const [locationLoading, setLocationLoading] = useState(false);      
    const [showCityInput, setShowCityInput] = useState(false);      
    const [citySuggestions, setCitySuggestions] = useState([]);      
    const [showInfoModal, setShowInfoModal] = useState(false);    
    const [showInfoTooltip, setShowInfoTooltip] = useState(null);      
    const [driveTime, setDriveTime] = useState(null);      
    const [showRecommendations, setShowRecommendations] = useState(false);      
    const [specialEvents, setSpecialEvents] = useState([]);      
    const [factorsLoading, setFactorsLoading] = useState(false);      
    const [formChanged, setFormChanged] = useState(false);  
    const [cameras, setCameras] = useState([]);  
    const [camerasLoading, setCamerasLoading] = useState(false);  
    const [showCameras, setShowCameras] = useState(false); // NEW: Add this state  
  
    const [formData, setFormData] = useState({      
        currentLocation: '',      
        locationCoords: null,      
        borderPass: 'bajakovo-batrovci',      
        departureTime: (() => {    
            const now = new Date();    
            const year = now.getFullYear();    
            const month = String(now.getMonth() + 1).padStart(2, '0');    
            const day = String(now.getDate()).padStart(2, '0');    
            const hours = String(now.getHours()).padStart(2, '0');    
            const minutes = String(now.getMinutes()).padStart(2, '0');    
            return `${year}-${month}-${day}T${hours}:${minutes}`;    
        })()    
    });    
      
    const borderCoordinates = {      
        'bajakovo-batrovci': { lat: 45.0833, lon: 19.3833 },      
        'batrovci-bajakovo': { lat: 45.0833, lon: 19.3833 },    
        'tovarnik-sid': { lat: 45.1667, lon: 19.1667 },      
        'sid-tovarnik': { lat: 45.1667, lon: 19.1667 }      
    };      
    
    useEffect(() => {      
        if (showInfoModal && specialEvents.length === 0) {      
            fetchTrafficFactors();      
        }      
    }, [showInfoModal]);      
      
    useEffect(() => {      
        getUserLocation();      
    }, []);      
      
    useEffect(() => {      
        if (formData.locationCoords) {      
            calculateDriveTime();      
        }      
    }, [formData.locationCoords, formData.borderPass]);      
      
    useEffect(() => {      
        if (showInfoModal) {      
            document.body.style.overflow = 'hidden';      
        } else {      
            document.body.style.overflow = '';      
        }      
        return () => {      
            document.body.style.overflow = '';      
        };      
    }, [showInfoModal]);      
  
    useEffect(() => {  
        if (prediction) {  
            fetchCameras();  
        }  
    }, [prediction, formData.borderPass]);  
    
    const fetchTrafficFactors = async () => {      
        setFactorsLoading(true);      
        try {      
            const response = await fetch('http://localhost:5001/api/traffic-factors');      
            const data = await response.json();      
            setSpecialEvents(data.active_factors || []);      
        } catch (error) {      
            console.error('Error fetching traffic factors:', error);    
            setSpecialEvents([      
                {      
                    id: 'ees',      
                    icon: '🛂',      
                    title: 'EES System Active',      
                    description: 'Entry/Exit System may cause longer wait times than usual at border crossings.'      
                }      
            ]);      
        } finally {      
            setFactorsLoading(false);      
        }      
    };      
  
    const fetchCameras = async () => {  
        setCamerasLoading(true);  
        try {  
            const response = await fetch(`http://localhost:5001/api/cameras/${formData.borderPass}`);  
              
            if (!response.ok) {  
                throw new Error('Failed to fetch cameras');  
            }  
              
            const result = await response.json();  
            setCameras(result.cameras || []);  
        } catch (error) {  
            console.error('Error fetching cameras:', error);  
            setCameras([]);  
        } finally {  
            setCamerasLoading(false);  
        }  
    };  
      
    const calculateDriveTime = async () => {      
        if (!formData.locationCoords) return;      
      
        const borderCoords = borderCoordinates[formData.borderPass];      
              
        try {      
            const response = await fetch(      
                `https://router.project-osrm.org/route/v1/driving/${formData.locationCoords.lon},${formData.locationCoords.lat};${borderCoords.lon},${borderCoords.lat}?overview=false`      
            );      
            const data = await response.json();      
                  
            if (data.routes && data.routes[0]) {      
                const durationInMinutes = Math.round(data.routes[0].duration / 60);      
                const hours = Math.floor(durationInMinutes / 60);      
                const minutes = durationInMinutes % 60;      
                      
                setDriveTime({      
                    hours,      
                    minutes,      
                    total: durationInMinutes,      
                    formatted: hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`      
                });      
            }      
        } catch (error) {      
            console.error('Error calculating drive time:', error);      
            const borderCoords = borderCoordinates[formData.borderPass];      
            const distance = calculateDistance(      
                formData.locationCoords.lat,      
                formData.locationCoords.lon,      
                borderCoords.lat,      
                borderCoords.lon      
            );      
            const estimatedHours = distance / 80;      
            const hours = Math.floor(estimatedHours);      
            const minutes = Math.round((estimatedHours - hours) * 60);      
                  
            setDriveTime({      
                hours,      
                minutes,      
                total: Math.round(estimatedHours * 60),      
                formatted: hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`,      
                estimated: true      
            });      
        }      
    };      
      
    const calculateDistance = (lat1, lon1, lat2, lon2) => {      
        const R = 6371;      
        const dLat = (lat2 - lat1) * Math.PI / 180;      
        const dLon = (lon2 - lon1) * Math.PI / 180;      
        const a =       
            Math.sin(dLat/2) * Math.sin(dLat/2) +      
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *      
            Math.sin(dLon/2) * Math.sin(dLon/2);      
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));      
        return R * c;      
    };      
      
    const getUserLocation = () => {      
        if (!navigator.geolocation) {      
            setShowCityInput(true);      
            return;      
        }      
      
        setLocationLoading(true);      
        navigator.geolocation.getCurrentPosition(      
            async (position) => {      
                const { latitude, longitude } = position.coords;      
      
                try {      
                    const response = await fetch(      
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`      
                    );      
                    const data = await response.json();      
      
                    const city = data.address.city ||      
                        data.address.town ||      
                        data.address.village ||      
                        data.address.municipality ||      
                        data.display_name.split(',')[0] ||      
                        'Unknown';      
      
                    setFormData(prev => ({      
                        ...prev,      
                        currentLocation: city,      
                        locationCoords: { lat: latitude, lon: longitude }      
                    }));      
                } catch (error) {      
                    console.error('Error reverse geocoding:', error);      
                    setShowCityInput(true);      
                } finally {      
                    setLocationLoading(false);      
                }      
            },      
            (error) => {      
                console.log('Geolocation denied:', error);      
                setShowCityInput(true);      
                setLocationLoading(false);      
            },      
            { timeout: 10000 }      
        );      
    };      
      
    const searchCities = async (query) => {      
        if (query.length < 2) {      
            setCitySuggestions([]);      
            return;      
        }      
      
        try {      
            const response = await fetch(      
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`      
            );      
            const data = await response.json();      
      
            setCitySuggestions(data.map(item => ({      
                name: item.display_name.split(',')[0],      
                fullName: item.display_name,      
                lat: parseFloat(item.lat),      
                lon: parseFloat(item.lon)      
            })));      
        } catch (error) {      
            console.error('Error searching cities:', error);      
        }      
    };      
      
    const handleCityInputChange = (e) => {      
        const value = e.target.value;      
        setFormData(prev => ({ ...prev, currentLocation: value }));      
        searchCities(value);      
    };      
      
    const selectCity = (city) => {      
        setFormData(prev => ({      
            ...prev,      
            currentLocation: city.name,      
            locationCoords: { lat: city.lat, lon: city.lon }      
        }));      
        setCitySuggestions([]);      
        setShowCityInput(false);      
    };      
      
    const getPrediction = async () => {      
        if (!formData.currentLocation) {      
            alert('Please enter your current location');      
            return;      
        }      
      
        if (!formData.departureTime) {      
            alert('Please select departure date and time');      
            return;      
        }      
      
        setLoading(true);    
        setFormChanged(false);  
            
        try {      
            const response = await fetch('http://localhost:5001/api/predict', {      
                method: 'POST',      
                headers: { 'Content-Type': 'application/json' },      
                body: JSON.stringify(formData)      
            });      
                  
            if (!response.ok) {      
                throw new Error('Failed to get prediction');      
            }      
                  
            const result = await response.json();      
            setPrediction(result);  
        } catch (error) {      
            console.error('Error getting prediction:', error);      
            alert('Failed to get prediction. Please try again.');      
        } finally {      
            setLoading(false);      
        }      
    };    
   
    const adjustDepartureTime = (minutes) => {    
        const currentTime = new Date(formData.departureTime);    
        const newTime = new Date(currentTime.getTime() + minutes * 60000);    
            
        const year = newTime.getFullYear();    
        const month = String(newTime.getMonth() + 1).padStart(2, '0');    
        const day = String(newTime.getDate()).padStart(2, '0');    
        const hours = String(newTime.getHours()).padStart(2, '0');    
        const mins = String(newTime.getMinutes()).padStart(2, '0');    
        const newTimeString = `${year}-${month}-${day}T${hours}:${mins}`;    
            
        setFormData(prev => ({    
            ...prev,    
            departureTime: newTimeString    
        }));    
            
        if (prediction) {    
            setFormChanged(true);    
        }    
    };    
    
    const getWaitTimeStatus = (waitTime) => {      
        if (!waitTime || typeof waitTime !== 'string') {      
            return {      
                color: '#6b7280',      
                bgColor: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',      
                borderColor: '#9ca3af',      
                icon: 'ℹ️',      
                status: 'unknown'      
            };      
        }      
          
        const lowerWaitTime = waitTime.toLowerCase();      
              
        const numbers = waitTime.match(/\d+/g);      
        if (!numbers || numbers.length === 0) {      
            return {      
                color: '#6b7280',      
                bgColor: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',      
                borderColor: '#9ca3af',      
                icon: 'ℹ️',      
                status: 'unknown'      
            };      
        }      
          
        const maxWait = Math.max(...numbers.map(n => parseInt(n)));      
              
        const isHours = lowerWaitTime.includes('h') && !lowerWaitTime.includes('min');      
        const waitMinutes = isHours ? maxWait * 60 : maxWait;      
          
        if (waitMinutes <= 10) {      
            return {      
                color: '#059669',      
                bgColor: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',      
                borderColor: '#10b981',      
                icon: '✅',      
                status: 'excellent'      
            };      
        } else if (waitMinutes <= 25) {      
            return {      
                color: '#16a34a',      
                bgColor: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',      
                borderColor: '#22c55e',      
                icon: '✅',      
                status: 'good'      
            };      
        } else if (waitMinutes <= 45) {      
            return {      
                color: '#ca8a04',      
                bgColor: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)',      
                borderColor: '#eab308',      
                icon: '⚠️',      
                status: 'moderate'      
            };      
        } else if (waitMinutes <= 70) {      
            return {      
                color: '#ea580c',      
                bgColor: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',      
                borderColor: '#f97316',      
                icon: '⚠️',      
                status: 'busy'      
            };      
        } else if (waitMinutes <= 120) {      
            return {      
                color: '#dc2626',      
                bgColor: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',      
                borderColor: '#ef4444',      
                icon: '🚨',      
                status: 'heavy'      
            };      
        } else {      
            return {      
                color: '#b91c1c',      
                bgColor: 'linear-gradient(135deg, #fca5a5 0%, #f87171 100%)',      
                borderColor: '#dc2626',      
                icon: '🚨',      
                status: 'critical'      
            };      
        }      
    };      
    
    const calculateArrivalTime = (departureTimeStr, driveTime) => {      
        if (!departureTimeStr || !driveTime) return null;      
          
        try {      
            const departureDate = new Date(departureTimeStr);      
            const totalMinutes = driveTime.total;    
                  
            const arrivalDate = new Date(departureDate.getTime() + totalMinutes * 60000);      
                  
            const hours = arrivalDate.getHours().toString().padStart(2, '0');      
            const minutes = arrivalDate.getMinutes().toString().padStart(2, '0');      
                  
            const isSameDay = departureDate.toDateString() === arrivalDate.toDateString();      
                  
            if (isSameDay) {      
                return {      
                    time: `${hours}:${minutes}`,      
                    fullDate: arrivalDate,      
                    nextDay: false      
                };      
            } else {      
                const day = arrivalDate.getDate();      
                const month = arrivalDate.toLocaleDateString('en-US', { month: 'short' });      
                return {      
                    time: `${hours}:${minutes}`,      
                    date: `${day} ${month}`,      
                    fullDate: arrivalDate,      
                    nextDay: true      
                };      
            }      
        } catch (error) {      
            console.error('Error calculating arrival time:', error);      
            return null;      
        }      
    };      
    
    return (      
        <div className="trip-prediction">      
            <div className="header">      
                <button className="back-btn" onClick={onBack} aria-label="Go back">      
                    ← Back      
                </button>      
                <h2>Trip Prediction</h2>    
                <button         
                    className="info-modal-btn"         
                    onClick={() => setShowInfoModal(true)}        
                    aria-label="View traffic factors"        
                    title="View traffic factors"        
                >        
                    <span className="info-icon-circle">i</span>      
                </button>    
            </div>      
      
            <div className="prediction-form">      
                <div className="form-group">      
                    <label className="form-label">      
                        <span>📍 Your Location</span>      
                    </label>      
      
                    {locationLoading ? (      
                        <div className="location-loading">      
                            <div className="small-spinner"></div>      
                            <span>Getting your location...</span>      
                        </div>      
                    ) : showCityInput ? (      
                        <div className="city-input-wrapper">      
                            <input      
                                type="text"      
                                className="text-input"      
                                placeholder="Enter your city..."      
                                value={formData.currentLocation}      
                                onChange={handleCityInputChange}      
                                autoFocus      
                            />      
                            {citySuggestions.length > 0 && (      
                                <div className="city-suggestions">      
                                    {citySuggestions.map((city, index) => (      
                                        <div      
                                            key={index}      
                                            className="city-suggestion-item"      
                                            onClick={() => selectCity(city)}      
                                        >      
                                            <span className="suggestion-icon">📍</span>      
                                            <span>{city.fullName}</span>      
                                        </div>      
                                    ))}      
                                </div>      
                            )}      
                        </div>      
                    ) : (      
                        <div className="location-display">      
                            <span className="location-value">📍 {formData.currentLocation}</span>      
                            <button      
                                className="change-btn"      
                                onClick={() => setShowCityInput(true)}      
                            >      
                                Change      
                            </button>      
                        </div>      
                    )}      
                </div>      
      
                <div className="form-group">      
                    <label className="form-label">      
                        <span>🚧 Border Crossing</span>      
                    </label>      
                    <select      
                        value={formData.borderPass}      
                        onChange={(e) => {  
                            setFormData({...formData, borderPass: e.target.value});  
                            if (prediction) {  
                                setFormChanged(true);  
                            }  
                        }}      
                        className="select-input"      
                    >     
                        <option value="bajakovo-batrovci">🇭🇷🇷🇸 Bajakovo - Batrovci (HR → RS)</option>      
                        <option value="batrovci-bajakovo">🇷🇸🇭🇷 Batrovci - Bajakovo (RS → HR)</option>      
                        <option value="tovarnik-sid">🇭🇷🇷🇸 Tovarnik - Šid (HR → RS)</option>      
                        <option value="sid-tovarnik">🇷🇸🇭🇷 Šid - Tovarnik (RS → HR)</option>      
                    </select>      
                </div>      
      
                <div className="form-group">      
                    <label className="form-label">      
                        <span>⏰ Departure Time</span>      
                    </label>      
                    <input      
                        type="datetime-local"      
                        className={`text-input ${formChanged ? 'input-changed' : ''}`}    
                        value={formData.departureTime}      
                        onChange={(e) => {    
                            setFormData({...formData, departureTime: e.target.value});    
                            if (prediction) {    
                                setFormChanged(true);    
                            }    
                        }}      
                        min={new Date().toISOString().slice(0, 16)}      
                    />    
                        
                    {prediction && (    
                        <div className="time-adjust-buttons">    
                            <button     
                                className="time-adjust-btn minus"    
                                onClick={() => adjustDepartureTime(-30)}    
                                disabled={loading}    
                                title="Leave 30 minutes earlier"    
                            >    
                                <span className="time-adjust-icon">−</span>    
                                <span className="time-adjust-text">30 min</span>    
                            </button>    
                            <span className="time-adjust-divider">|</span>    
                            <button     
                                className="time-adjust-btn plus"    
                                onClick={() => adjustDepartureTime(30)}    
                                disabled={loading}    
                                title="Leave 30 minutes later"    
                            >    
                                <span className="time-adjust-icon">+</span>    
                                <span className="time-adjust-text">30 min</span>    
                            </button>    
                        </div>    
                    )}    
                </div>      
      
                <button      
                    className={`predict-btn ${formChanged ? 'predict-btn-highlight' : ''}`}    
                    onClick={getPrediction}      
                    disabled={loading || !formData.currentLocation}      
                >      
                    {loading ? (      
                        <>      
                            <div className="btn-spinner"></div>      
                            <span>Analyzing...</span>      
                        </>      
                    ) : (      
                        <>      
                            <span>🔮</span>      
                            <span>Get Smart Prediction</span>      
                            {formChanged && <span className="update-indicator">↻</span>}    
                        </>      
                    )}      
                </button>    
            </div>      
      
            {prediction && (      
                <div className="prediction-results">      
                    <div className="result-header">      
                        <h3>🎯 Your Trip Forecast</h3>      
                    </div>      
      
                    {(() => {      
                        const arrivalTime = calculateArrivalTime(formData.departureTime, driveTime);      
                              
                        return (      
                            <div className="result-main-card">      
                                <div className="result-icon-large">🚗</div>      
                                <div className="result-content">      
                                    <p className="result-label">Drive Time to Border</p>      
                                    <h2 className="result-value-large">      
                                        {driveTime ? driveTime.formatted : 'Calculating...'}      
                                    </h2>      
                                    {arrivalTime && (      
                                        <div className="arrival-time">      
                                            <span className="arrival-icon">🎯</span>      
                                            <div className="arrival-info">      
                                                <span className="arrival-label">Planned arrival:</span>      
                                                <span className="arrival-value">      
                                                    {arrivalTime.time}      
                                                    {arrivalTime.nextDay && (      
                                                        <span className="arrival-date"> ({arrivalTime.date})</span>      
                                                    )}      
                                                </span>      
                                            </div>      
                                        </div>      
                                    )}      
                                </div>      
                            </div>      
                        );      
                    })()}      
    
                    {(() => {      
                        const waitStatus = getWaitTimeStatus(prediction.estimated_wait || prediction.wait_time);      
                              
                        return (      
                            <div       
                                className="result-wait-card"       
                                style={{       
                                    background: waitStatus.bgColor,      
                                    borderColor: waitStatus.borderColor       
                                }}      
                            >      
                                <div className="wait-header">      
                                    <span className="wait-icon">{waitStatus.icon}</span>      
                                    <div className="wait-content">      
                                        <p className="wait-label">    
                                            Estimated Wait at Border    
                                            <span className="wait-sublabel"> (upon arrival)</span>    
                                        </p>      
                                        <h3 className="wait-value" style={{ color: waitStatus.color }}>      
                                            {prediction.estimated_wait || prediction.wait_time || "Unknown"}      
                                        </h3>      
                                              
                                        {prediction.car_count && (      
                                            <div       
                                                className="wait-car-count"      
                                                style={{       
                                                    background: `${waitStatus.color}15`,      
                                                    borderColor: `${waitStatus.color}40`      
                                                }}      
                                            >      
                                                <span className="wait-car-icon">🚗</span>      
                                                <span className="wait-car-text" style={{ color: waitStatus.color }}>      
                                                    {prediction.car_count > 50       
                                                        ? '50+ cars in lane - 2 min wait per car'      
                                                        : `${prediction.car_count} cars - 2 min wait per car`      
                                                    }      
                                                </span>      
                                            </div>      
                                        )}      
                                    </div>      
                                </div>      
                            </div>      
                        );      
                    })()}      
  
                    {/* CAMERAS ACCORDION - Same as CurrentSituation */}  
                    {cameras.length > 0 && (  
                        <div className="cameras-accordion">  
                            <button   
                                className="cameras-accordion-header"  
                                onClick={() => setShowCameras(!showCameras)}  
                            >  
                                <div className="cameras-header-content">  
                                    <span className="camera-icon">📹</span>  
                                    <h4>CAMERAS</h4>  
                                    <span className="camera-count-badge">{cameras.length}</span>  
                                </div>  
                                <span className={`accordion-toggle ${showCameras ? 'open' : ''}`}>  
                                    ▼  
                                </span>  
                            </button>  
  
                            {showCameras && (  
                                <div className="cameras-content">  
                                    {camerasLoading ? (  
                                        <div className="cameras-loading">  
                                            <div className="small-spinner"></div>  
                                            <p>Loading camera feeds...</p>  
                                        </div>  
                                    ) : cameras.length === 0 ? (  
                                        <div className="no-cameras">  
                                            <span>📷</span>  
                                            <p>No camera feeds available</p>  
                                        </div>  
                                    ) : (  
                                        <div className="cameras-grid">  
                                            {cameras.map((camera) => (  
                                                <div key={camera.id} className="camera-card">  
                                                    <div className="camera-header">  
                                                        <span className="camera-name">{camera.name}</span>  
                                                        <span className="camera-live-badge">● LIVE</span>  
                                                    </div>  
                                                    <div className="camera-image-wrapper">  
                                                        <img   
                                                            src={`http://localhost:5001${camera.url}`}  
                                                            alt={camera.name}  
                                                            className="camera-image"  
                                                            onError={(e) => {  
                                                                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">No Image</text></svg>';  
                                                            }}  
                                                        />  
                                                    </div>  
                                                    <div className="camera-timestamp">  
                                                        <span>🕐</span>  
                                                        <span>{new Date(camera.timestamp).toLocaleTimeString()}</span>  
                                                    </div>  
                                                </div>  
                                            ))}  
                                        </div>  
                                    )}  
                                </div>  
                            )}  
                        </div>  
                    )}  
    
                    <div className="recommendations-section">      
                        <button       
                            className="recommendations-header"      
                            onClick={() => setShowRecommendations(!showRecommendations)}      
                        >      
                            <div className="recommendations-header-content">      
                                <span className="recommendations-icon">💡</span>      
                                <h4 className="recommendations-title">Smart Options to Reduce Wait</h4>      
                            </div>      
                            <span className={`recommendations-toggle ${showRecommendations ? 'open' : ''}`}>      
                                ▼      
                            </span>      
                        </button>      
                              
                        {showRecommendations && (      
                            <div className="recommendation-cards-wrapper">      
                                <div className="recommendation-cards">      
                                    <button className="recommendation-card option-earlier">      
                                        <div className="rec-icon">🌅</div>      
                                        <div className="rec-content">      
                                            <h5>Leave Earlier</h5>      
                                            <p className="rec-time">Depart at 6:00 AM</p>      
                                            <p className="rec-benefit">✅ Arrive before rush - Wait only 20 min</p>      
                                            {prediction.early_car_count && (      
                                                <p className="rec-cars">~{prediction.early_car_count} cars expected</p>      
                                            )}      
                                        </div>      
                                        <div className="rec-arrow">→</div>      
                                    </button>      
              
                                    <button className="recommendation-card option-later">      
                                        <div className="rec-icon">☀️</div>      
                                        <div className="rec-content">      
                                            <h5>Leave Later</h5>      
                                            <p className="rec-time">Depart in 2 hours</p>      
                                            <p className="rec-benefit">✅ Avoid peak traffic - Wait 45 min</p>      
                                            {prediction.later_car_count && (      
                                                <p className="rec-cars">~{prediction.later_car_count} cars expected</p>      
                                            )}      
                                        </div>      
                                        <div className="rec-arrow">→</div>      
                                    </button>      
              
                                    {prediction.alternative_border && (      
                                        <button className="recommendation-card option-alternative">      
                                            <div className="rec-icon">🛣️</div>      
                                            <div className="rec-content">      
                                                <h5>Alternative Border</h5>      
                                                <p className="rec-time">{prediction.alternative_border}</p>      
                                                <p className="rec-benefit">✅ Less crowded - Wait 30 min</p>      
                                                {prediction.alternative_car_count && (      
                                                    <p className="rec-cars">~{prediction.alternative_car_count} cars expected</p>      
                                                )}      
                                            </div>      
                                            <div className="rec-arrow">→</div>      
                                        </button>      
                                    )}      
                                </div>      
                            </div>      
                        )}      
                    </div>      
    
                    <div className="confidence-footer">      
                        <span>📊</span>      
                        <span>Prediction Confidence: <strong>{prediction.confidence_score || 85}%</strong></span>      
                    </div>      
                </div>      
            )}      
    
            {showInfoModal && (      
                <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>      
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>      
                        <div className="modal-header">      
                            <h3>⚠️ Traffic Factors</h3>      
                            <button       
                                className="modal-close-btn"       
                                onClick={() => setShowInfoModal(false)}      
                                aria-label="Close modal"      
                            >      
                            </button>      
                        </div>      
                        <div className="modal-body">      
                            <p className="modal-description">      
                                These factors may affect border crossing wait times:      
                            </p>      
                            {factorsLoading ? (      
                                <div className="factors-loading">      
                                    <div className="small-spinner"></div>      
                                    <span>Loading current factors...</span>      
                                </div>      
                            ) : specialEvents.length === 0 ? (      
                                <div className="no-factors">      
                                    <span>✅</span>      
                                    <p>No special traffic factors currently active.</p>      
                                </div>      
                            ) : (      
                                <div className="info-cards">      
                                    {specialEvents.map(event => (      
                                        <div key={event.id} className="info-card">      
                                            <button      
                                                className="info-card-header"      
                                                onClick={() => setShowInfoTooltip(showInfoTooltip === event.id ? null : event.id)}      
                                            >      
                                                <span className="info-icon">{event.icon}</span>      
                                                <span className="info-title-text">{event.title}</span>      
                                                <span className={`info-toggle ${showInfoTooltip === event.id ? 'open' : ''}`}>      
                                                    ℹ️      
                                                </span>      
                                            </button>      
                                            {showInfoTooltip === event.id && (      
                                                <div className="info-content">      
                                                    <p>{event.description}</p>      
                                                </div>      
                                            )}      
                                        </div>      
                                    ))}      
                                </div>      
                            )}      
                        </div>      
                    </div>      
                </div>      
            )}      
        </div>      
    );      
}      
      
export default TripPrediction;  
