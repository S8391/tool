/**
 * SVG Builder - SVG Cleaner Module
 * Handles cleaning and optimization of SVG files
 */

const SvgCleaner = {
    /**
     * Clean an SVG document
     * @param {Document} svgDoc - The SVG document to clean
     * @returns {Document} The cleaned SVG document
     */
    cleanSvg: (svgDoc) => {
        const cleanedDoc = svgDoc.cloneNode(true);
        const svgElement = cleanedDoc.documentElement;
        
        // Apply all cleaning operations
        SvgCleaner.removeEmptyGroups(svgElement);
        SvgCleaner.removeEmptyElements(svgElement);
        SvgCleaner.removeUnusedDefs(svgElement);
        SvgCleaner.removeComments(svgElement);
        SvgCleaner.removeNonSvgElements(svgElement);
        SvgCleaner.cleanAttributes(svgElement);
        SvgCleaner.optimizePaths(svgElement);
        SvgCleaner.ensureIds(svgElement);
        
        return cleanedDoc;
    },

    /**
     * Remove empty groups
     * @param {SVGElement} svgElement - The SVG element
     */
    removeEmptyGroups: (svgElement) => {
        const groups = Array.from(svgElement.getElementsByTagName('g'));
        
        for (const group of groups) {
            // Check if the group has no children or only whitespace text nodes
            let hasContent = false;
            
            for (const child of group.childNodes) {
                if (child.nodeType === Node.ELEMENT_NODE || 
                    (child.nodeType === Node.TEXT_NODE && child.textContent.trim() !== '')) {
                    hasContent = true;
                    break;
                }
            }
            
            if (!hasContent && group.parentNode) {
                group.parentNode.removeChild(group);
            }
        }
    },

    /**
     * Remove empty elements
     * @param {SVGElement} svgElement - The SVG element
     */
    removeEmptyElements: (svgElement) => {
        const emptyElements = [];
        
        // Find elements with no content and no significant attributes
        const traverse = (node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            
            // Skip the root SVG element
            if (node === svgElement) {
                Array.from(node.childNodes).forEach(traverse);
                return;
            }
            
            let hasContent = false;
            
            // Check for child elements
            for (const child of node.childNodes) {
                if (child.nodeType === Node.ELEMENT_NODE || 
                    (child.nodeType === Node.TEXT_NODE && child.textContent.trim() !== '')) {
                    hasContent = true;
                    break;
                }
            }
            
            // Check for significant attributes
            const significantAttrs = ['d', 'points', 'x', 'y', 'width', 'height', 'r', 'cx', 'cy', 'x1', 'y1', 'x2', 'y2'];
            let hasSignificantAttrs = false;
            
            for (const attr of significantAttrs) {
                if (node.hasAttribute(attr)) {
                    hasSignificantAttrs = true;
                    break;
                }
            }
            
            if (!hasContent && !hasSignificantAttrs) {
                emptyElements.push(node);
            } else {
                Array.from(node.childNodes).forEach(traverse);
            }
        };
        
        traverse(svgElement);
        
        // Remove empty elements
        for (const element of emptyElements) {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
    },

    /**
     * Remove unused definitions
     * @param {SVGElement} svgElement - The SVG element
     */
    removeUnusedDefs: (svgElement) => {
        const defs = svgElement.getElementsByTagName('defs');
        if (defs.length === 0) return;
        
        const defsElement = defs[0];
        const svgString = SvgParser.svgToString(svgElement);
        
        // Get all IDs in the defs section
        const defItems = Array.from(defsElement.children);
        
        for (const item of defItems) {
            if (!item.id) continue;
            
            // Check if the ID is referenced anywhere in the SVG
            const idRef = `#${item.id}`;
            const urlRef = `url(${idRef})`;
            
            if (!svgString.includes(idRef) && !svgString.includes(urlRef)) {
                defsElement.removeChild(item);
            }
        }
        
        // Remove the defs element if it's empty
        if (defsElement.children.length === 0 && defsElement.parentNode) {
            defsElement.parentNode.removeChild(defsElement);
        }
    },

    /**
     * Remove comments
     * @param {SVGElement} svgElement - The SVG element
     */
    removeComments: (svgElement) => {
        const nodeIterator = document.createNodeIterator(
            svgElement,
            NodeFilter.SHOW_COMMENT,
            null,
            false
        );
        
        let node;
        const comments = [];
        
        while (node = nodeIterator.nextNode()) {
            comments.push(node);
        }
        
        for (const comment of comments) {
            if (comment.parentNode) {
                comment.parentNode.removeChild(comment);
            }
        }
    },

    /**
     * Remove non-SVG elements
     * @param {SVGElement} svgElement - The SVG element
     */
    removeNonSvgElements: (svgElement) => {
        const svgNamespace = 'http://www.w3.org/2000/svg';
        const nonSvgElements = [];
        
        const traverse = (node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            
            if (node.namespaceURI !== svgNamespace && node !== svgElement) {
                nonSvgElements.push(node);
            } else {
                Array.from(node.childNodes).forEach(traverse);
            }
        };
        
        traverse(svgElement);
        
        for (const element of nonSvgElements) {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
    },

    /**
     * Clean attributes
     * @param {SVGElement} svgElement - The SVG element
     */
    cleanAttributes: (svgElement) => {
        const unnecessaryAttrs = [
            'data-name', 'data-*', 'sketch:type', 'inkscape:*', 'sodipodi:*',
            'xmlns:xlink', 'xmlns:svg', 'xmlns:sodipodi', 'xmlns:inkscape'
        ];
        
        const traverse = (node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            
            // Remove unnecessary attributes
            for (const attr of Array.from(node.attributes)) {
                const attrName = attr.name;
                
                for (const pattern of unnecessaryAttrs) {
                    if (pattern.endsWith('*')) {
                        const prefix = pattern.slice(0, -1);
                        if (attrName.startsWith(prefix)) {
                            node.removeAttribute(attrName);
                            break;
                        }
                    } else if (attrName === pattern) {
                        node.removeAttribute(attrName);
                        break;
                    }
                }
            }
            
            // Clean style attribute
            if (node.hasAttribute('style')) {
                const style = node.getAttribute('style');
                if (!style || style.trim() === '') {
                    node.removeAttribute('style');
                }
            }
            
            // Process children
            Array.from(node.childNodes).forEach(traverse);
        };
        
        traverse(svgElement);
    },

    /**
     * Optimize paths
     * @param {SVGElement} svgElement - The SVG element
     */
    optimizePaths: (svgElement) => {
        const paths = Array.from(svgElement.getElementsByTagName('path'));
        
        for (const path of paths) {
            if (path.hasAttribute('d')) {
                const d = path.getAttribute('d');
                
                // Remove unnecessary spaces and commas
                let optimized = d.replace(/\s+/g, ' ')
                                 .replace(/,\s*/g, ',')
                                 .trim();
                
                // Remove redundant zeros
                optimized = optimized.replace(/(\.\d+)0+(?=\s|,|$)/g, '$1')
                                    .replace(/\.0+(?=\s|,|$)/g, '');
                
                path.setAttribute('d', optimized);
            }
        }
    },

    /**
     * Ensure all elements have IDs
     * @param {SVGElement} svgElement - The SVG element
     */
    ensureIds: (svgElement) => {
        const traverse = (node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            
            // Skip the root SVG element
            if (node !== svgElement && !node.id) {
                node.id = Utils.generateId();
            }
            
            Array.from(node.childNodes).forEach(traverse);
        };
        
        traverse(svgElement);
    },

    /**
     * Normalize viewBox and dimensions
     * @param {SVGElement} svgElement - The SVG element
     */
    normalizeViewBox: (svgElement) => {
        let width = svgElement.getAttribute('width');
        let height = svgElement.getAttribute('height');
        let viewBox = svgElement.getAttribute('viewBox');
        
        // Parse dimensions
        if (width && width.endsWith('px')) {
            width = parseFloat(width);
            svgElement.setAttribute('width', width);
        }
        
        if (height && height.endsWith('px')) {
            height = parseFloat(height);
            svgElement.setAttribute('height', height);
        }
        
        // Ensure viewBox exists
        if (!viewBox && width && height) {
            svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
    },

    /**
     * Convert styles to attributes
     * @param {SVGElement} svgElement - The SVG element
     */
    styleToAttributes: (svgElement) => {
        const elements = Array.from(svgElement.getElementsByTagName('*'));
        elements.push(svgElement); // Include the root SVG element
        
        for (const element of elements) {
            if (element.hasAttribute('style')) {
                const style = element.getAttribute('style');
                const styleMap = {};
                
                // Parse style string
                style.split(';').forEach(item => {
                    const parts = item.split(':');
                    if (parts.length === 2) {
                        const property = parts[0].trim();
                        const value = parts[1].trim();
                        styleMap[property] = value;
                    }
                });
                
                // Convert style properties to attributes
                for (const [property, value] of Object.entries(styleMap)) {
                    // Only convert specific properties
                    const convertibleProps = [
                        'fill', 'stroke', 'stroke-width', 'opacity',
                        'fill-opacity', 'stroke-opacity', 'stroke-linecap',
                        'stroke-linejoin', 'stroke-dasharray'
                    ];
                    
                    if (convertibleProps.includes(property)) {
                        element.setAttribute(property, value);
                    }
                }
                
                // Remove the style attribute
                element.removeAttribute('style');
            }
        }
    },

    /**
     * Clean an SVG string
     * @param {string} svgString - The SVG string to clean
     * @returns {string} The cleaned SVG string
     */
    cleanSvgString: (svgString) => {
        const svgDoc = SvgParser.parseSvgString(svgString);
        const cleanedDoc = SvgCleaner.cleanSvg(svgDoc);
        return SvgParser.svgToString(cleanedDoc.documentElement);
    }
};

// Export the SvgCleaner object
window.SvgCleaner = SvgCleaner; 