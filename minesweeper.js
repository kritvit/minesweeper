(function (window, document) {

	'use strict';

	function minesweeperTmpl () {

		// https://unicode.org/emoji/charts/full-emoji-list.html
		// https://www.fileformat.info/info/unicode/char/1F973/index.htm

		const template = `

			<div class="minesweeper-controls">
				<br><br>
				<p>- SETTINGS -</p>
				<button type="button" class="controls-level -is-current" data-level="easy">easy</button>
				<button type="button" class="controls-level" data-level="medium">medium</button>
				<button type="button" class="controls-level"  data-level="hard">hard</button>
				<br><br>
				<p>- INFO -</p>
				<p>
					Start game by clicking on a square.
				</p>
				<p>
					Hover item and press space to flag item.
				</p>
				<p>
					"space"
					<br>
					flag hovered item
				</p>
				<p>
					"R"<br>
					reset game
				</p>
				<p>
					"C"<br>
					clear hovered item
				</p>
				<br><br>
				<button type="button" class="minesweeper-expand-toggle" title="Configure Game">Settings / Info &#x2699;</button>
			</div>

			<div class="minesweeper-status">
				<button type="button" class="minesweeper-reset" title="Reset Game">&#x267b;</button>
				<div class="item">&#x1f6a9; <span class="marked"></span></div>
				<div class="item">Cleared: <span class="progress"></span></div>
				<div class="item"><div class="status"></div></div>
			</div>

			<div class="minesweeper-board"></div>

		`;

		return template;

	}

	class Item {

		constructor (game, props) {

			const node = document.createElement('div');

			this.node = node;

			this.props = props;

			this.game = game;

			this.state = game.state;

			node.classList.add('minesweeper-item');

			node.setAttribute('style', 'flex-basis: '+(100/this.state.minesweeperEngine.cols)+'%;');

			node.addEventListener('click', () => {

				this.state.minesweeperEngine = this.state.minesweeperEngine.clear(props.id);

				this.update();

			});

			node.addEventListener('mouseover', () => {
				this.state.currentItem = this;
			});

		}

		update () {

			this.state.minesweeperEngine.items.forEach(item => {

				const node = this.state.items[item.id].node;

				this.game.toggleStateClassname(node, item.status);

				switch (item.status) {

				case 'cleared':

					node.innerHTML = item.border || '';
					break;

				case 'marked':

					node.innerHTML = '&#x1f6a9;';
					break;

				case 'missmarked':

					node.innerHTML = '&#x1f6ab;';
					break;

				case 'triggered':

					node.innerHTML = '&#x1f4a5;';
					break;

				case 'exposed':

					node.innerHTML = '&#x1f4a3;';
					break;

				default:

					node.innerHTML = '';

				}

			});

			this.game.render();

		}

		flag () {

			this.state.minesweeperEngine = this.state.minesweeperEngine.mark(this.props.id);

			this.update();

		}

	}

	class Game {

		constructor (wrapperNode) {

			this.state = {
				currentItem: null,
				minesweeperEngine: window.minesweeperEngine(),
				level: 'easy',
				levels: {
					easy: 	[10, 10, 10],
					medium: [20, 20, 50],
					hard: 	[30, 30, 100]
				},
				items: {},
				classnames: []
			};

			this.node = {
				board: 		wrapperNode.querySelector('.minesweeper-board'),
				status: 	wrapperNode.querySelector('.minesweeper-status'),
				controls: 	wrapperNode.querySelector('.minesweeper-controls')
			};

			this.initControls();
			this.initBoard();

		}

		initBoard () {

			this.node.board.innerHTML = '';
			this.state.items = [];
			this.state.currentItem = null;

			this.state.minesweeperEngine.eachItem(item => {

				const boardItem = new Item(this, item);

				if (!this.state.items[item.id]) {

					this.state.items[item.id] = boardItem;

				}

				this.node.board.append(boardItem.node);

			});

			this.render();

		}

		initControls () {


			document.querySelector('.minesweeper').addEventListener('click', (event) => {

				const target = event.target.classList;
				const controls = this.node.controls.classList;

				if (target.contains('minesweeper-item')) {

					controls.remove('-expanded');

				}

				if (target.contains('minesweeper-expand-toggle')) {

					controls.toggle('-expanded');

				}

				if (target.contains('minesweeper-reset')) {

					this.reset();

				}

			});

			this.node.controls.querySelectorAll('.controls-level').forEach((node) => {

				node.addEventListener('click', () => {

					const level = node.dataset.level;

					this.reset(level);

				});

			});

			document.addEventListener('keydown', (event) => {

				switch (event.keyCode) {

					case 32: // space
						this.state.currentItem.flag();
						break;
					case 67: // c
						this.state.minesweeperEngine = this.state.minesweeperEngine.clear(this.state.currentItem.props.id);
						this.state.currentItem.update();
						break;
					case 82: // r
						this.reset();
						break;
				}

			});

		}

		toggleStateClassname (item, classname) {

			const newClassname ='-is-'+classname;

			if (classname !== '' && !this.state.classnames.includes(classname)) {

				this.state.classnames.push(newClassname);

			}

			this.state.classnames.forEach(oldClassnames => {

				if (oldClassnames !== newClassname) {

					item.classList.remove(oldClassnames);

				}

			});

			if (classname !== '') {

				item.classList.add(newClassname);

			}

		}

		reset (level) {

			if (level) {

				if (this.state.levels[level]) {

					this.state.level = level;

					this.state.minesweeperEngine = this.state.minesweeperEngine.create(this.state.levels[level]);

				}

			} else {

				this.state.minesweeperEngine = this.state.minesweeperEngine.reset();

			}

			this.initBoard();

		}

		render () {

			const gameState = this.state.minesweeperEngine;

			const prevLevel = document.querySelector('.controls-level.-is-current');

			const currentLevel = document.querySelector('.controls-level[data-level="'+this.state.level+'"]');

			if (prevLevel) {
				prevLevel.classList.remove('-is-current');
			}

			if (currentLevel) {
				currentLevel.classList.add('-is-current');
			}

			document.querySelector('.marked').innerHTML 	= gameState.markersUsed+'/'+gameState.markersTotal;

			document.querySelector('.progress').innerHTML 	= gameState.itemsCleared+'/'+gameState.itemsTotal;

			if (gameState.status === 'gameover') {

				document.querySelector('.status').innerHTML = 'Game Over! &#x1f622;';

			} else if (gameState.status === 'completed') {

				document.querySelector('.status').innerHTML = 'Game Completed! &#x1f973; &#x1f389;';

			} else {

				document.querySelector('.status').innerHTML = '&nbsp;';

			}

		}

	}

	document.querySelectorAll('.minesweeper').forEach((board) => {

		board.innerHTML = minesweeperTmpl();

		new Game(board);

	});

}(window || {}, document || {}));