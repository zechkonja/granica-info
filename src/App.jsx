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
                            <h1>Granica Info</h1>  
                            <p className="subtitle">Smart border traffic</p>  
                        </div>  
  
                        <div className="action-cards">  
                            <button  
                                className="action-card current"  
                                onClick={() => setActiveView('current')}  
                            >  
                                <div className="card-icon">📍</div>  
                                <div className="card-content">  
                                    <h2>Current Situation</h2>  
                                    <p>Real-time border status</p>  
                                </div>  
                                <div className="card-arrow">→</div>  
                            </button>  
  
                            <button  
                                className="action-card prediction"  
                                onClick={() => setActiveView('prediction')}  
                            >  
                                <div className="card-icon">🔮</div>  
                                <div className="card-content">  
                                    <h2>Trip Prediction</h2>  
                                    <p>AI-powered smart forecast</p>  
                                    <span className="pro-badge">PRO</span>  
                                </div>  
                                <div className="card-arrow">→</div>  
                            </button>  
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
