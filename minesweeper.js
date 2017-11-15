(function (window, document) {

	'use strict';

	const minesweeperTmpl = function () {

		const template = `

			<div class="minesweeper-controls">
				<br><br>
				<p>SETTINGS</p>
				<button type="button" class="controls-level" data-level="0">easy</button>
				<button type="button" class="controls-level" data-level="1">medium</button>
				<button type="button" class="controls-level"  data-level="2">hard</button>
				<br><br>
				<button type="button" class="expand-toggle">settings</button>
			</div>

			<div class="minesweeper-status">
				<button type="button" class="reset">reset</button>
				<div class="flagged">Hover item and press space to flag item</div>
				<div class="status"></div>
			</div>

			<div class="minesweeper-board"></div>

		`;

		return template;

	}

	class Item {

		constructor (game, row, col) {

			const item = this;

			const node = document.createElement('div');

			node.classList.add('minesweeper-item');

			node.setAttribute('style', 'flex-basis: '+(100/game.boardSize[0])+'%;');

			node.innerHTML = 'O';

			node.addEventListener('click', () => {
				item.clear(true);
			});

			node.addEventListener('mouseover', () => {
				game.currentItem = item;
			});

			item.isHovered 	= false;

			item.node 		= node;

			item.row 		= row;

			item.col 		= col;

			item.isMine 	= game.mineMap.indexOf(row+','+col) > -1;

			item.game 		= game;

		}

		forEachNeighbour (callback) {

			const item = this;

			const neighbours = [
				[0,-1], 	// before
				[0,1], 		// after
				[-1,-1], 	// above before
				[-1,0], 	// above
				[-1,1], 	// above after
				[1,-1], 	// below before
				[1,0], 		// below
				[1,1], 		// below after
			];

			neighbours.forEach((neighbour) => {

				const row = item.row+neighbour[0];
				const col = item.col+neighbour[1];

				if (item.game.board[row] && item.game.board[row][col]) {

					callback(item.game.board[row][col]);

				}

			});

		}

		getNumber () {

			let number = 0;

			this.forEachNeighbour((neighbour) => {
				if (neighbour.isMine) {
					number++;
				}
			});

			return number;
		}

		flag () {

			const item = this;
			const game = item.game;

			if (!item.isCleared && item.game.state.isOn) {

				if (item.isFlagged) {

					game.state.flagged 	= game.state.flagged-1;
					item.isFlagged 		= false;

					item.node.classList.remove('-flagged');

				} else {

					game.state.flagged 	= game.state.flagged+1;
					item.isFlagged 		= true;

					item.node.classList.add('-flagged');

				}

				game.render();

			}

		}

		clear (clicked) {

			const item = this;

			if (clicked && !item.game.state.isOn) {
				item.game.start();
			}

			if (item.isMine && !item.isFlagged) {

				item.isCleared = true;
				item.node.innerHTML = 'X';
				item.node.classList.add('-cleared', '-exploded');

				if (clicked) {
					item.game.state.isLost = true;
					item.game.render();
				}

			} else if (!item.isCleared && !item.isFlagged) {

				const board 	= item.game.board;
				const number 	= item.getNumber();
				const row 		= item.row;
				const col 		= item.col;

				if ('number' === typeof row && 'number' === typeof col) {
					if (board[row] && board[row][col]) {

						item.node.classList.add('-cleared');
						item.isCleared = true;
						item.game.state.cleared = item.game.state.cleared++;

						if (number > 0) {
							item.node.innerHTML = number;
							item.node.classList.add('-border');
						} else {

							setTimeout(() => {
								item.forEachNeighbour((neighbour) => {
									neighbour.clear(false);
								});
							}, 20);
							

						}

						item.game.render();

					}
				}
			}
		}

	}

	class Game {

		constructor (wrapperNode) {

			const game = this;

			const boardSizes = {
				0: [10, 10],
				1: [20, 20],
				2: [30, 30]
			};

			const minesAmount = {
				0: 10,
				1: 50,
				2: 100
			};

			game.state = {};

			game.prevState = {};

			game.node = {
				board: 		wrapperNode.querySelector('.minesweeper-board'),
				status: 	wrapperNode.querySelector('.minesweeper-status'),
				controls: 	wrapperNode.querySelector('.minesweeper-controls')
			};

			game.level 			= 1;
			game.boardMap 		= [];
			game.boardSize 		= boardSizes[game.level];
			game.minesAmount 	= minesAmount[game.level];

			// Map of board coordinates.
			for (let rowIndex = 0; rowIndex < game.boardSize[1]; rowIndex++) {
				for (let colIndex = 0; colIndex < game.boardSize[0]; colIndex++) {
					game.boardMap.push(rowIndex+','+colIndex);
				}
			}

			game.initStatus();
			game.initControls();
			game.initBoard();

			document.addEventListener('keydown', (event) => {

				switch (event.keyCode) {

					case 32:
						game.currentItem.flag();
						break;

				}

			});
		}

		initBoard (config) {
			
			window.console.log(this);

			const game 					= this;

			config 						= config || {};

			game.board 					= {};
			game.boardArray 			= [];
			game.mineMap 				= [];
			game.currentItem 			= null;
			game.node.board.innerHTML 	= '';

			game.state = {
				flagged: 	0,
				cleared: 	0,
				isOn: 		false,
				isWon: 		false,
				isLost: 	false
			};

			// Map of mine coordinates.
			while (game.mineMap.length < game.minesAmount) {

				const randomIndex = Math.floor((Math.random() * game.boardMap.length));

				if (game.boardMap[randomIndex] && game.mineMap.indexOf(game.boardMap[randomIndex]) === -1) {
					game.mineMap.push(game.boardMap[randomIndex]);
				}
			}

			// Create/append board items.

			game.boardMap.forEach((coordinates) => {

				const rowCol 			= coordinates.split(',');
				const row 				= parseInt(rowCol[0]);	
				const col 				= parseInt(rowCol[1]);
				const item 				= new Item(game, row, col);

				game.board[row] 		= game.board[row] || {};
				game.board[row][col] 	= item;

				game.boardArray.push(item);

				game.node.board.append(item.node);

			});

			game.render();

		}

		initControls () {
			this.node.controls.querySelector('.expand-toggle').addEventListener('click', () => {
				this.node.controls.classList.toggle('-expanded');
			});

			this.node.controls.querySelectorAll('.controls-level').forEach((node) => {
				node.addEventListener('click', () => {

					const level = parseInt(node.dataset.level);

					if (typeof level === 'number') {

						this.changeLevel(level);

					}

				});
			});
		}

		initStatus () {
			this.node.status.querySelector('.reset').addEventListener('click', () => {
				this.restart();
			});
		}

		changeLevel (level) {

			const boardSizes = {
				0: [10, 10],
				1: [20, 20],
				2: [30, 30]
			};

			const minesAmount = {
				0: 10,
				1: 50,
				2: 100
			};

			this.boardMap 		= [];
			this.boardSize 		= boardSizes[level];
			this.minesAmount 	= minesAmount[level];

			// Map of board coordinates.
			for (let rowIndex = 0; rowIndex < this.boardSize[1]; rowIndex++) {
				for (let colIndex = 0; colIndex < this.boardSize[0]; colIndex++) {
					this.boardMap.push(rowIndex+','+colIndex);
				}
			}

			this.initBoard({level: level});

		}

		forEachItem (callback) {
			this.boardArray.forEach((item) => {
				callback(item);
			});
		}

		forEachMine (callback) {
			this.mineMap.forEach((coordinates) => {

				const rowCol 	= coordinates.split(',');
				const row 		= parseInt(rowCol[0]);
				const col 		= parseInt(rowCol[1]);

				callback(this.board[row][col]);

			});
		}

		selectNode (selector) {
			return this.node.status.querySelector(selector);
		}

		evaluate () {

			let itemsLeft = 0;

			this.forEachItem((item) => {

				if (!item.isMine && !item.isCleared) {
					itemsLeft++;
				}

			});

			if (itemsLeft === 0) {
				this.state.isWon = true;
			}

		}

		hasNewStateValue (property) {
			return this.state[property] !== this.prevState[property];
		}

		render () {

			const game 		= this;

			const state 	= game.state;

			game.evaluate();

			game.selectNode('.status').innerHTML = '';

			if (state.flagged === 0 || game.hasNewStateValue('flagged')) {
				game.selectNode('.flagged').innerHTML = 'Flagged: '+state.flagged+'/'+game.mineMap.length;
			}

			if (game.hasNewStateValue('isOn')) {

			}

			if (game.state.isWon) {
				game.forEachItem((item) => {
					if (!item.isFlagged) {
						item.flag();
					}
				});
				game.state.isOn = false;
				game.selectNode('.status').innerHTML = 'Game Finished!';
			}

			if (game.state.isLost) {
				game.forEachMine((item) => {

					if (item.isFlagged) {
						item.flag();
					}

					if (!item.isCleared) {
						item.clear();
					}

				});
				game.state.isOn = false;
				game.selectNode('.status').innerHTML = 'Game Over!';
			}

			Object.keys(state).forEach((property) => {
				this.prevState[property] = state[property];
			});

		}

		gameOver () {
			
			window.console.log('gameOver');

		}

		restart () {

			this.initBoard();

		}

		start () {

			console.log('startGame');
			this.state.isOn = true;

		}

		timerStop () {}

		resetBoard () {}

		pause () {}

		resume () {}

	}

	document.querySelectorAll('.minesweeper').forEach((board) => {

		board.innerHTML = minesweeperTmpl();

		new Game(board);

	});

}(window || {}, document || {}));