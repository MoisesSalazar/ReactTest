// src/App.jsx
import React from 'react';
import ThreeScene from './components/threeScene/ThreeScene';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Hello Cube</h1>
      </header>
      <main className="app-body">
        <ThreeScene />
      </main>
    </div>
  );
}

export default App;