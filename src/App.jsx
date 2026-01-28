import { useState } from 'react';
import './App.css';
import CurrentSituation from './components/CurrentSituation';
import TripPrediction from './components/TripPrediction';

function App() {
    const [activeView, setActiveView] = useState('home');

    const renderView = () => {
        switch(activeView) {
            case 'current':
                return <CurrentSituation onBack={() => setActiveView('home')} />;
            case 'prediction':
                return <TripPrediction onBack={() => setActiveView('home')} />;
            default:
                return (
                    <div className="home-view">
                        <div className="hero">
                            <h1>🚗 Granica Info</h1>
                            <p className="subtitle">Real-time border traffic intelligence</p>
                        </div>

                        <div className="action-cards">
                            <button
                                className="action-card primary"
                                onClick={() => setActiveView('current')}
                            >
                                <span className="icon">📍</span>
                                <h2>Current Situation</h2>
                                <p>Check border status now</p>
                            </button>

                            <button
                                className="action-card secondary"
                                onClick={() => setActiveView('prediction')}
                            >
                                <span className="icon">🔮</span>
                                <h2>Trip Prediction</h2>
                                <p>AI-powered wait time forecast</p>
                            </button>
                        </div>

                        <div className="quick-info">
                            <p>📌 Currently tracking: Bajakovo - Batrovci</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="App">
            {renderView()}
        </div>
    );
}

export default App;
