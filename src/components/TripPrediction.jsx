import { useState, useEffect } from 'react';
import '../styles/TripPrediction.css';

function TripPrediction({ onBack }) {
    const [loading, setLoading] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [showCityInput, setShowCityInput] = useState(false);
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [formData, setFormData] = useState({
        currentLocation: '',
        locationCoords: null,
        borderPass: 'bajakovo-batrovci',
        departureTime: new Date().toISOString().slice(0, 16)
    });

    useEffect(() => {
        getUserLocation();
    }, []);

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

                    // Extract city name from various possible fields
                    const city = data.address.city ||
                        data.address.town ||
                        data.address.village ||
                        data.address.municipality ||
                        data.address.county ||
                        data.name ||
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
                console.log('Geolocation denied or error:', error);
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
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&featuretype=city`
            );
            const data = await response.json();

            setCitySuggestions(data.map(item => ({
                name: item.display_name.split(',')[0],
                fullName: item.display_name,
                lat: item.lat,
                lon: item.lon
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
        try {
            const response = await fetch('http://localhost:5001/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            setPrediction(result);
        } catch (error) {
            console.error('Error getting prediction:', error);
            alert('Failed to get prediction. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="trip-prediction">
            <div className="header">
                <button className="back-btn" onClick={onBack}>← Back</button>
                <h2>Trip Prediction</h2>
            </div>

            <div className="prediction-form">
                <div className="form-group">
                    <label>📍 Your Location</label>

                    {locationLoading ? (
                        <div className="location-loading">
                            <span>🌍 Getting your location...</span>
                        </div>
                    ) : showCityInput ? (
                        <div className="city-input-wrapper">
                            <input
                                type="text"
                                className="city-input"
                                placeholder="Enter your city name..."
                                value={formData.currentLocation}
                                onChange={handleCityInputChange}
                            />
                            {citySuggestions.length > 0 && (
                                <div className="city-suggestions">
                                    {citySuggestions.map((city, index) => (
                                        <div
                                            key={index}
                                            className="city-suggestion-item"
                                            onClick={() => selectCity(city)}
                                        >
                                            {city.fullName}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="location-display">
                            <span className="location-value">📍 {formData.currentLocation}</span>
                            <button
                                className="change-location-btn"
                                onClick={() => setShowCityInput(true)}
                            >
                                Change
                            </button>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>🚧 Border Crossing</label>
                    <select
                        value={formData.borderPass}
                        onChange={(e) => setFormData({...formData, borderPass: e.target.value})}
                        className="select-input"
                    >
                        <option value="bajakovo-batrovci">Bajakovo - Batrovci</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>⏰ When are you leaving?</label>
                    <input
                        type="datetime-local"
                        className="datetime-input"
                        value={formData.departureTime}
                        onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                        min={new Date().toISOString().slice(0, 16)}
                    />
                </div>

                <button
                    className="predict-btn"
                    onClick={getPrediction}
                    disabled={loading}
                >
                    {loading ? 'Analyzing...' : '🔮 Get Prediction'}
                </button>
            </div>

            {prediction && (
                <div className="prediction-result">
                    <div className="result-header">
                        <h3>Your Trip Forecast</h3>
                        <span className={`confidence ${prediction.confidence}`}>
                            {prediction.confidence_score}% confidence
                        </span>
                    </div>

                    <div className="result-card">
                        <div className="result-main">
                            <span className="result-icon">⏱️</span>
                            <div>
                                <p className="result-label">Estimated Wait Time</p>
                                <p className="result-value">{prediction.estimated_wait}</p>
                            </div>
                        </div>

                        <div className="result-details">
                            <div className="detail-item">
                                <span>Best Time:</span>
                                <strong>{prediction.best_time}</strong>
                            </div>
                            <div className="detail-item">
                                <span>Traffic Level:</span>
                                <strong>{prediction.traffic_level}</strong>
                            </div>
                        </div>

                        {prediction.recommendation && (
                            <div className="recommendation">
                                <span>💡</span>
                                <p>{prediction.recommendation}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default TripPrediction;
