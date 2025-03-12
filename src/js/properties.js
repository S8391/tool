/**
 * SVG Builder - Properties Module
 * Handles element properties and property panel
 */

const Properties = {
    /**
     * Initialize properties module
     */
    init: () => {
        Properties.setupEventListeners();
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: () => {
        // Code editor changes
        const svgCode = document.getElementById('svg-code');
        svgCode.addEventListener('input', Utils.debounce(() => {
            try {
                const svgString = svgCode.value;
                const svgDoc = SvgParser.parseSvgString(svgString);
                
                // Check for parsing errors
                const parserError = svgDoc.querySelector('parsererror');
                if (parserError) {
                    console.error('SVG parsing error:', parserError.textContent);
                    return;
                }
                
                // Replace the current SVG with the new one
                const svgCanvas = document.getElementById('svg-canvas');
                const newSvg = svgDoc.documentElement;
                
                // Preserve the original dimensions and viewBox
                const width = svgCanvas.getAttribute('width');
                const height = svgCanvas.getAttribute('height');
                const viewBox = svgCanvas.getAttribute('viewBox');
                
                newSvg.setAttribute('width', width);
                newSvg.setAttribute('height', height);
                newSvg.setAttribute('viewBox', viewBox);
                
                // Replace the SVG
                svgCanvas.parentNode.replaceChild(newSvg, svgCanvas);
                
                // Update the ID to maintain references
                newSvg.id = 'svg-canvas';
                
                // Reinitialize tools with the new SVG
                Tools.init(newSvg);
                
                // Update layers
                App.updateLayers();
            } catch (error) {
                console.error('Error updating SVG from code:', error);
            }
        }, 500));
        
        // Format code button
        document.getElementById('format-code').addEventListener('click', () => {
            const svgCode = document.getElementById('svg-code');
            svgCode.value = Utils.formatSvgCode(svgCode.value);
        });
        
        // Copy code button
        document.getElementById('copy-code').addEventListener('click', () => {
            const svgCode = document.getElementById('svg-code');
            svgCode.select();
            document.execCommand('copy');
            
            // Show a temporary message
            const button = document.getElementById('copy-code');
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
            }, 1000);
        });
    },
    
    /**
     * Update properties panel for selected element
     * @param {SVGElement} element - The selected element
     */
    updatePropertiesPanel: (element) => {
        const container = document.getElementById('properties-container');
        
        if (!element) {
            container.innerHTML = `
                <div class="no-selection-message">
                    <p>Select an element to edit its properties</p>
                </div>
            `;
            return;
        }
        
        // Get element type
        const type = element.tagName.toLowerCase();
        
        // Create properties panel based on element type
        let propertiesHTML = '';
        
        // Common properties group
        propertiesHTML += `
            <div class="property-group">
                <div class="property-group-header">
                    Common Properties
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="property-group-content">
                    <div class="property-row">
                        <div class="property-label">ID</div>
                        <div class="property-control">
                            <input type="text" id="prop-id" value="${element.id || ''}" data-attr="id">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Fill</div>
                        <div class="property-control">
                            <input type="color" id="prop-fill" value="${Properties.getColorValue(element.getAttribute('fill'))}" data-attr="fill">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Stroke</div>
                        <div class="property-control">
                            <input type="color" id="prop-stroke" value="${Properties.getColorValue(element.getAttribute('stroke'))}" data-attr="stroke">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Stroke Width</div>
                        <div class="property-control">
                            <input type="number" id="prop-stroke-width" value="${element.getAttribute('stroke-width') || 1}" min="0" step="0.5" data-attr="stroke-width">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Opacity</div>
                        <div class="property-control">
                            <input type="number" id="prop-opacity" value="${element.getAttribute('opacity') || 1}" min="0" max="1" step="0.1" data-attr="opacity">
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Element-specific properties
        switch (type) {
            case 'rect':
                propertiesHTML += Properties.createRectProperties(element);
                break;
            case 'circle':
                propertiesHTML += Properties.createCircleProperties(element);
                break;
            case 'line':
                propertiesHTML += Properties.createLineProperties(element);
                break;
            case 'path':
                propertiesHTML += Properties.createPathProperties(element);
                break;
            case 'text':
                propertiesHTML += Properties.createTextProperties(element);
                break;
            case 'g':
                propertiesHTML += Properties.createGroupProperties(element);
                break;
        }
        
        // Transform properties
        propertiesHTML += Properties.createTransformProperties(element);
        
        // Set the HTML
        container.innerHTML = propertiesHTML;
        
        // Add event listeners to property inputs
        Properties.setupPropertyInputs();
        
        // Add event listeners to property group headers
        Properties.setupPropertyGroups();
    },
    
    /**
     * Set up property inputs
     */
    setupPropertyInputs: () => {
        const inputs = document.querySelectorAll('#properties-container input, #properties-container select, #properties-container textarea');
        
        inputs.forEach(input => {
            const attr = input.getAttribute('data-attr');
            
            if (!attr) return;
            
            input.addEventListener('change', () => {
                if (!Tools.selectedElement) return;
                
                let value = input.value;
                
                // Handle special cases
                if (input.type === 'number' && input.value === '') {
                    value = '0';
                }
                
                // Update the attribute
                Tools.selectedElement.setAttribute(attr, value);
                
                // Update the SVG code
                App.updateSvgCode();
            });
        });
        
        // Special handling for text content
        const textContent = document.getElementById('prop-text-content');
        if (textContent) {
            textContent.addEventListener('input', () => {
                if (!Tools.selectedElement) return;
                
                Tools.selectedElement.textContent = textContent.value;
                
                // Update the SVG code
                App.updateSvgCode();
            });
        }
    },
    
    /**
     * Set up property groups (collapsible)
     */
    setupPropertyGroups: () => {
        const headers = document.querySelectorAll('.property-group-header');
        
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const icon = header.querySelector('i');
                
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    icon.className = 'fas fa-chevron-down';
                } else {
                    content.style.display = 'none';
                    icon.className = 'fas fa-chevron-right';
                }
            });
        });
    },
    
    /**
     * Get color value for input
     * @param {string} color - The color value
     * @returns {string} The color value for input
     */
    getColorValue: (color) => {
        if (!color || color === 'none') return '#000000';
        
        // Handle named colors
        const namedColors = {
            'black': '#000000',
            'white': '#ffffff',
            'red': '#ff0000',
            'green': '#008000',
            'blue': '#0000ff',
            'yellow': '#ffff00',
            'purple': '#800080',
            'orange': '#ffa500',
            'gray': '#808080'
        };
        
        if (namedColors[color]) {
            return namedColors[color];
        }
        
        return color;
    },
    
    /**
     * Create rectangle properties
     * @param {SVGElement} element - The rectangle element
     * @returns {string} HTML for rectangle properties
     */
    createRectProperties: (element) => {
        return `
            <div class="property-group">
                <div class="property-group-header">
                    Rectangle Properties
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="property-group-content">
                    <div class="property-row">
                        <div class="property-label">X</div>
                        <div class="property-control">
                            <input type="number" id="prop-x" value="${element.getAttribute('x') || 0}" data-attr="x">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Y</div>
                        <div class="property-control">
                            <input type="number" id="prop-y" value="${element.getAttribute('y') || 0}" data-attr="y">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Width</div>
                        <div class="property-control">
                            <input type="number" id="prop-width" value="${element.getAttribute('width') || 0}" min="0" data-attr="width">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Height</div>
                        <div class="property-control">
                            <input type="number" id="prop-height" value="${element.getAttribute('height') || 0}" min="0" data-attr="height">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Rx (Corner Radius)</div>
                        <div class="property-control">
                            <input type="number" id="prop-rx" value="${element.getAttribute('rx') || 0}" min="0" data-attr="rx">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Ry (Corner Radius)</div>
                        <div class="property-control">
                            <input type="number" id="prop-ry" value="${element.getAttribute('ry') || 0}" min="0" data-attr="ry">
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Create circle properties
     * @param {SVGElement} element - The circle element
     * @returns {string} HTML for circle properties
     */
    createCircleProperties: (element) => {
        return `
            <div class="property-group">
                <div class="property-group-header">
                    Circle Properties
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="property-group-content">
                    <div class="property-row">
                        <div class="property-label">Center X</div>
                        <div class="property-control">
                            <input type="number" id="prop-cx" value="${element.getAttribute('cx') || 0}" data-attr="cx">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Center Y</div>
                        <div class="property-control">
                            <input type="number" id="prop-cy" value="${element.getAttribute('cy') || 0}" data-attr="cy">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Radius</div>
                        <div class="property-control">
                            <input type="number" id="prop-r" value="${element.getAttribute('r') || 0}" min="0" data-attr="r">
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Create line properties
     * @param {SVGElement} element - The line element
     * @returns {string} HTML for line properties
     */
    createLineProperties: (element) => {
        return `
            <div class="property-group">
                <div class="property-group-header">
                    Line Properties
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="property-group-content">
                    <div class="property-row">
                        <div class="property-label">Start X</div>
                        <div class="property-control">
                            <input type="number" id="prop-x1" value="${element.getAttribute('x1') || 0}" data-attr="x1">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Start Y</div>
                        <div class="property-control">
                            <input type="number" id="prop-y1" value="${element.getAttribute('y1') || 0}" data-attr="y1">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">End X</div>
                        <div class="property-control">
                            <input type="number" id="prop-x2" value="${element.getAttribute('x2') || 0}" data-attr="x2">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">End Y</div>
                        <div class="property-control">
                            <input type="number" id="prop-y2" value="${element.getAttribute('y2') || 0}" data-attr="y2">
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Create path properties
     * @param {SVGElement} element - The path element
     * @returns {string} HTML for path properties
     */
    createPathProperties: (element) => {
        return `
            <div class="property-group">
                <div class="property-group-header">
                    Path Properties
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="property-group-content">
                    <div class="property-row">
                        <div class="property-label">Path Data</div>
                        <div class="property-control">
                            <textarea id="prop-d" rows="4" data-attr="d">${element.getAttribute('d') || ''}</textarea>
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Fill Rule</div>
                        <div class="property-control">
                            <select id="prop-fill-rule" data-attr="fill-rule">
                                <option value="nonzero" ${element.getAttribute('fill-rule') === 'nonzero' ? 'selected' : ''}>nonzero</option>
                                <option value="evenodd" ${element.getAttribute('fill-rule') === 'evenodd' ? 'selected' : ''}>evenodd</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Create text properties
     * @param {SVGElement} element - The text element
     * @returns {string} HTML for text properties
     */
    createTextProperties: (element) => {
        return `
            <div class="property-group">
                <div class="property-group-header">
                    Text Properties
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="property-group-content">
                    <div class="property-row">
                        <div class="property-label">X</div>
                        <div class="property-control">
                            <input type="number" id="prop-x" value="${element.getAttribute('x') || 0}" data-attr="x">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Y</div>
                        <div class="property-control">
                            <input type="number" id="prop-y" value="${element.getAttribute('y') || 0}" data-attr="y">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Font Family</div>
                        <div class="property-control">
                            <input type="text" id="prop-font-family" value="${element.getAttribute('font-family') || 'Arial'}" data-attr="font-family">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Font Size</div>
                        <div class="property-control">
                            <input type="number" id="prop-font-size" value="${element.getAttribute('font-size') || 16}" min="1" data-attr="font-size">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Font Weight</div>
                        <div class="property-control">
                            <select id="prop-font-weight" data-attr="font-weight">
                                <option value="normal" ${element.getAttribute('font-weight') === 'normal' ? 'selected' : ''}>Normal</option>
                                <option value="bold" ${element.getAttribute('font-weight') === 'bold' ? 'selected' : ''}>Bold</option>
                                <option value="lighter" ${element.getAttribute('font-weight') === 'lighter' ? 'selected' : ''}>Lighter</option>
                                <option value="bolder" ${element.getAttribute('font-weight') === 'bolder' ? 'selected' : ''}>Bolder</option>
                            </select>
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Text Content</div>
                        <div class="property-control">
                            <textarea id="prop-text-content" rows="3">${element.textContent || ''}</textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Create group properties
     * @param {SVGElement} element - The group element
     * @returns {string} HTML for group properties
     */
    createGroupProperties: (element) => {
        return `
            <div class="property-group">
                <div class="property-group-header">
                    Group Properties
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="property-group-content">
                    <div class="property-row">
                        <div class="property-label">Child Elements</div>
                        <div class="property-control">
                            <span>${element.children.length} elements</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    /**
     * Create transform properties
     * @param {SVGElement} element - The element
     * @returns {string} HTML for transform properties
     */
    createTransformProperties: (element) => {
        // Parse transform attribute
        const transform = element.getAttribute('transform') || '';
        
        // Extract translate values
        let translateX = 0;
        let translateY = 0;
        const translateMatch = transform.match(/translate\(\s*([^,)]+)(?:,\s*([^)]+))?\)/);
        
        if (translateMatch) {
            translateX = parseFloat(translateMatch[1]) || 0;
            translateY = parseFloat(translateMatch[2]) || 0;
        }
        
        // Extract rotate value
        let rotate = 0;
        const rotateMatch = transform.match(/rotate\(\s*([^)]+)\)/);
        
        if (rotateMatch) {
            rotate = parseFloat(rotateMatch[1]) || 0;
        }
        
        // Extract scale values
        let scaleX = 1;
        let scaleY = 1;
        const scaleMatch = transform.match(/scale\(\s*([^,)]+)(?:,\s*([^)]+))?\)/);
        
        if (scaleMatch) {
            scaleX = parseFloat(scaleMatch[1]) || 1;
            scaleY = parseFloat(scaleMatch[2] || scaleMatch[1]) || 1;
        }
        
        return `
            <div class="property-group">
                <div class="property-group-header">
                    Transform Properties
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="property-group-content">
                    <div class="property-row">
                        <div class="property-label">Translate X</div>
                        <div class="property-control">
                            <input type="number" id="prop-translate-x" value="${translateX}" data-transform="translate">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Translate Y</div>
                        <div class="property-control">
                            <input type="number" id="prop-translate-y" value="${translateY}" data-transform="translate">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Rotate</div>
                        <div class="property-control">
                            <input type="number" id="prop-rotate" value="${rotate}" data-transform="rotate">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Scale X</div>
                        <div class="property-control">
                            <input type="number" id="prop-scale-x" value="${scaleX}" step="0.1" data-transform="scale">
                        </div>
                    </div>
                    <div class="property-row">
                        <div class="property-label">Scale Y</div>
                        <div class="property-control">
                            <input type="number" id="prop-scale-y" value="${scaleY}" step="0.1" data-transform="scale">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

// Export the Properties object
window.Properties = Properties; 