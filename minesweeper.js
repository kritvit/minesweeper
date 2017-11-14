(function (window, document) {

	'use strict';

	var once = false;

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

		clear (clicked) {

			const item = this;

			if (item.isMine && !item.isFlagged) {
				if (clicked) {

					item.game.gameOver();
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
						item.game.cleared = item.game.cleared+1;

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

						item.game.updateCleared();

					}
				}
			}
		}

	}

	class Game {

		constructor (wrapperNode) {

			const game = this;

			const boardSizes = {
				easy: 		[10, 10],
				medium: 	[20, 20],
				hard: 		[30, 30],
			};

			const minesAmount = {
				easy: 		10,
				medium: 	50,
				hard: 		100,
			};

			game.node = {
				board: 		wrapperNode.querySelector('.minesweeper-board'),
				status: 	wrapperNode.querySelector('.minesweeper-status'),
				controls: 	wrapperNode.querySelector('.minesweeper-controls')
			};

			game.level 			= wrapperNode.getAttribute('data-level') || 'easy';
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

				if (32 === event.keyCode) {

					if (game.currentItem.isFlagged) {

						game.flagged = game.flagged-1;
						game.cleared = game.cleared-1;
						game.currentItem.isFlagged = false;
						game.currentItem.node.classList.remove('-flagged');

					} else {

						game.flagged = game.flagged+1;
						game.cleared = game.cleared+1;
						game.currentItem.isFlagged = true;
						game.currentItem.node.classList.add('-flagged');

					}

					game.updateCleared();

					game.node.status.querySelector('.flagged').innerHTML = game.flagged+'/'+game.mineMap.length;

				}
			});
		}

		initBoard () {
			
			window.console.log(this);

			const game 					= this;

			game.board 					= {};
			game.mineMap 				= [];
			game.cleared 				= 0;
			game.flagged 				= 0;
			game.currentItem 			= null;
			game.node.board.innerHTML 	= '';

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

				game.node.board.append(item.node);

			});

			game.updateCleared();

		}

		initControls () {
			this.node.controls.querySelector('.expand-toggle').addEventListener('click', () => {
				this.node.controls.classList.toggle('-expanded');
			});
		}

		initStatus () {
			this.node.status.querySelector('.reset').addEventListener('click', () => {
				this.restart();
			});
		}

		updateCleared () {

			this.node.status.querySelector('.cleared').innerHTML = this.cleared+'/'+this.boardMap.length;

		}

		gameOver () {
			
			window.console.log('gameOver');

			this.mineMap.forEach((coordinates) => {

				const rowCol 	= coordinates.split(',');
				const row 		= parseInt(rowCol[0]);
				const col 		= parseInt(rowCol[1]);
				const item 		= this.board[row][col];

				item.node.classList.add('-cleared', '-exploded');
				item.isCleared = true;
				item.node.innerHTML = 'X';

			});

		}

		restart () {

			this.initBoard();

		}

		timerStart () {}

		timerStop () {}

		resetBoard () {}

		pause () {}

		resume () {}

		finished () {}

	}

	document.querySelectorAll('.minesweeper').forEach((board) => {

		new Game(board);

	});

}(window || {}, document || {}));