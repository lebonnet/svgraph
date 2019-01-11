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
            smoothing: 0.15,
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
        w.addEventListener('resize', svgraph._onResize);
        instance
            .setPrivateProps()
            .draw();
    }

    /**
     * Set private properties
     * @throws Error
     * @return svgraph
     */
    setPrivateProps() {

        if (!instance.config.container) {
            throw new Error('container is not defined');
        }

        let ref;

        instance._container =
            typeof instance.config.container === 'string'
                ? d.querySelector(instance.config.container)
                : instance.config.container;
        instance._x = {min: null, max: 0};
        instance._y = {min: null, max: 0};

        instance._margin = 20;
        instance._scale = 1;

        ref = instance._container.getBoundingClientRect();

        instance.config.data.forEach(point => {
            let [x, y] = point;
            x > instance._x.max && (instance._x.max = x);
            y > instance._y.max && (instance._y.max = y);
            (instance._x.min === null || x < instance._x.min) && (instance._x.min = x);
            (instance._y.min === null || y < instance._y.min) && (instance._y.min = y);
        });

        if (instance.config.scaled && ref.width && ref.width > instance._x.max + (instance._margin * 2)) {
            instance._scale = +((ref.width * .95) / (instance._x.max + (instance._margin * 2))).toFixed(2)
        }

        return instance;
    }

    /**
     * Draw the graph on page
     * @return {svgraph}
     */
    draw() {
        instance._container.innerHTML = instance.graphBuild();

        return instance;
    }

    /**
     * Create graph, dots and lines
     * @return {string}
     */
    graphBuild() {

        instance.config.data.sort((a, b) => a[0] - b[0]);

        let maxX = instance._x.max * instance._scale,
            minX = instance._x.min * instance._scale,
            maxY = instance._y.max,
            margin = instance._margin,
            svg = `<svg class="svgraph" width="${maxX + margin * 4}" height="${maxY + margin * 2}" xmlns="http://www.w3.org/2000/svg">`;

        svg += `

<g>
    <text x="${((maxX - minX) / 2) + margin}" y="${margin * 2 + maxY}" text-anchor="middle" opacity="1">
        <tspan>${instance.config.xName}</tspan>
    </text>
    <text 
        x="${-(maxY + margin) / 2 + margin}" y="0"
        style="transform: rotate(-90deg);transform-origin: ${margin}px ${margin / 2}px;"
        text-anchor="middle" opacity="1">
        <tspan>${instance.config.yName}</tspan>
    </text>
</g>

<g>
    <line class="svgraph-axis" x1="${margin}" x2="${margin}" y1="0" y2="${margin + maxY + .5}" stroke-width="1"/>
    <line class="svgraph-axis" x1="${margin * 2 + maxX}" x2="${margin}" y1="${margin + maxY}" y2="${margin + maxY}" stroke-width="1"/>
</g>
`;


        svg += instance.svgPath();
        svg += `</svg>`;

        return svg;
    }

    /**
     * Position of a control point
     * @param {array} current - [x, y] current point coordinates
     * @param {array} previous - [x, y] previous point coordinates
     * @param {array} next - [x, y] next point coordinates
     * @param {[boolean]} reverse - sets the direction
     * @return {array} - [x,y] a tuple of coordinates
     * see I https://github.com/d3/d3-shape/blob/master/README.md#curves
     * see II https://medium.com/@francoisromain/smooth-a-svg-path-with-cubic-bezier-curves-e37b49d46c74
     */
    controlPoint(current, previous, next, reverse = false) {

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
     * @param {array} point [x,y] - current point coordinates
     * @param {int} i - index of 'point' in the array 'a'
     * @param {array} a - complete array of points coordinates
     * @return {string} 'C x2,y2 x1,y1 x,y': SVG cubic bezier C command
     * see I https://github.com/d3/d3-shape/blob/master/README.md#curves
     * see II https://medium.com/@francoisromain/smooth-a-svg-path-with-cubic-bezier-curves-e37b49d46c74
     */
    bezierCommand(point, i, a) {

        let
            // start control point
            cps = instance.controlPoint(a[i - 1], a[i - 2], point),
            // end control point
            cpe = instance.controlPoint(point, a[i - 1], a[i + 1], true);

        return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`
    }

    /**
     * Build path of graph and dots
     * @return {string}
     */
    svgPath() {

        let points = instance.normalisePoints(),
            dots = [],
            graphPath = '';

        points.forEach((point, i) => {
            let [x, y] = point;

            dots.push(`
<circle class="svgraph-circle-outer" cx="${x}" cy="${y}" r="3"/>
<circle class="svgraph-circle" cx="${x}" cy="${y}" r="1.5"/>
`);
            graphPath += !i ? `M ${x},${y}` : ` ${instance.bezierCommand([x, y], i, points)}`;
        });

        return `<path class="svgraph-path" d="${graphPath}" fill="transparent"/><g>${dots.join('')}</g>`;
    }

    /**
     *
     * @return {array}
     */
    normalisePoints() {
        let arr = [],
            margin = instance._margin;

        instance.config.data.forEach(point => {
            let [x, y] = point;
            y = margin + instance._y.max - y;
            x = x * instance._scale + margin;
            arr.push([x, y]);
        });

        return arr;
    }

    /**
     * Function when window resize
     * @private
     */
    static _onResize() {

        clearTimeout(instance.onResizeTimeout);

        instance.onResizeTimeout = setTimeout(() => {
            instance
                .setPrivateProps()
                .draw();
        }, 50);

    }

    /**
     * Clear gonfig container
     * @return {svgraph}
     */
    clear() {
        instance._container && (instance._container.innerHTML = '');
        instance._container = null;
        return instance;
    }

    /**
     * Destroy svgraph
     */
    destroy() {
        instance.clear();

        clearTimeout(instance.onResizeTimeout);

        w.removeEventListener('scroll', svgraph._onResize);
        instance = null;
    }

    /**
     * Create new HTML element
     * @param {string} tagName - name created tag
     * @param {string} selector - css selectors ('class1 class2...')
     * @param {HTMLElement} parent - parent of new tag
     * @param {object} css - css styles
     * @return {HTMLElement}
     */
    static createElement(tagName, selector = '', parent = null, css = {}) {
        let el = d.createElement(tagName);
        el.className = selector;
        Object.assign(el.style, css);

        parent && parent.appendChild(el);
        return el;
    }
}

export default window.svgraph = svgraph;