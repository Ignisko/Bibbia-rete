import React from 'react';
import { X, Book, ScrollText, Cross } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, bookList, selectedBook, onBookChange }) => {
  const oldTestamentBooks = bookList.filter(b => b.testament === 'Old Testament');
  const newTestamentBooks = bookList.filter(b => b.testament === 'New Testament');

  return (
    <>
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
          {oldTestamentBooks.length > 0 && (
            <div className="testament-section">
              <h3 className="testament-header">
                <ScrollText size={16} />
                Old Testament
              </h3>
              {oldTestamentBooks.map(book => (
                <button 
                  key={book.id}
                  className={`book-item ${selectedBook === book.id ? 'active' : ''}`}
                  onClick={() => {
                    onBookChange(book.id);
                    onClose();
                  }}
                >
                  {book.name}
                </button>
              ))}
            </div>
          )}

          {newTestamentBooks.length > 0 && (
            <div className="testament-section" style={{ marginTop: '1rem' }}>
              <h3 className="testament-header" style={{ color: '#8B0000' }}>
                <Book size={16} />
                New Testament
              </h3>
              {newTestamentBooks.map(book => (
                <button 
                  key={book.id}
                  className={`book-item ${selectedBook === book.id ? 'active' : ''}`}
                  onClick={() => {
                    onBookChange(book.id);
                    onClose();
                  }}
                >
                  {book.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
