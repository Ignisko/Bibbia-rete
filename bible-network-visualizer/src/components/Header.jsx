import React, { useState, useRef, useEffect } from 'react';
import { Menu, Info } from 'lucide-react';

const Header = ({ onMenuClick, currentBookName }) => {
  const [showAbout, setShowAbout] = useState(false);
  const aboutRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aboutRef.current && !aboutRef.current.contains(event.target)) {
        setShowAbout(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [aboutRef]);

  return (
    <header>
      <div className="title-credits">
        <div className="title-row">
          <button onClick={onMenuClick} className="icon-btn menu-btn" aria-label="Open Books Menu">
            <Menu size={24} color="var(--text-color)" />
          </button>
          <h1>Mapping the Bible {currentBookName && <span style={{opacity: 0.6, fontSize: '0.8em'}}>| {currentBookName}</span>}</h1>
        </div>
        <div className="header-actions">
          <button className="icon-btn about-btn" onClick={() => setShowAbout(!showAbout)}>
            <Info size={18} color="var(--text-color)" /> About
          </button>
          {showAbout && (
            <div className="about-modal" ref={aboutRef}>
              <h3>About this Project</h3>
              <p>Data extracted from the <strong>Douay-Rheims Catholic Bible</strong>.</p>
              <p>Inspired by <strong>Prof. Dmitry Zinoviev</strong>.</p>
              <p>Created by <a href="https://idiotajezusa.pl/" target="_blank" rel="noopener noreferrer">https://idiotajezusa.pl/</a></p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
