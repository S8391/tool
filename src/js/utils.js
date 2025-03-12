/**
 * SVG Builder - Utility Functions
 * Contains helper functions used throughout the application
 */

const Utils = {
    /**
     * Generate a unique ID
     * @returns {string} A unique ID
     */
    generateId: () => {
        return 'id-' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Format SVG code with proper indentation
     * @param {string} svgCode - The SVG code to format
     * @returns {string} Formatted SVG code
     */
    formatSvgCode: (svgCode) => {
        // Simple XML formatting
        let formatted = '';
        let indent = '';
        const tab = '  ';
        
        // Remove existing whitespace between tags
        svgCode = svgCode.replace(/>\s+</g, '><');
        
        // Add newlines and indentation
        svgCode.split(/>\s*</).forEach(node => {
            if (node.match(/^\/\w/)) {
                // Closing tag
                indent = indent.substring(tab.length);
            }
            
            formatted += indent + '<' + node + '>\n';
            
            if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith("?xml")) {
                // Opening tag
                indent += tab;
            }
        });
        
        // Clean up the result
        return formatted
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/^\s*[\r\n]/gm, '')
            .replace(/<>\n/g, '')
            .replace(/\n<\/>/g, '');
    },

    /**
     * Convert RGB color to hex
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @returns {string} Hex color code
     */
    rgbToHex: (r, g, b) => {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },

    /**
     * Convert hex color to RGB
     * @param {string} hex - Hex color code
     * @returns {Object} RGB color object with r, g, b properties
     */
    hexToRgb: (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    /**
     * Parse SVG viewBox attribute
     * @param {string} viewBox - The viewBox attribute value
     * @returns {Object} Object with x, y, width, height properties
     */
    parseViewBox: (viewBox) => {
        if (!viewBox) return { x: 0, y: 0, width: 800, height: 600 };
        
        const parts = viewBox.split(/\s+|,/);
        return {
            x: parseFloat(parts[0]),
            y: parseFloat(parts[1]),
            width: parseFloat(parts[2]),
            height: parseFloat(parts[3])
        };
    },

    /**
     * Create a new SVG element with namespace
     * @param {string} tagName - The tag name of the element to create
     * @returns {SVGElement} The created SVG element
     */
    createSvgElement: (tagName) => {
        return document.createElementNS('http://www.w3.org/2000/svg', tagName);
    },

    /**
     * Set attributes on an SVG element
     * @param {SVGElement} element - The SVG element
     * @param {Object} attributes - Object with attribute names and values
     */
    setSvgAttributes: (element, attributes) => {
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
    },

    /**
     * Download a file
     * @param {string} content - The content of the file
     * @param {string} fileName - The name of the file
     * @param {string} contentType - The content type of the file
     */
    downloadFile: (content, fileName, contentType) => {
        const a = document.createElement('a');
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    },

    /**
     * Show a modal dialog
     * @param {string} title - The title of the modal
     * @param {string|HTMLElement} content - The content of the modal
     * @param {Function} onConfirm - Callback function when confirm button is clicked
     */
    showModal: (title, content, onConfirm) => {
        const modalContainer = document.getElementById('modal-container');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalConfirm = document.getElementById('modal-confirm');
        const modalCancel = document.getElementById('modal-cancel');
        const modalClose = document.getElementById('modal-close');
        
        modalTitle.textContent = title;
        
        if (typeof content === 'string') {
            modalBody.innerHTML = content;
        } else {
            modalBody.innerHTML = '';
            modalBody.appendChild(content);
        }
        
        const closeModal = () => {
            modalContainer.classList.add('hidden');
            modalConfirm.onclick = null;
        };
        
        modalConfirm.onclick = () => {
            if (onConfirm) onConfirm();
            closeModal();
        };
        
        modalCancel.onclick = closeModal;
        modalClose.onclick = closeModal;
        
        modalContainer.classList.remove('hidden');
    },

    /**
     * Debounce a function
     * @param {Function} func - The function to debounce
     * @param {number} wait - The debounce wait time in milliseconds
     * @returns {Function} The debounced function
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Check if a point is inside a rectangle
     * @param {number} x - X coordinate of the point
     * @param {number} y - Y coordinate of the point
     * @param {number} rectX - X coordinate of the rectangle
     * @param {number} rectY - Y coordinate of the rectangle
     * @param {number} rectWidth - Width of the rectangle
     * @param {number} rectHeight - Height of the rectangle
     * @returns {boolean} True if the point is inside the rectangle
     */
    isPointInRect: (x, y, rectX, rectY, rectWidth, rectHeight) => {
        return x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight;
    },

    /**
     * Get mouse position relative to an element
     * @param {MouseEvent} event - The mouse event
     * @param {HTMLElement} element - The element
     * @returns {Object} Object with x and y properties
     */
    getMousePosition: (event, element) => {
        const rect = element.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    },

    /**
     * Sanitize a string for use in HTML
     * @param {string} str - The string to sanitize
     * @returns {string} The sanitized string
     */
    sanitizeHtml: (str) => {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
};

// Export the Utils object
window.Utils = Utils; 