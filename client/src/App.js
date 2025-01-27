import React, { useState } from 'react'
import ManagePhrases from './ManagePhrases'
import BingoCard from './BingoCard'

/**
 * App: Top-level container.
 * - Renders ManagePhrases (handles add/edit/delete + checkboxes).
 * - When user has exactly 24 checked, "Generate Bingo Card" is enabled.
 * - Renders BingoCard below if we have a generated grid.
 */
function App () {
  const [bingoGrid, setBingoGrid] = useState(null)

  // Called by ManagePhrases once user wants to generate the card
  const generateBingoCard = async selectedPhrases => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedPhrases })
      })
      if (!response.ok) {
        const { error } = await response.json()
        alert(error)
        return
      }
      const data = await response.json()
      setBingoGrid(data.bingoGrid)
    } catch (error) {
      console.error('Error generating Bingo card:', error)
      alert('Failed to generate Bingo card.')
    }
  }

  return (
    <div className='container'>
      <h1>Bingo Card Generator</h1>
      <ManagePhrases onGenerate={generateBingoCard} />

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
