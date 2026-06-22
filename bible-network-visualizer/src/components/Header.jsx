import React from 'react';
import { Menu } from 'lucide-react';

const Header = ({ onMenuClick }) => {
  return (
    <header>
      <div className="title-credits">
        <div className="title-row">
          <button onClick={onMenuClick} className="icon-btn menu-btn" aria-label="Open Books Menu">
            <Menu size={24} color="var(--text-color)" />
          </button>
          <h1>Mapping the Bible</h1>
        </div>
        <div className="credits">
          Data extracted from the <strong>Douay-Rheims Catholic Bible</strong>.<br />
          Inspired by Prof. Dmitry Zinoviev (<a href="https://www.idiotajezusa.pl/" target="_blank" rel="noopener noreferrer">idiotajezusa.pl</a>)
        </div>
      </div>
    </header>
  );
};

export default Header;
