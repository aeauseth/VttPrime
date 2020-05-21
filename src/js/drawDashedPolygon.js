// REF: https://stackoverflow.com/questions/49977513/how-to-draw-dashed-line-across-the-rectangle-in-pixi-js-and-angular
PIXI.Graphics.prototype.drawDashedPolygon = function (polygons, x, y, rotation, dash, gap, offsetPercentage) {
	var i;
	var p1;
	var p2;
	var dashLeft = 0;
	var gapLeft = 0;
	if (offsetPercentage > 0) {
		var progressOffset = (dash + gap) * offsetPercentage;
		if (progressOffset < dash) dashLeft = dash - progressOffset;
		else gapLeft = gap - (progressOffset - dash);
	}
	let rotatedPolygons = [];
	for (i = 0; i < polygons.length; i++) {
		let p = { x: polygons[i].x, y: polygons[i].y };
		let cosAngle = Math.cos(rotation);
		let sinAngle = Math.sin(rotation);
		let dx = p.x;
		let dy = p.y;
		p.x = (dx * cosAngle - dy * sinAngle);
		p.y = (dx * sinAngle + dy * cosAngle);
		rotatedPolygons.push(p);
	}
	for (i = 0; i < rotatedPolygons.length; i++) {
		p1 = rotatedPolygons[i];
		if (i == rotatedPolygons.length - 1) p2 = rotatedPolygons[0];
		else p2 = rotatedPolygons[i + 1];
		let dx = p2.x - p1.x;
		let dy = p2.y - p1.y;
		let len = Math.sqrt(dx * dx + dy * dy);
		let normal = { x: dx / len, y: dy / len };
		let progressOnLine = 0;
		this.moveTo(x + p1.x + gapLeft * normal.x, y + p1.y + gapLeft * normal.y);
		while (progressOnLine <= len) {
			progressOnLine += gapLeft;
			if (dashLeft > 0) progressOnLine += dashLeft;
			else progressOnLine += dash;
			if (progressOnLine > len) {
				dashLeft = progressOnLine - len;
				progressOnLine = len;
			} else {
				dashLeft = 0;
			}
			this.lineTo(x + p1.x + progressOnLine * normal.x, y + p1.y + progressOnLine * normal.y);
			progressOnLine += gap;
			if (progressOnLine > len && dashLeft == 0) {
				gapLeft = progressOnLine - len;
				//console.log(progressOnLine, len, gap);
			} else {
				gapLeft = 0;
				this.moveTo(x + p1.x + progressOnLine * normal.x, y + p1.y + progressOnLine * normal.y);
			}
		}
	}
}