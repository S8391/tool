/**
 * SVG Builder - Layers Module
 * Handles layer management for SVG elements
 */

const Layers = {
    /**
     * Initialize layers module
     */
    init: () => {
        Layers.setupEventListeners();
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: () => {
        // Event delegation for layer items
        const layersContainer = document.getElementById('layers-container');
        
        layersContainer.addEventListener('click', (event) => {
            const layerItem = event.target.closest('.layer-item');
            if (!layerItem) return;
            
            const elementId = layerItem.getAttribute('data-element-id');
            if (!elementId) return;
            
            // Handle visibility toggle
            if (event.target.closest('.layer-visibility')) {
                Layers.toggleLayerVisibility(elementId);
                return;
            }
            
            // Select the element
            const svgCanvas = document.getElementById('svg-canvas');
            const element = svgCanvas.getElementById(elementId);
            
            if (element) {
                Tools.selectElement(element);
            }
        });
    },
    
    /**
     * Update layers panel
     * @param {SVGElement} svgCanvas - The SVG canvas element
     */
    updateLayersPanel: (svgCanvas) => {
        const layersContainer = document.getElementById('layers-container');
        
        // Get all elements in the SVG
        const elements = Array.from(svgCanvas.children);
        
        // Sort elements by z-index (reverse order to show top elements first)
        elements.reverse();
        
        // Create HTML for layers
        let layersHTML = '';
        
        elements.forEach(element => {
            // Skip elements that shouldn't be in layers panel
            if (element.getAttribute('data-handle-type') === 'resize') {
                return;
            }
            
            const id = element.id || '';
            const type = element.tagName.toLowerCase();
            const isVisible = element.getAttribute('visibility') !== 'hidden';
            const isSelected = element.getAttribute('data-selected') === 'true';
            
            // Get a display name for the layer
            let name = Layers.getLayerName(element);
            
            layersHTML += `
                <div class="layer-item ${isSelected ? 'active' : ''}" data-element-id="${id}">
                    <div class="layer-visibility">
                        <i class="fas ${isVisible ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    </div>
                    <div class="layer-name">${name}</div>
                    <div class="layer-type">${type}</div>
                </div>
            `;
        });
        
        // Set the HTML
        layersContainer.innerHTML = layersHTML || '<div class="no-layers-message">No elements in the SVG</div>';
    },
    
    /**
     * Get a display name for a layer
     * @param {SVGElement} element - The SVG element
     * @returns {string} The display name
     */
    getLayerName: (element) => {
        // Try to get a meaningful name
        const id = element.id || '';
        const type = element.tagName.toLowerCase();
        
        // For text elements, use the text content
        if (type === 'text' && element.textContent) {
            return Utils.sanitizeHtml(element.textContent.substring(0, 20));
        }
        
        // For other elements, use the ID or type
        return id || type;
    },
    
    /**
     * Toggle layer visibility
     * @param {string} elementId - The ID of the element
     */
    toggleLayerVisibility: (elementId) => {
        const svgCanvas = document.getElementById('svg-canvas');
        const element = svgCanvas.getElementById(elementId);
        
        if (!element) return;
        
        const isVisible = element.getAttribute('visibility') !== 'hidden';
        
        element.setAttribute('visibility', isVisible ? 'hidden' : 'visible');
        
        // Update the layers panel
        Layers.updateLayersPanel(svgCanvas);
        
        // Update the SVG code
        App.updateSvgCode();
    },
    
    /**
     * Move layer up in z-order
     * @param {string} elementId - The ID of the element
     */
    moveLayerUp: (elementId) => {
        const svgCanvas = document.getElementById('svg-canvas');
        const element = svgCanvas.getElementById(elementId);
        
        if (!element || !element.nextElementSibling) return;
        
        svgCanvas.insertBefore(element.nextElementSibling, element);
        
        // Update the layers panel
        Layers.updateLayersPanel(svgCanvas);
        
        // Update the SVG code
        App.updateSvgCode();
    },
    
    /**
     * Move layer down in z-order
     * @param {string} elementId - The ID of the element
     */
    moveLayerDown: (elementId) => {
        const svgCanvas = document.getElementById('svg-canvas');
        const element = svgCanvas.getElementById(elementId);
        
        if (!element || !element.previousElementSibling) return;
        
        svgCanvas.insertBefore(element, element.previousElementSibling);
        
        // Update the layers panel
        Layers.updateLayersPanel(svgCanvas);
        
        // Update the SVG code
        App.updateSvgCode();
    },
    
    /**
     * Group selected elements
     * @param {Array} elementIds - Array of element IDs to group
     */
    groupElements: (elementIds) => {
        if (!elementIds || elementIds.length < 2) return;
        
        const svgCanvas = document.getElementById('svg-canvas');
        const group = Utils.createSvgElement('g');
        group.id = Utils.generateId();
        
        // Add elements to group
        elementIds.forEach(id => {
            const element = svgCanvas.getElementById(id);
            if (element) {
                group.appendChild(element.cloneNode(true));
                svgCanvas.removeChild(element);
            }
        });
        
        svgCanvas.appendChild(group);
        
        // Select the new group
        Tools.selectElement(group);
        
        // Update the layers panel
        Layers.updateLayersPanel(svgCanvas);
        
        // Update the SVG code
        App.updateSvgCode();
    },
    
    /**
     * Ungroup a group element
     * @param {string} groupId - The ID of the group element
     */
    ungroupElements: (groupId) => {
        const svgCanvas = document.getElementById('svg-canvas');
        const group = svgCanvas.getElementById(groupId);
        
        if (!group || group.tagName.toLowerCase() !== 'g') return;
        
        // Get all children
        const children = Array.from(group.children);
        
        // Add children to SVG canvas
        children.forEach(child => {
            // Ensure the child has an ID
            if (!child.id) {
                child.id = Utils.generateId();
            }
            
            // Clone the child to avoid reference issues
            const clone = child.cloneNode(true);
            svgCanvas.appendChild(clone);
        });
        
        // Remove the group
        svgCanvas.removeChild(group);
        
        // Clear selection
        Tools.clearSelection();
        
        // Update the layers panel
        Layers.updateLayersPanel(svgCanvas);
        
        // Update the SVG code
        App.updateSvgCode();
    }
};

// Export the Layers object
window.Layers = Layers; 