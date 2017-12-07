namespace game
{

	export interface IComponent
	{
		release(): void;
	}

	export abstract class EUIComponent extends eui.Component implements IComponent
	{

		protected abstract addListener(): void;
		protected abstract removeListener(): void;

		protected isLoadComplete: boolean = false;
		protected isAddedToStage: boolean = false;

		constructor()
		{
			super();
			this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddedToStage, this);
			this.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.onHide, this);
			this.addEventListener(eui.UIEvent.COMPLETE, this.onSkinLoadComplete, this);
		}

		protected onSkinLoadComplete(): void
		{
			this.isLoadComplete = true;
			this.preparShow();
		}

		protected onAddedToStage(): void
		{
			this.isAddedToStage = true;
			if (!this.skinName)
			{
				this.isLoadComplete = true;
			}

			this.preparShow();
		}

		private preparShow(): void
		{
			if (this.isLoadComplete && this.isAddedToStage)
			{
				this.onShow();
			}
		}

		/**
		 * 显示
		 */
		protected onShow(event?: egret.Event): void
		{
			this.addListener();
		}

		protected onHide(event?: egret.Event): void
		{
			this.removeListener();
			this.release();
		}

		/**
		 * 释放资源
		 */
		public release(): void
		{
			console.debug('release ' + this.hashCode);
			this.removeEventListener(egret.Event.ADDED_TO_STAGE, this.onShow, this);
			this.removeEventListener(egret.Event.REMOVED_FROM_STAGE, this.onHide, this);
			this.removeChildren();
			if (this.parent)
			{
				this.parent.removeChild(this);
			}
		}


		protected addView(view: egret.DisplayObject): void
		{
			if (view != null)
				this.addChild(view);
		}
		protected removeView(view: egret.DisplayObject): void
		{
			if (view && this.contains(view))
			{
				this.removeChild(view);
			}
		}
	}
}
