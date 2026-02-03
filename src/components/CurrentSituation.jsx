import { useState, useEffect } from 'react';    
import BorderSelector from './BorderSelector';    
import '../styles/CurrentSituation.css';    
    
function CurrentSituation({ onBack }) {    
    const [loading, setLoading] = useState(false);    
    const [data, setData] = useState(null);    
    const [error, setError] = useState(null);    
    const [selectedBorder, setSelectedBorder] = useState('bajakovo-batrovci');    
      
    // NEW: Camera states  
    const [cameras, setCameras] = useState([]);  
    const [camerasLoading, setCamerasLoading] = useState(false);  
    const [showCameras, setShowCameras] = useState(false);  
    
    const borders = [  
        { id: 'bajakovo-batrovci', name: 'Bajakovo - Batrovci', flag: '🇭🇷🇷🇸', route: 'HR → RS' },      
        { id: 'batrovci-bajakovo', name: 'Batrovci - Bajakovo', flag: '🇷🇸🇭🇷', route: 'RS → HR' },    
        { id: 'sid-tovarnik', name: 'Šid - Tovarnik', flag: '🇷🇸🇭🇷', route: 'RS → HR' },    
        { id: 'tovarnik-sid', name: 'Tovarnik - Šid', flag: '🇭🇷🇷🇸', route: 'HR → RS' }    
    ];    
    
    const fetchCurrentSituation = async () => {    
        setLoading(true);    
        setError(null);    
        try {    
            const response = await fetch(`http://localhost:5001/api/current/${selectedBorder}`);    
                
            if (!response.ok) {    
                throw new Error(`API Error: ${response.status}`);    
            }    
                
            const result = await response.json();    
                
            if (!result || !result.wait_time) {    
                throw new Error('Invalid data received from API');    
            }    
                
            setData(result);    
        } catch (error) {    
            console.error('Error fetching data:', error);    
            setError(error.message || 'Failed to fetch border data');    
            setData(null);    
        } finally {    
            setLoading(false);    
        }    
    };    
  
    // NEW: Fetch camera images  
    const fetchCameras = async () => {  
        setCamerasLoading(true);  
        try {  
            const response = await fetch(`http://localhost:5001/api/cameras/${selectedBorder}`);  
              
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
    
    useEffect(() => {    
        fetchCurrentSituation();    
        fetchCameras(); // Fetch cameras when border changes  
    }, [selectedBorder]);    
    
    const getStatusInfo = (waitTime) => {    
        if (!waitTime || typeof waitTime !== 'string') {    
            return {     
                status: 'unknown',     
                color: '#6b7280',     
                icon: 'ℹ️',     
                message: 'Status unavailable'     
            };    
        }    
    
        const lowerWaitTime = waitTime.toLowerCase();    
            
        if (lowerWaitTime.includes('10') && lowerWaitTime.includes('15')) {    
            return {     
                status: 'free',     
                color: '#10b981',     
                icon: '✅',     
                message: 'Small jam, good to go!'     
            };    
        } else if (lowerWaitTime.includes('3h') || lowerWaitTime.includes('3 h')) {    
            return {     
                status: 'heavy',     
                color: '#ef4444',     
                icon: '⚠️',     
                message: 'Heavy traffic! Consider another border.'     
            };    
        } else if (lowerWaitTime.includes('30') || lowerWaitTime.includes('60')) {    
            return {     
                status: 'moderate',     
                color: '#f59e0b',     
                icon: '⏱️',     
                message: 'Moderate wait expected'     
            };    
        }    
            
        return {     
            status: 'light',     
            color: '#3b82f6',     
            icon: '🚗',     
            message: 'Light traffic'     
        };    
    };    
    
    const getCarCountDisplay = (carCount) => {    
        if (!carCount) return null;    
            
        if (carCount > 50) {    
            return `50+ cars in lane`;    
        }    
        return `${carCount} cars`;    
    };    
    
    return (    
        <div className="current-situation">    
            <div className="header">    
                <button className="back-btn" onClick={onBack} aria-label="Go back">    
                    ← Back    
                </button>    
                <h2>Current Situation</h2>    
                <div className="header-spacer"></div>    
            </div>    
    
            <BorderSelector     
                borders={borders}    
                selectedBorder={selectedBorder}    
                onSelectBorder={setSelectedBorder}    
            />    
    
            {loading ? (    
                <div className="loading-state">    
                    <div className="spinner"></div>    
                    <p>Fetching live data...</p>    
                </div>    
            ) : error ? (    
                <div className="error-state">    
                    <span className="error-icon">⚠️</span>    
                    <h3>Unable to Load Data</h3>    
                    <p>{error}</p>    
                    <button className="retry-btn" onClick={fetchCurrentSituation}>    
                        Try Again    
                    </button>    
                </div>    
            ) : data ? (    
                <>    
                    {(() => {    
                        const statusInfo = getStatusInfo(data.wait_time);    
                        const carCountDisplay = getCarCountDisplay(data.car_count);    
                            
                        return (    
                            <div className="status-card">    
                                <div className="status-header" style={{ borderLeftColor: statusInfo.color }}>    
                                    <div className="status-icon" style={{ background: statusInfo.color }}>    
                                        {statusInfo.icon}    
                                    </div>    
                                    <div className="status-info">    
                                        <p className="status-label">Current Wait Time</p>    
                                        <h3 className="status-value">{data.wait_time}</h3>    
                                        <p className="status-message">{statusInfo.message}</p>    
                                    </div>    
                                </div>    
    
                                {carCountDisplay && (    
                                    <div className="car-count-section">    
                                        <div className="car-count-card">    
                                            <span className="car-icon">🚗</span>    
                                            <div className="car-count-info">    
                                                <p className="car-count-label">Cars in Queue</p>    
                                                <h4 className="car-count-value">{carCountDisplay}</h4>    
                                                <p className="car-count-note">~2 min per car</p>    
                                            </div>    
                                        </div>    
                                    </div>    
                                )}    
    
                                <div className="last-updated">    
                                    <span>🕐</span>    
                                    <span>Updated: {data.last_updated || 'Just now'}</span>    
                                </div>    
                            </div>    
                        );    
                    })()}  
  
                    {/* NEW: CAMERAS ACCORDION */}  
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
                </>    
            ) : (    
                <div className="no-data-state">    
                    <span className="no-data-icon">📭</span>    
                    <p>No data available</p>    
                </div>    
            )}    
    
            <button className="refresh-btn" onClick={() => {  
                fetchCurrentSituation();  
                fetchCameras();  
            }} disabled={loading}>    
                <span className="refresh-icon">🔄</span>    
                <span>Refresh Data</span>    
            </button>    
        </div>    
    );    
}    
    
export default CurrentSituation;  
