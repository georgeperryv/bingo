import React from 'react'

function BingoCell ({ text }) {
  const isFree = text === 'FREE'
  return <div className={`bingo-cell ${isFree ? 'free-cell' : ''}`}>{text}</div>
}

export default BingoCell
