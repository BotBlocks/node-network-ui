"use strict";

function nodeOb(canvas, id, posX, posY){
	this.ID = id;
	this.backColor = '#555555';
	this.fillColor = '#777799';
	this.selColor = '#AAAACC';
	this.canvas = canvas;

	this.buffer = 10;
	this.radIO = 5;
	this.position = { x: posX, y: posY };
	this.width = 200;
	this.height = 25;
	this.minWidth = 200;
	this.minHeight = 2 * this.buffer;
	this.zIndex = 0;
	this.selected = false;

	this.STATES = {0: 'MOVING', 1: 'SCALING', 2: 'NULL', 3: 'WIRE'};
	this.state = 'NULL';

	var rect = this.canvas.getBoundingClientRect();
	this.ctx = canvas.getContext("2d");
	this.ctx.roundRect(this.position.x, this.position.y, this.width, this.height, this.buffer);
	//this.ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

	//Menu stuff
	this.dropDownMenus = {};
	this.textFields = {};
	this.checkBoxes = {};
	this.sliders = {};

	this.lenDropDownMenus = 0;
	this.lenTextFields = 0;
	this.lenCheckBoxes = 0;
	this.lenSliders = 0;
	//End Menu stuff


	//Connection stuff
	this.inputs = {};
	this.inputPoints = {};
	this.inputFields = {};
	this.outputs = {};
	this.outputPoints = {};

	this.scriptFields = {};

	this.activeInputIndex = -1;
	this.activeOutputIndex = -1;

	this.lenInputPoints = 0;
	this.lenOutputPoints = 0;
	this.lenInputs = 0;
	this.lenOutputs = 0;
	//End Connection stuff

	this.prevScale = {"x": this.width, "y": this.height};
	this.prevPosition = { "x": this.position.x, "y": this.position.y};
	this.dragStart = { "x": 0, "y": 0};
	this.dragEnd = { "x": 0, "y": 0};
	this.direction = { "x": 0, "y": 0};
}

nodeOb.prototype.updateSize = function (x, y) {
	this.width = this.prevScale.x + x;
	this.height = this.prevScale.y + y;
	if (this.width < this.minWidth) this.width = this.minWidth;
	if (this.height < this.minHeight) this.height = this.minHeight;
}

nodeOb.prototype.updatePosition = function (x, y) {
	this.position.x = this.prevPosition.x + x;
	this.position.y = this.prevPosition.y + y;
	this.arrangeMenus();
}

nodeOb.prototype.keepLastPosition = function keepLastPosition() {
	this.prevPosition.x = this.position.x;
	this.prevPosition.y = this.position.y;
	this.prevScale.x = this.width;
	this.prevScale.y = this.height;
	this.arrangeMenus();
}

nodeOb.prototype.redrawMe = function redrawMe(x, y, w, h) {
	if (this.selected) this.ctx.fillStyle = this.selColor;
	if (!this.selected) this.ctx.fillStyle = this.fillColor;
	this.ctx.roundRect(x, y, w, h, this.buffer);

	this.ctx.beginPath();
	this.ctx.moveTo(this.position.x, this.position.y + this.buffer + this.buffer / 2);
	this.ctx.lineTo(this.position.x + this.width, this.position.y + this.buffer + this.buffer / 2);
	this.ctx.lineWidth = 2;
	this.ctx.strokeStyle = '#444444';
	this.ctx.stroke();

	this.drawInputPoints();
	this.drawOutputPoints();
	this.arrangeMenus();
}

nodeOb.prototype.getAttrs = function getAttrs() {
	return {
		x: this.position.x,
		y: this.position.y,
		w: this.width,
		h: this.height,
		radIO: this.radIO,
		state: this.state
		}
}

nodeOb.prototype.arrangeMenus = function arrangeMenus() {
	var i = 0;
	for (var key in this.inputFields) {
		if(this.inputFields.hasOwnProperty(key)) {
			this.inputFields[key].style.left = this.buffer + this.position.x + "px";
			this.inputFields[key].style.top = this.position.y + 3 * this.buffer + 2 * this.buffer * i + i * 2 * this.radIO - 12 + "px";
			i++;
		}
	}
	if (this.scriptFields[0] == undefined) return;
	this.scriptFields[0 + ''].style.top = this.position.y + 3 * this.buffer - 12 + "px";
	this.scriptFields[0 + ''].style.left = this.position.x + this.width - 100 + "px";
	this.scriptFields[0 + ''].style.width = 70 + "px";
}

//Graphical Input points are managed here (not real connections).
nodeOb.prototype.addInputPoint = function addInputPoint() {
	this.inputPoints[this.lenInputPoints + ''] = this.lenInputPoints + '';
	this.addInputField();
	this.lenInputPoints++;
	this.minSizeAdjustment();
	this.arrangeMenus();
}

nodeOb.prototype.addInputField = function addInputField() {
	var textIn = document.createElement('input');
	textIn.setAttribute('id', 'input-' + this.ID + '-' + this.lenInputPoints);
	document.body.appendChild(textIn);
	this.inputFields[this.lenInputPoints + ''] = textIn, {'drawFlag': 1} ;
	textIn.style.position = "absolute";
	textIn.value = 0;
	textIn.style.width = 30 + "px";
}

nodeOb.prototype.addScriptField = function addScriptField() {
	var textIn = document.createElement('input');
	textIn.setAttribute('id', 'Script-input-' + this.ID);
	document.body.appendChild(textIn);
	this.scriptFields[0 + ''] = textIn;
	textIn.style.position = "absolute";
	textIn.value = 0;
	textIn.style.width = 110 + "px";
}

//Real connections to other nodes are recorded via this function. Tested as input or output (sourceIO) to the current node. Indeces are also recorded (IOindex).
nodeOb.prototype.addConnection = function addConnection(connectedNode, otherIndex, localIndex, inputOrOutput) {
	if (inputOrOutput) {
		this.inputs[this.lenInputs] = { "node": connectedNode, "otherIndex": otherIndex, "localIndex": localIndex };
		this.lenInputs++;
	} else if (!inputOrOutput) {
		this.outputs[this.lenOutputs] = { "node": connectedNode, "otherIndex": otherIndex, "localIndex": localIndex };
		this.lenOutputs++;
	}
}

nodeOb.prototype.drawInputPoints = function drawInputPoints() {
	var i;
	for (i = 0; i < this.lenInputPoints; i++) {
		this.ctx.circleDraw(this.position.x, this.position.y + 3 * this.buffer + 2 * this.buffer * i + i * 2 * this.radIO, this.radIO);
		this.inputPoints[i + ''] = {"x": this.position.x, "y": this.position.y + 3 * this.buffer + 2 * this.buffer * i + i * 2 * this.radIO};
	}
}

//Graphical Output points are managed here (not real connections).
nodeOb.prototype.addOutputPoint = function addOutputPoint() {
	this.outputPoints[this.lenOutputPoints + ''] = this.lenOutputPoints + '';
	this.lenOutputPoints++;
	this.minSizeAdjustment();
	this.arrangeMenus();
}

nodeOb.prototype.drawOutputPoints = function () {
	var i;
	for (i = 0; i < this.lenOutputPoints; i++) {
		this.ctx.circleDraw(this.position.x + this.width, this.position.y + 3 * this.buffer + 2 * this.buffer * i + i * 2 * this.radIO, this.radIO);
		this.outputPoints[i + ''] = {"x": this.position.x + this.width, "y": this.position.y + 3 * this.buffer + 2 * this.buffer * i + i * 2 * this.radIO};
	}
}

nodeOb.prototype.getIORad = function () {
	return this.radIO;
}

nodeOb.prototype.setState = function (i) {
	this.state = this.STATES[i];
}

nodeOb.prototype.getState = function () {
	return this.state;
}

nodeOb.prototype.setActiveInputIndex = function (i) {
	this.activeInputIndex = i;
}

nodeOb.prototype.setActiveOutputIndex = function (i) {
	this.activeOutputIndex = i;
}

nodeOb.prototype.getActiveInputIndex = function () {
	return this.activeInputIndex;
}

nodeOb.prototype.getActiveOutputIndex = function () {
	return this.activeOutputIndex;
}

nodeOb.prototype.getInputs = function () {
	return this.inputs;
}

nodeOb.prototype.getOutputs = function () {
	return this.outputs;
}

nodeOb.prototype.getLenInputs = function () {
	return this.lenInputs;
}

nodeOb.prototype.getLenOutputs = function () {
	return this.lenOutputs;
}

nodeOb.prototype.setZIndex = function (z) {
	return this.z;
}

nodeOb.prototype.getZIndex = function (z) {
	this.zIndex = z;
}

nodeOb.prototype.setSelected = function (flag) {
	this.selected = flag;
}

nodeOb.prototype.getSelected = function () {
	return this.selected;
}

nodeOb.prototype.minSizeAdjustment = function () {
	var newInHeight = 3 * this.buffer + 2 * this.buffer * this.lenInputPoints + this.lenInputPoints * 2 * this.radIO;
	var newOutHeight = 3 * this.buffer + 2 * this.buffer * this.lenOutputPoints + this.lenOutputPoints * 2 * this.radIO;
	if (newInHeight > newOutHeight) {
		this.height = this.minHeight = newInHeight;
	} else {
		this.height = this.minHeight = newOutHeight;
	}
	this.prevScale.y = this.height;
}

CanvasRenderingContext2D.prototype.circleDraw = function (x, y, r) {
	this.beginPath();
	this.arc(x, y, r, 0, 2 * Math.PI, false);
	this.lineWidth = 2;
	this.strokeStyle = '#444444';
	this.fill();
	this.stroke();
}

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
	if (w < 2 * r) r = w / 2;
	if (h < 2 * r) r = h / 2;
	this.beginPath();
	this.moveTo(x+r, y);
	this.arcTo(x+w, y,   x+w, y+h, r);
	this.arcTo(x+w, y+h, x,   y+h, r);
	this.arcTo(x,   y+h, x,   y,   r);
	this.arcTo(x,   y,   x+w, y,   r);

	this.strokeStyle = '#444444';
	this.lineWidth = 2;
	this.closePath();

	this.fill();
	this.stroke();
	return this;
}
