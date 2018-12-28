import "babel-polyfill";
import "../scss/svgraph.scss";

const
    d = document,
    w = window;

let instance = null;

/**
 * User custom title
 */
class svgraph {
    constructor(opts = {}) {

        this.config = Object.assign({
            data: [[0, 280], [10, 80], [40, 50], [150, 160], [380, 10]],
            // data: [[5, 10], [10, 40], [40, 30], [60, 5], [90, 45], [120, 10], [150, 45], [200, 10]],
            smoothing: 0.2,
            scaled: true,
            xName: 'X',
            yName: 'Y',
            container: null,
        }, opts);

        return this.ini();
    }

    /**
     * Initialization
     */
    ini() {
        if (instance) return instance;
        instance = this;
        // d.addEventListener('mouseover', instance.show);
        // d.addEventListener('click', instance.closeTitle);
        // w.addEventListener('resize', instance.closeTitle);
        // w.addEventListener('scroll', instance.closeTitle);
        // return instance;

        this._margin = 20;
        return this.draw();
    }

    /**
     *
     * @return {svgraph}
     */
    draw() {
        if (!this.config.container) {
            throw new Error('container is not defined');
        }
        this.container =
            typeof this.config.container === 'string'
                ? d.querySelector(this.config.container)
                : this.config.container;

        this.container.innerHTML = this.graphBuild();

        return this;
    }

    /**
     *
     * @return {string}
     */
    graphBuild() {

        this.config.data.sort((a, b) => a[0] - b[0]);

        let data = this.config.data,
            maxX = 0,
            minX = 0,
            maxY = 0,
            margin = 20,
            svg = `<svg class="svgraph svgraph-type-${this.config.type}" width="800" height="400" xmlns="http://www.w3.org/2000/svg">`;

        data.forEach(point => {
            let [x, y] = point;
            x > maxX && (maxX = x);
            y > maxY && (maxY = y);
            !x || x < minX && (minX = x);
        });

        svg += `

<g>
    <text x="${((maxX - minX) / 2) + margin}" y="${margin * 2 + maxY}" text-anchor="middle" opacity="1">
        <tspan>${this.config.xName}</tspan>
    </text>
    <text 
        x="${-(maxY + margin) / 2 + margin}" y="0"
        style="transform: rotate(-90deg);transform-origin: ${margin}px ${margin / 2}px;"
        text-anchor="middle" opacity="1">
        <tspan>${this.config.yName}</tspan>
    </text>
</g>

<g>
    <line class="svgraph-axis" x1="${margin}" x2="${margin}" y1="0" y2="${margin + maxY + .5}" stroke-width="1"/>
    <line class="svgraph-axis" x1="${margin * 2 + maxX}" x2="${margin}" y1="${margin + maxY}" y2="${margin + maxY}" stroke-width="1"/>
</g>
`;


        svg += this.svgPath(maxY);
        svg += `</svg>`;

        return svg;
    }

    /**
     * Position of a control point
     * @param current (array) [x, y]: current point coordinates
     * @param previous (array) [x, y]: previous point coordinates
     * @param next (array) [x, y]: next point coordinates
     * @param reverse (boolean, optional): sets the direction
     * @return (array) [x,y]: a tuple of coordinates
     * see I https://github.com/d3/d3-shape/blob/master/README.md#curves
     * see II https://medium.com/@francoisromain/smooth-a-svg-path-with-cubic-bezier-curves-e37b49d46c74
     */
    controlPoint(current, previous, next, reverse) {

        // When 'current' is the first or last point of the array
        // 'previous' or 'next' don't exist.
        // Replace with 'current'
        let p = previous || current,
            n = next || current,
            lengthX = n[0] - p[0],
            lengthY = n[1] - p[1],
            length = Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)) * this.config.smoothing,
            angle = Math.atan2(lengthY, lengthX) + (reverse ? Math.PI : 0);

        return [current[0] + Math.cos(angle) * length, current[1] + Math.sin(angle) * length]
    }

    /**
     * Create the bezier curve command
     * @param point (array)[x,y]: current point coordinates
     * @param i {int}: index of 'point' in the array 'a'
     * @param a (array) complete array of points coordinates
     * @return {string} 'C x2,y2 x1,y1 x,y': SVG cubic bezier C command
     * see I https://github.com/d3/d3-shape/blob/master/README.md#curves
     * see II https://medium.com/@francoisromain/smooth-a-svg-path-with-cubic-bezier-curves-e37b49d46c74
     */
    bezierCommand(point, i, a) {

        let
            // start control point
            cps = this.controlPoint(a[i - 1], a[i - 2], point),
            // end control point
            cpe = this.controlPoint(point, a[i - 1], a[i + 1], true);

        return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`
    }

    /**
     *
     * @param maxY
     * @return {string}
     */
    svgPath(maxY) {

        let data = this.normalisePoints(maxY),
            points = [],
            graphPath = '';

        data.forEach((point, i) => {
            let [x, y] = point;

            points.push(`
<circle class="svgraph-circle-outer" cx="${x}" cy="${y}" r="3"/>
<circle class="svgraph-circle" cx="${x}" cy="${y}" r="1.5"/>
`);
            graphPath += !i ? `M ${x},${y}` : ` ${this.bezierCommand([x, y], i, data)}`;
        });

        return `<path class="svgraph-path" d="${graphPath}" fill="transparent"/><g>${points.join('')}</g>`;
    }

    /**
     *
     * @param maxY
     * @return {Array}
     */
    normalisePoints(maxY) {
        let arr = [],
            margin = this._margin;
        this.config.data.forEach(point => {
            let [x, y] = point;
            y = margin + maxY - y;
            x += margin;
            arr.push([x, y]);
        });
        return arr;
    }

    /**
     *
     */
    clear() {
        this.container && (this.container.innerHTML = '');
        this.container = null;
    }
}

export default window.svgraph = svgraph;