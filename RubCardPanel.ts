/** 
 * 工作请联系
 * @author lyq.android@foxmail.com
 */	
namespace game
{
	const SCENE_WIDTH = 1334;
	const SCENE_HEIGHT = 750;
	
	const POKER_WIDTH = 368;
	const POKER_HEIGHT = 500;

	const MAX_X = SCENE_WIDTH - 100;
	const MIN_X = POKER_WIDTH + 100;
	const MAX_Y = SCENE_HEIGHT - 50;
	const MIN_Y = POKER_HEIGHT + 50;
	
	/**   阻尼，改变此值调整触摸扑克的移动反馈    */
	const DUMP = 0.3;
	
	/** 搓牌交互界面 */
	export class RubCardPanel extends EUIComponent
	{
		private pokerBmpArray: egret.Bitmap[];
		
		// 记录最后触摸的点
		private _lastTouchPoint: { x, y };

		/** @param pokers  扑克资源，不能少于两张 */
		constructor(pokers: string[])
		{
			super();
			this.initCards(pokers);
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
		// 创建高清扑克图片
		private createCardById(id: string): egret.Bitmap
		{
			let poker = new egret.Bitmap();
			poker.texture = RES.getRes(id);
			// poker.width = POKER_WIDTH;
			// poker.height = POKER_HEIGHT;
			poker.touchEnabled = true;
			return poker;
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
	
		// 界面完全显示时
		protected onShow(): void
		{
			super.onShow();
			
			// 设置为全屏
			this.width = Const.SCENT_WIDTH;
			this.height = Const.SCENT_HEIGHT;
			
			// 找到中心坐标
			let centerX = ((this.width - POKER_WIDTH) >> 1) + (POKER_WIDTH >> 1);
			let centerY = ((this.height - POKER_HEIGHT) >> 1) + POKER_HEIGHT;
			
			
			// Please don't modify codes here,remember targets length & rotations length have to be equal.
			let size = this.pokerBmpArray.length - 1;
			this.loopTargets((v, i) =>
			{
				// 图片的锚点设置在底部中心，围绕该点旋转
				v.anchorOffsetX = POKER_WIDTH >> 1;
				v.anchorOffsetY = POKER_HEIGHT;
				// 稍微旋转一点
				v.rotation = i * 3;
				v.x = centerX;
				v.y = centerY;
			});
		}
		
		/** 播放预设动画 */
		private playShowAnim(): void
		{
			let self = this;

			let targets = self.pokerBmpArray;
			// fill targets
			self.loopTargets(function (v, i) { v.touchEnabled = false });

			// delay to close this panle function
			let closePanel = () =>
			{
// 				PopupManager.dismissCurrentPopupPanel();
// 				game.AppFacade.getInstance().sendNotification(game.COP_RUB_CARD_FINISH, this._pokers);
			};

			// resetAnimation complete function
			let completeFunc = function () 
			{ 
				egret.setTimeout(closePanel, self, 1000);
// 				game.AnsycTaskPool.startAnsycTaskGameScene(closePanel, self, 1000); 
			}

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
			egret.setTimeout(resetAnimation, self, 500);
// 			game.AnsycTaskPool.startAnsycTaskGameScene(resetAnimation, self, 500);
		}
		
		/**
		 * 触摸开始，记录触摸点 _lastTouchPoint
		 * 禁用其他图片的 touchEnabled 防止失去焦点
		 */
		private touchBegin(evt: egret.TouchEvent): void
		{
			this.loopTargets(function (v, i) { v.touchEnabled = evt.target == v });
			this._lastTouchPoint = { x: evt.localX, y: evt.localY };
		}
		
		/**
		 * 开始滑动手指
		 * 计算此时 触摸点与上个触摸点的差距 dx dy
		 * 在这里限制移动的边距 MAX_X...
		 */ 
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
			
				// 设置最终坐标
				target.x = laterX;
				target.y = laterY;
			}
		}
		
		/** evt >> 触摸结束，手抬起 */
		private touchEnd(evt: egret.TouchEvent): void
		{
			// 将最后触摸点清除
			this._lastTouchPoint = null;
			// 设置所有图片为可点击
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
}
