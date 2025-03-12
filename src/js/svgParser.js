/**
 * SVG Builder - SVG Parser Module
 * Handles parsing and processing of SVG files
 */

const SvgParser = {
    /**
     * Parse an SVG string into a DOM structure
     * @param {string} svgString - The SVG content as a string
     * @returns {Document} The parsed SVG document
     */
    parseSvgString: (svgString) => {
        const parser = new DOMParser();
        return parser.parseFromString(svgString, 'image/svg+xml');
    },

    /**
     * Convert SVG DOM to string
     * @param {SVGElement} svgElement - The SVG element
     * @returns {string} The SVG as a string
     */
    svgToString: (svgElement) => {
        const serializer = new XMLSerializer();
        return serializer.serializeToString(svgElement);
    },

    /**
     * Extract SVG metadata
     * @param {SVGElement} svgElement - The SVG element
     * @returns {Object} Object containing SVG metadata
     */
    extractMetadata: (svgElement) => {
        const viewBox = Utils.parseViewBox(svgElement.getAttribute('viewBox'));
        
        return {
            width: svgElement.getAttribute('width') || viewBox.width,
            height: svgElement.getAttribute('height') || viewBox.height,
            viewBox: viewBox,
            xmlns: svgElement.getAttribute('xmlns') || 'http://www.w3.org/2000/svg',
            version: svgElement.getAttribute('version') || '1.1'
        };
    },

    /**
     * Extract all elements from an SVG
     * @param {SVGElement} svgElement - The SVG element
     * @returns {Array} Array of SVG elements with their properties
     */
    extractElements: (svgElement) => {
        const elements = [];
        const traverse = (node, parent = null) => {
            // Skip text nodes and comments
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            
            // Skip the root SVG element
            if (node === svgElement) {
                Array.from(node.childNodes).forEach(child => traverse(child, null));
                return;
            }
            
            const element = {
                id: node.id || Utils.generateId(),
                type: node.tagName.toLowerCase(),
                attributes: {},
                parent: parent ? parent.id : null,
                children: []
            };
            
            // Extract attributes
            Array.from(node.attributes).forEach(attr => {
                element.attributes[attr.name] = attr.value;
            });
            
            // Ensure the element has an ID
            if (!node.id) {
                node.id = element.id;
            }
            
            elements.push(element);
            
            // Process children
            Array.from(node.childNodes).forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    traverse(child, element);
                    element.children.push(child.id || Utils.generateId());
                }
            });
        };
        
        traverse(svgElement);
        return elements;
    },

    /**
     * Create a new SVG document
     * @param {number} width - The width of the SVG
     * @param {number} height - The height of the SVG
     * @returns {SVGElement} The created SVG element
     */
    createNewSvg: (width = 800, height = 600) => {
        const svg = Utils.createSvgElement('svg');
        Utils.setSvgAttributes(svg, {
            width: width,
            height: height,
            viewBox: `0 0 ${width} ${height}`,
            xmlns: 'http://www.w3.org/2000/svg',
            version: '1.1'
        });
        return svg;
    },

    /**
     * Load SVG from a file
     * @param {File} file - The SVG file
     * @returns {Promise<Document>} Promise resolving to the parsed SVG document
     */
    loadFromFile: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const svgString = event.target.result;
                    const svgDoc = SvgParser.parseSvgString(svgString);
                    
                    // Check for parsing errors
                    const parserError = svgDoc.querySelector('parsererror');
                    if (parserError) {
                        reject(new Error('SVG parsing error: ' + parserError.textContent));
                        return;
                    }
                    
                    resolve(svgDoc);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            
            reader.readAsText(file);
        });
    },

    /**
     * Create an element in the SVG
     * @param {string} type - The type of element to create
     * @param {Object} attributes - The attributes for the element
     * @param {SVGElement} parent - The parent element
     * @returns {SVGElement} The created element
     */
    createElement: (type, attributes, parent) => {
        const element = Utils.createSvgElement(type);
        Utils.setSvgAttributes(element, attributes);
        
        if (parent) {
            parent.appendChild(element);
        }
        
        return element;
    },

    /**
     * Update an element's attributes
     * @param {SVGElement} element - The element to update
     * @param {Object} attributes - The new attributes
     */
    updateElement: (element, attributes) => {
        for (const [key, value] of Object.entries(attributes)) {
            if (value === null || value === undefined) {
                element.removeAttribute(key);
            } else {
                element.setAttribute(key, value);
            }
        }
    },

    /**
     * Remove an element from the SVG
     * @param {SVGElement} element - The element to remove
     */
    removeElement: (element) => {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    },

    /**
     * Clone an SVG element
     * @param {SVGElement} element - The element to clone
     * @returns {SVGElement} The cloned element
     */
    cloneElement: (element) => {
        return element.cloneNode(true);
    },

    /**
     * Get computed bounding box of an element
     * @param {SVGElement} element - The SVG element
     * @returns {Object} The bounding box with x, y, width, height
     */
    getBoundingBox: (element) => {
        try {
            const bbox = element.getBBox();
            return {
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height
            };
        } catch (e) {
            // Some elements might not have a bounding box
            return { x: 0, y: 0, width: 0, height: 0 };
        }
    },

    /**
     * Get all elements of a specific type
     * @param {SVGElement} svgRoot - The root SVG element
     * @param {string} type - The element type to find
     * @returns {Array} Array of matching elements
     */
    getElementsByType: (svgRoot, type) => {
        return Array.from(svgRoot.getElementsByTagName(type));
    },

    /**
     * Find element by ID
     * @param {SVGElement} svgRoot - The root SVG element
     * @param {string} id - The ID to find
     * @returns {SVGElement} The found element or null
     */
    getElementById: (svgRoot, id) => {
        return svgRoot.getElementById(id);
    }
};

// Export the SvgParser object
window.SvgParser = SvgParser; 