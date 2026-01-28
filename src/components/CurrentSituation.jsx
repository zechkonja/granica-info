import { useState, useEffect } from 'react';
import '../styles/CurrentSituation.css';

function CurrentSituation({ onBack }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [selectedRoute, setSelectedRoute] = useState('bajakovo-batrovci');

    const routes = [
        { id: 'bajakovo-batrovci', name: 'Bajakovo - Batrovci', flag: '🇭🇷🇷🇸' },
        { id: 'belgrade-ljubljana', name: 'Belgrade - Ljubljana', flag: '🇷🇸🇸🇮' }
    ];

    const fetchCurrentSituation = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5001/api/current/${selectedRoute}`);
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentSituation();
    }, [selectedRoute]);

    const getStatusColor = (status) => {
        const colors = {
            'free': '#10b981',
            'light': '#fbbf24',
            'moderate': '#f97316',
            'heavy': '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    return (
        <div className="current-situation">
            <div className="header">
                <button className="back-btn" onClick={onBack}>← Back</button>
                <h2>Current Situation</h2>
            </div>

            <div className="route-selector">
                {routes.map(route => (
                    <button
                        key={route.id}
                        className={`route-btn ${selectedRoute === route.id ? 'active' : ''}`}
                        onClick={() => setSelectedRoute(route.id)}
                    >
                        <span>{route.flag}</span>
                        <span>{route.name}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading data...</p>
                </div>
            ) : data ? (
                <div className="situation-card">
                    <div
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(data.status) }}
                    >
                        {data.status.toUpperCase()}
                    </div>

                    <div className="info-grid">
                        <div className="info-item">
                            <span className="label">Wait Time</span>
                            <span className="value">{data.wait_time}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Traffic Density</span>
                            <span className="value">{data.density}%</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Queue Length</span>
                            <span className="value">{data.queue_length}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Last Updated</span>
                            <span className="value">{data.last_updated}</span>
                        </div>
                    </div>

                    {data.message && (
                        <div className="alert-box">
                            <span>ℹ️</span>
                            <p>{data.message}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="no-data">
                    <p>No data available</p>
                </div>
            )}

            <button className="refresh-btn" onClick={fetchCurrentSituation}>
                🔄 Refresh
            </button>
        </div>
    );
}

export default CurrentSituation;
