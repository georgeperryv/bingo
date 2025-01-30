import React from 'react'
import BingoCell from './BingoCell'

function BingoCard ({ bingoGrid }) {
  const columns = ['B', 'I', 'N', 'G', 'O']
  return (
    <table className='bingo-table'>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bingoGrid.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cellText, colIndex) => (
              <BingoCell key={colIndex} text={cellText} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default BingoCard
