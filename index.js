
import csp from 'medium'
import R from 'ramda'
import React from 'react'
import cx from 'classnames'

// CONSTANTS

var KEYS = {
  SPACE: 32,
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  P: 80
}

var BLOCK_SIZE = 20
var PIECE_SIZE = BLOCK_SIZE * 4
var GAME_WIDTH = BLOCK_SIZE * 10
var STEP_SIZE = BLOCK_SIZE 

var SHAPES = [
  [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
  [[0, 0, 0, 0], [0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]],
  [[0, 0, 0, 0], [0, 1, 0, 0], [1, 1, 1, 0], [0, 0, 0, 0]],
  [[0, 0, 0, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 1, 1, 0]],
  [[0, 0, 0, 0], [0, 0, 1, 0], [0, 1, 1, 0], [0, 1, 0, 0]],
  [[0, 0, 0, 0], [0, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 0]]
]

var EDGES = {
  LEFT: R.zip(R.repeat(-1, 25), R.range(0, 24)),
  RIGHT: R.zip(R.repeat(10, 25), R.range(0, 24)),
  BOTTOM: R.zip(R.range(0, 24), R.repeat(25, 25))
}

// CHANNELS

var { go, chan, take, put } = csp

var channels = {
  keys: chan(),
  pieceMovement: chan(),
  gameCmds: chan()
}

// KEYBOARD EVENTS

go(async function() {
  document.addEventListener('keydown', (e) => put(channels.keys, e.keyCode))
  while (true) {
    var code = await take(channels.keys)
    switch (code) {
      case KEYS.SPACE:
        put(channels.pieceMovement, 'doubleDown')
        break;
      case KEYS.UP:
        put(channels.pieceMovement, 'rotate');
        break;
      case KEYS.LEFT:
        put(channels.pieceMovement, 'left');
        break;
      case KEYS.RIGHT:
        put(channels.pieceMovement, 'right')
        break;
      case KEYS.DOWN:
        put(channels.pieceMovement, 'down');
        break;
      case KEYS.P:
        put(channels.gameCmds, { type: 'togglePause' })
    }
  }
})

// GAME / TIMER

go(async function() {

  var timer = {
    interval: null,
    pause() {
      if (!timer.interval) return
      clearInterval(timer.interval)
      timer.interval = null
    },
    start() {
      if (timer.interval) return
      timer.interval = setInterval(timer.tick, 500)
    },
    toggle() {
      timer.interval ? timer.pause() : timer.start()
    },
    tick() {
      put(channels.pieceMovement, 'down')
    }
  }

  while (true) {
    var cmd = await take(channels.gameCmds)
    switch (cmd.type) {
      case 'togglePause':
        timer.toggle()
        break
      case 'restart':
        React.render(<Game />, document.getElementById('container'))
        timer.start()
        break
    }
  }
})

// HELPER FUNCTIONS

var sample = (arr) => arr[Math.floor(Math.random() * arr.length )]
var getRandomShape = R.partial(sample, SHAPES)

var pieceUtil = {

  create(data) {
    var initialCoords = [ 0, 0 ]
    var piece = { data, coords: initialCoords }
    piece.grid = pieceUtil.calculateGrid(piece)
    return piece
  },

  calculateGrid(piece) {
    return (
      piece.data.reduce((grid, row, rowI) => {
        return grid.concat(
          row.reduce((rowGrid, block, colI) => {
            if (!block) return rowGrid
            return rowGrid.concat([ [ piece.coords[0] + colI, piece.coords[1] + rowI ] ])
          }, [])
        )
      }, [])
    )
  },

  rotate(piece, board) {

    var newData = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]
    for (var j = 0; j < 4; j++){
      for (var i = 0; i < 4; i++) {
        newData[i][j] = piece.data[4 - j - 1][i];
      }
    }

    var withData = R.merge(piece, { data: newData })
    var withGrid = R.merge(withData, { grid: pieceUtil.calculateGrid(withData) })

    if (
      pieceUtil.touching(withGrid, EDGES.LEFT, [ 0, 0 ]) ||
      pieceUtil.touching(withGrid, EDGES.RIGHT, [ 0, 0 ]) ||
      pieceUtil.touching(withGrid, EDGES.BOTTOM, [ 0, 0 ]) ||
      pieceUtil.touching(withGrid, board, [ 0, 0 ])
    ) return piece
        
    return withGrid
  },

  reposition(piece, delta) {
    return R.merge(
      piece, 
      { 
        coords: [ piece.coords[0] + delta[0], piece.coords[1] + delta[1] ],
        grid: piece.grid.map((g) => [ g[0] + delta[0], g[1] + delta[1] ]) 
      }
    )
  },

  touching(piece, grid, delta) {
    var touching = false
    for (var i = 0; i < grid.length; i++) {
      var gridCoord = grid[i]
      for (var k = 0; k < piece.grid.length; k++) {
        var pieceCoord = piece.grid[k]
        if (pieceCoord[0] + delta[0] === gridCoord[0] && pieceCoord[1] + delta[1] === gridCoord[1]) {
          touching = true
          break
        }
      }
      if (touching) break
    }
    return touching
  }
}

pieceUtil.createRandom = R.compose(pieceUtil.create, getRandomShape)

// COMPONENTS

var Game = React.createClass({

  getInitialState() {
    return {
      piece: null,
      previewPiece: null,
      board: [],
      score: 0
    }
  },

  clearRow(rowI) {
    this.setState({
      board: this.state.board
        .filter((b) => b[1] != rowI)
        .map((b) => [ b[0], b[1] + 1 ])
    })
  },

  checkForCompleteLine() {
    var justDones = R.filter((n) => n === 10)
    var counts = R.countBy(R.last)(this.state.board)
    var rows = R.keys(counts)
    var colCount = R.values(counts)
    var toRemove = colCount.reduce((memo, dc, i) => {
      if (dc !== 10) return memo
      return memo.concat(rows[i])
    }, [])
    toRemove.reverse().forEach((i) => {
      this.clearRow(i)
      this.incScore()
    })
  },

  addToBoard() {
    this.setState({
      board: this.state.board.concat(this.state.piece.grid)
    })
  },

  incScore() {
    this.setState({
      score: this.state.score + 1
    })
  },

  rotate() {
    var rotated = pieceUtil.rotate(this.state.piece, this.state.board)
    this.setState({ piece: rotated })
  },

  move(delta) {
    var newPiece = pieceUtil.reposition(this.state.piece, delta)
    this.setState({ piece: newPiece }) 
  },

  left() {
    if (
      pieceUtil.touching(this.state.piece, EDGES.LEFT, [ -1, 0 ]) ||
      pieceUtil.touching(this.state.piece, this.state.board, [ -1, 0 ])
    ) return
    this.move([ -1, 0 ])
  },

  right() {
    if (
      pieceUtil.touching(this.state.piece, EDGES.RIGHT, [ 1, 0 ]) ||
      pieceUtil.touching(this.state.piece, this.state.board, [ 1, 0 ])
    ) return
    this.move([ 1, 0 ])
  },

  down() {
    if (
      pieceUtil.touching(this.state.piece, EDGES.BOTTOM, [ 0, 1 ]) ||
      pieceUtil.touching(this.state.piece, this.state.board, [ 0, 1 ])
    ) {
      this.addToBoard()
      this.checkForCompleteLine()
      this.nextPiece()
    } else this.move([ 0, 1 ])
  },

  doubleDown() {
    this.down()
  },

  nextPiece() {
    this.setState({
      piece: this.state.previewPiece || pieceUtil.createRandom(),
      previewPiece: R.merge(pieceUtil.createRandom(), { coords: [ 0, 0 ] })
    })
  },

  componentWillMount() {
    this.nextPiece()
    go(async function() {
      while (true) {
        var movement = await take(channels.pieceMovement)
        this[movement]()
      }
    }.bind(this))
  },

  componentWillReceiveProps() {
    this.setState(this.getInitialState())
    this.nextPiece()
  },

  render() {
    return (
      <div id="game">
        <Preview piece={this.state.previewPiece} score={this.state.score} />
        <Board pieces={this.state.pieces} board={this.state.board} piece={this.state.piece} />
      </div>
    )
  }
})

var Preview = React.createClass({
  restart() {
    put(channels.gameCmds, { type: 'restart' })
  },
  render() {
    return (
      <div id="preview">
        <p>
          <button onClick={this.restart}>Restart</button>
        </p>
        <p>
          Rows completed - { this.props.score }
        </p>
        <p>Next Piece: </p>
        <div id="preview-piece">
          <Piece piece={this.props.piece} />
        </div>
      </div>
    )
  }
})

var Piece = React.createClass({
  render() {
    var p = this.props.piece
    var data = R.flatten(p.data)
    return (
      <div 
        style={{ 
          top: p.coords[1] * BLOCK_SIZE,
          left: p.coords[0] * BLOCK_SIZE
        }}
        className="piece">
        {
          data.map((d) => {
            return <div className={cx({ block: true, filled: !!d })}></div>
          })
        }
      </div>
    )
  }
})

var Board = React.createClass({
  render() {
    return (
      <div id="board">
        <Piece piece={this.props.piece} />
        {
          this.props.board.map((b) => {
            return (
              <div 
                style={{
                  left: b[0] * BLOCK_SIZE,
                  top: b[1] * BLOCK_SIZE
                }}
                className="block filled static"></div>
            )
          })
        }
      </div>
    )
  }
})

// initial run
put(channels.gameCmds, { type: 'restart' })
