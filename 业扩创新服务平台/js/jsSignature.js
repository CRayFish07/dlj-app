/**  
	 * 功能：签名canvas面板初始化,为WritingPad.js手写面板js服务。  
	 */

	(function(window, document, jQuery) {
		'use strict';

		// 获取绘制屏幕的规则间隔  
		window.requestAnimFrame = (function(callback) {
			return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimaitonFrame ||
				function(callback) {
					window.setTimeout(callback, 1000 / 60);
				};
		})();

		/*  
		 * 插件构造函数  
		 */

		var pluginName = 'jqSignature',
			defaults = {
				lineColor: '#222222',
				lineWidth: 1,
				border: '1px dashed #CCFF99',
				background: '#FFFFFF',
				width: 900,
				height: 200,
				autoFit: false
			},
			canvasFixture = '<canvas></canvas>';

		function Signature(element, options) {
			// DOM元素/对象  
			this.element = element;
			this.jQueryelement = jQuery(this.element);
			this.canvas = false;
			this.jQuerycanvas = false;
			this.ctx = false;
			// Drawing state  
			this.drawing = false;
			this.currentPos = {
				x: 0,
				y: 0
			};
			this.lastPos = this.currentPos;
			// 确定插件的设置  
			this._data = this.jQueryelement.data();
			this.settings = jQuery.extend({}, defaults, options, this._data);
			// 初始化插件  
			this.init();
		}

		Signature.prototype = {
			// 初始化签名画布  
			init: function() {
				// 设置画布  
				this.jQuerycanvas = jQuery(canvasFixture).appendTo(this.jQueryelement);
				this.jQuerycanvas.attr({
					width: this.settings.width,
					height: this.settings.height
				});
				this.jQuerycanvas.css({
					boxSizing: 'border-box',
					width: this.settings.width + 'px',
					height: this.settings.height + 'px',
					border: this.settings.border,
					background: this.settings.background,
					cursor: 'crosshair'
				});
				//将画布安装到父宽  
				if(this.settings.autoFit === true) {
					this._resizeCanvas();
				}
				this.canvas = this.jQuerycanvas[0];
				this._resetCanvas();
				//设置鼠标事件  
				this.jQuerycanvas.on('mousedown touchstart', jQuery.proxy(function(e) {
					this.drawing = true;
					this.lastPos = this.currentPos = this._getPosition(e);
				}, this));
				this.jQuerycanvas.on('mousemove touchmove', jQuery.proxy(function(e) {
					this.currentPos = this._getPosition(e);
				}, this));
				this.jQuerycanvas.on('mouseup touchend', jQuery.proxy(function(e) {
					this.drawing = false;
					// 触发更改事件  
					var changedEvent = jQuery.Event('jq.signature.changed');
					this.jQueryelement.trigger(changedEvent);
				}, this));
				// 触摸画布时防止文件滚动  
				jQuery(document).on('touchstart touchmove touchend', jQuery.proxy(function(e) {
					if(e.target === this.canvas) {
						e.preventDefault();
					}
				}, this));
				// 开始画  
				var that = this;
				(function drawLoop() {
					window.requestAnimFrame(drawLoop);
					that._renderCanvas();
				})();
			},
			//重置的画布  
			clearCanvas: function() {
				this.canvas.width = this.canvas.width;
				this._resetCanvas();
			},
			// 把画布的内容为Base64编码数据的URL  
			getDataURL: function() {
				return this.canvas.toDataURL();
			},

			reLoadData: function() {
				this.jQuerycanvas.remove();
				this._data = this.jQueryelement.data();
				this.init();
			},
			// 获取鼠标/触摸的位置  
			_getPosition: function(event) {
				var xPos, yPos, rect;
				rect = this.canvas.getBoundingClientRect();
				event = event.originalEvent;
				// 触摸事件  
				if(event.type.indexOf('touch') !== -1) { // event.constructor === TouchEvent  
					xPos = event.touches[0].clientX - rect.left;
					yPos = event.touches[0].clientY - rect.top;
				}
				// 鼠标事件  
				else {
					xPos = event.clientX - rect.left;
					yPos = event.clientY - rect.top;
				}
				return {
					x: xPos,
					y: yPos
				};
			},
			// 将签名渲染到画布  
			_renderCanvas: function() {
				if(this.drawing) {
					this.ctx.moveTo(this.lastPos.x, this.lastPos.y);
					this.ctx.lineTo(this.currentPos.x, this.currentPos.y);
					this.ctx.stroke();
					this.lastPos = this.currentPos;
				}
			},
			//重置画布上下文  
			_resetCanvas: function() {
				this.ctx = this.canvas.getContext("2d");
				this.ctx.strokeStyle = this.settings.lineColor;
				this.ctx.lineWidth = this.settings.lineWidth;
			},
			// 调整画布元素的大小  
			_resizeCanvas: function() {
				var width = this.jQueryelement.outerWidth();
				this.jQuerycanvas.attr('width', width);
				this.jQuerycanvas.css('width', width + 'px');
			}
		};

		/*  
		 * 插件和初始化  
		 */

		jQuery.fn[pluginName] = function(options) {
			var args = arguments;
			if(options === undefined || typeof options === 'object') {
				return this.each(function() {
					if(!jQuery.data(this, 'plugin_' + pluginName)) {
						jQuery.data(this, 'plugin_' + pluginName, new Signature(this, options));
					}
				});
			} else if(typeof options === 'string' && options[0] !== '_' && options !== 'init') {
				var returns;
				this.each(function() {
					var instance = jQuery.data(this, 'plugin_' + pluginName);
					if(instance instanceof Signature && typeof instance[options] === 'function') {
						var myArr = Array.prototype.slice.call(args, 1);
						returns = instance[options].apply(instance, myArr);
					}
					if(options === 'destroy') {
						jQuery.data(this, 'plugin_' + pluginName, null);
					}
				});
				return returns !== undefined ? returns : this;
			}
		};

	})(window, document, jQuery);