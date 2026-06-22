import React from 'react';
import { X, Book } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, bookList, selectedBook, onBookChange }) => {
  return (
    <>
      {/* Overlay to click-to-close on mobile/smaller screens */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Book size={20} color="var(--accent-color)" />
            <h2 style={{margin: 0, fontSize: '1.2rem'}}>Select Book</h2>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X size={20} />
          </button>
        </div>
        
        <div className="sidebar-content">
          {bookList.map(book => (
            <button 
              key={book.id}
              className={`book-item ${selectedBook === book.id ? 'active' : ''}`}
              onClick={() => {
                onBookChange(book.id);
                onClose(); // Automatically close after selecting to save space
              }}
            >
              {book.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
