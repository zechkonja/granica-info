import { useState, useRef, useEffect } from 'react';  
import '../styles/BorderSelector.css';  
  
function BorderSelector({ borders, selectedBorder, onSelectBorder }) {  
    const [isOpen, setIsOpen] = useState(false);  
    const dropdownRef = useRef(null);  
  
    // Get selected border object  
    const selectedBorderObj = borders.find(b => b.id === selectedBorder) || borders[0];  
  
    // Close dropdown when clicking outside  
    useEffect(() => {  
        const handleClickOutside = (event) => {  
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {  
                setIsOpen(false);  
            }  
        };  
  
        document.addEventListener('mousedown', handleClickOutside);  
        return () => {  
            document.removeEventListener('mousedown', handleClickOutside);  
        };  
    }, []);  
  
    const handleSelect = (borderId) => {  
        onSelectBorder(borderId);  
        setIsOpen(false);  
    };  
  
    return (  
        <div className="border-selector-wrapper" ref={dropdownRef}>  
            <label className="section-label">Select Border Crossing</label>  
              
            {/* Selected Border Display */}  
            <button  
                className="border-selector-toggle"  
                onClick={() => setIsOpen(!isOpen)}  
            >  
                <span className="border-flag">{selectedBorderObj.flag}</span>  
                <div className="border-info">  
                    <span className="border-name">{selectedBorderObj.name}</span>  
                    <span className="border-route">{selectedBorderObj.route}</span>  
                </div>  
                <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>  
            </button>  
  
            {/* Dropdown Options */}  
            {isOpen && (  
                <div className="border-dropdown">  
                    {borders.map(border => (  
                        <button  
                            key={border.id}  
                            className={`border-option ${selectedBorder === border.id ? 'selected' : ''}`}  
                            onClick={() => handleSelect(border.id)}  
                        >  
                            <span className="border-flag">{border.flag}</span>  
                            <div className="border-info">  
                                <span className="border-name">{border.name}</span>  
                                <span className="border-route">{border.route}</span>  
                            </div>  
                            {selectedBorder === border.id && (  
                                <span className="check-mark">✓</span>  
                            )}  
                        </button>  
                    ))}  
                </div>  
            )}  
        </div>  
    );  
}  
  
export default BorderSelector;  
