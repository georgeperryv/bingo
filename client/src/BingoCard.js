import React from 'react'
import BingoCell from './BingoCell'

function BingoCard ({ bingoGrid }) {
  return (
    <div className='bingo-card'>
      {bingoGrid.map((row, rowIndex) => (
        <div key={rowIndex} className='bingo-row'>
          {row.map((cell, colIndex) => (
            <BingoCell key={colIndex} text={cell} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default BingoCard
