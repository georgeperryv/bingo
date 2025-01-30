import React, { useState } from 'react'
import ManagePhrases from './ManagePhrases'
import BingoCard from './BingoCard'

function App () {
  const [bingoGrid, setBingoGrid] = useState(null)

  const generateBingoCard = async dataForGeneration => {
    // dataForGeneration = { include: [], exclude: [], maybe: [] }
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataForGeneration)
      })

      if (!response.ok) {
        const { error } = await response.json()
        alert(error)
        return
      }

      const result = await response.json()
      setBingoGrid(result.bingoGrid)
    } catch (error) {
      console.error('Error generating bingo card:', error)
      alert('Failed to generate bingo card.')
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
