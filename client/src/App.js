// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

import React, { useState, useEffect } from 'react'
import BingoCard from './BingoCard'

function App () {
  const [allPhrases, setAllPhrases] = useState([])
  const [selectedPhrases, setSelectedPhrases] = useState([])
  const [bingoGrid, setBingoGrid] = useState(null)

  useEffect(() => {
    // Fetch list of phrases from backend
    fetch('/api/phrases')
      .then(res => res.json())
      .then(data => {
        setAllPhrases(data)
      })
      .catch(err => console.error(err))
  }, [])

  const handleCheckboxChange = phrase => {
    // If phrase is already selected, remove it
    if (selectedPhrases.includes(phrase)) {
      setSelectedPhrases(selectedPhrases.filter(p => p !== phrase))
    } else {
      // If not selected yet, add it (up to 24)
      if (selectedPhrases.length < 24) {
        setSelectedPhrases([...selectedPhrases, phrase])
      } else {
        alert('You can only select 24 phrases for a single Bingo card.')
      }
    }
  }

  const generateBingoCard = () => {
    if (selectedPhrases.length !== 24) {
      alert('You must select exactly 24 phrases.')
      return
    }

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedPhrases })
    })
      .then(res => res.json())
      .then(data => {
        setBingoGrid(data.bingoGrid)
      })
      .catch(err => console.error(err))
  }

  return (
    <div className='container'>
      <h1>Bingo Card Generator</h1>
      <div className='phrases-panel'>
        <h2>Select 24 Phrases</h2>
        <p>{selectedPhrases.length} selected (24 required)</p>
        <div className='phrases-list'>
          {allPhrases.map((phrase, index) => (
            <div key={index} className='phrase-item'>
              <input
                type='checkbox'
                id={phrase}
                checked={selectedPhrases.includes(phrase)}
                onChange={() => handleCheckboxChange(phrase)}
              />
              <label htmlFor={phrase}>{phrase}</label>
            </div>
          ))}
        </div>
        <button onClick={generateBingoCard} className='btn-generate'>
          Generate Bingo Card
        </button>
      </div>

      {bingoGrid && (
        <div className='bingo-panel'>
          <h2>Your Bingo Card</h2>
          <BingoCard bingoGrid={bingoGrid} />
        </div>
      )}
    </div>
  )
}

export default App
