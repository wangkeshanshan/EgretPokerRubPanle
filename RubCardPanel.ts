	/** 搓牌交互界面 */
	class RubCardPanel extends EUIComponent
	{
		private pokerBmpArray: egret.Bitmap[];

		private _pokers: number[];
		private _lastTouchPoint: { x, y };

		/** 搓牌交互界面 */
		constructor(pokers: number[])
		{
			super();
			this._pokers = pokers;
			this.initCards();
		}

		/**
		 * add poker touch listener
		 */
		protected addListener(): void
		{
			this.loopTargets((v, i) =>
			{
				v.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.touchMove, this);
				v.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.touchBegin, this);
				v.addEventListener(egret.TouchEvent.TOUCH_END, this.touchEnd, this);
				v.addEventListener(egret.TouchEvent.TOUCH_CANCEL, this.touchEnd, this);
			});
		}

		// Easy
		protected removeListener(): void
		{
			this.loopTargets((v, i) =>
			{
				v.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.touchMove, this);
				v.removeEventListener(egret.TouchEvent.TOUCH_BEGIN, this.touchBegin, this);
				v.removeEventListener(egret.TouchEvent.TOUCH_END, this.touchEnd, this);
				v.removeEventListener(egret.TouchEvent.TOUCH_CANCEL, this.touchEnd, this);
			});
		}

		protected onShow(): void
		{
			super.onShow();

			this.width = Const.SCENT_WIDTH;
			this.height = Const.SCENT_HEIGHT;
			let centerX = ((this.width - POKER_WIDTH) >> 1) + (POKER_WIDTH >> 1);
			let centerY = ((this.height - POKER_HEIGHT) >> 1) + POKER_HEIGHT;
			// Please don't modify codes here,remember targets length & rotations length have to be equal.
			let size = this.pokerBmpArray.length - 1;
			this.loopTargets((v, i) =>
			{
				v.anchorOffsetX = POKER_WIDTH >> 1;
				v.anchorOffsetY = POKER_HEIGHT;
				v.rotation = i * 3;
				v.x = centerX;
				v.y = centerY;
			});

		}

		private playShowAnim(): void
		{
			let self = this;

			let targets = self.pokerBmpArray;
			// fill targets
			self.loopTargets(function (v, i) { v.touchEnabled = false });

			// delay to close this panle function
			let closePanel = () =>
			{
				PopupManager.dismissCurrentPopupPanel();
				game.AppFacade.getInstance().sendNotification(game.COP_RUB_CARD_FINISH, this._pokers);
			};

			// resetAnimation complete function
			let completeFunc = function () { game.AnsycTaskPool.startAnsycTaskGameScene(closePanel, self, 1000); }

			// reset poker location animation function
			let resetAnimation = function ()
			{
				// calculate the center location
				let centerX = ((self.width - POKER_WIDTH) >> 1) + (POKER_WIDTH >> 1);
				let centerY = ((self.height - POKER_HEIGHT) >> 1) + POKER_HEIGHT;
				let centerProp = { x: centerX, y: centerY, rotation: 0 };

				let centerIndex = (targets.length - 1) >> 1;

				// single poker reset complete
				let resetCallback = function (index: number)
				{
					// 中间那张不需要设置旋转动画
					if (index == centerIndex)
						return;
					let prop = {
						rotation: 12 * (index - centerIndex)
					};
					console.info('prop rotation = ' + prop.rotation);
					if (index == 0)
						egret.Tween.get(targets[index]).to(prop, 300, egret.Ease.quadIn).call(completeFunc);
					else
						egret.Tween.get(targets[index]).to(prop, 300, egret.Ease.quadIn);
				}

				// loop
				let startAnimFunction = (value: egret.Bitmap, index) =>
				{
					egret.Tween.get(value).to(centerProp, 200).call(resetCallback, self, [index]);
				}
				// start loop
				self.loopTargets(startAnimFunction);
			}

			game.AnsycTaskPool.startAnsycTaskGameScene(resetAnimation, self, 500);
		}


		/** 给 pokerBmpArray 赋予初始值 */
		private initCards(): void
		{
			let self = this;
			self.pokerBmpArray = new Array();

			for (let index = 0; index < self._pokers.length; ++index)
			{
				let bmp = self.createCardById(self._pokers[index]);
				self.pokerBmpArray.push(bmp);
				self.addChild(bmp);
			}
		}

		private createCardById(id: number): egret.Bitmap
		{
			let poker = new egret.Bitmap();
			poker.texture = RES.getRes(BlackJackUtil.getPokerHDResFromPokerId(id));
			// poker.width = POKER_WIDTH;
			// poker.height = POKER_HEIGHT;
			poker.touchEnabled = true;
			return poker;
		}


		private touchMove(evt: egret.TouchEvent): void
		{
			let target = <egret.Bitmap>evt.target;
			if (this._lastTouchPoint != null)
			{
				let dx = evt.localX - this._lastTouchPoint.x;
				let dy = evt.localY - this._lastTouchPoint.y;

				let laterX = target.x + (dx * DUMP);
				let laterY = target.y + (dy * DUMP);

				laterX = laterX > MAX_X ? MAX_X : laterX < MIN_X ? MIN_X : laterX;
				laterY = laterY > MAX_Y ? MAX_Y : laterY < MIN_Y ? MIN_Y : laterY;
				target.x = laterX;
				target.y = laterY;
			}
		}

		private touchBegin(evt: egret.TouchEvent): void
		{
			this.loopTargets(function (v, i) { v.touchEnabled = evt.target == v });
			this._lastTouchPoint = { x: evt.localX, y: evt.localY };
		}
		
		/** evt >> 触摸结束，手抬起 */
		private touchEnd(evt: egret.TouchEvent): void
		{
			// 将最后触摸的点清除
			this._lastTouchPoint = null;
			// 设置为可点击
			this.loopTargets(function (v, i) { v.touchEnabled = true });

			/** 翻到倒数第二张就可以播放动画了 */
			// WARNING pokerBmpArray length always larger than 1
			if (evt.target === this.pokerBmpArray[1])
			{
				this.playShowAnim();
			}
		}
		
		/** 循环pokerBmpArray */
		private loopTargets(loopFunction: (value: egret.Bitmap, index: number) => void)
		{
			this.pokerBmpArray.forEach(loopFunction, this);
		}
	}
