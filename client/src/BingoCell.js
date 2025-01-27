import React from 'react'

function BingoCell ({ text }) {
  const isFree = text === 'FREE'
  return <td className={`bingo-cell ${isFree ? 'free-cell' : ''}`}>{text}</td>
}

export default BingoCell
