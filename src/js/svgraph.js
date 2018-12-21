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
            data: [],
            container: null,
        }, opts);

        this.ini();
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

        this.draw();
    }

    draw() {
        if (!this.config.container) {
            throw new Error('container is not defined');
        }
        this.container =
            typeof this.config.container === 'string'
                ? d.querySelector(this.config.container)
                : this.config.container;

        this.container.innerHTML = this.createGraph();
    }

    createGraph() {

        return `
<svg width="190" height="160" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80" stroke="black" fill="transparent"/>
</svg>

        `;
    }

    clear() {
        this.container && (this.container.innerHTML = '');
        this.container = null;
    }
}

export default window.svgraph = svgraph;