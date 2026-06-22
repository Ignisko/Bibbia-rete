import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NetworkGraph from './components/NetworkGraph';
import './index.css';

import { bookData, bookList } from './data/index.js';

function App() {
  const [selectedBook, setSelectedBook] = useState(bookList.length > 0 ? bookList[0].id : '');
  const [data, setData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (selectedBook && bookData[selectedBook]) {
      setData(bookData[selectedBook]);
    }
  }, [selectedBook]);

  const currentBookName = bookList.find(b => b.id === selectedBook)?.name || '';

  return (
    <div className="app-layout">
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)} 
        currentBookName={currentBookName}
      />
      
      <div className="main-content">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
          bookList={bookList}
          selectedBook={selectedBook}
          onBookChange={setSelectedBook}
        />
        
        <main className="graph-area">
          {data ? (
            <NetworkGraph data={data} />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              Loading network data... Please wait for extraction script to finish.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
