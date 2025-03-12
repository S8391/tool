/**
 * SVG Builder - UI Module
 * Handles user interface interactions
 */

const UI = {
    /**
     * Initialize UI module
     */
    init: () => {
        UI.setupEventListeners();
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: () => {
        // New SVG button
        document.getElementById('new-svg').addEventListener('click', UI.handleNewSvg);
        
        // Open SVG button
        document.getElementById('open-svg').addEventListener('click', UI.handleOpenSvg);
        
        // Save SVG button
        document.getElementById('save-svg').addEventListener('click', UI.handleSaveSvg);
        
        // Export SVG button
        document.getElementById('export-svg').addEventListener('click', UI.handleExportSvg);
        
        // Clean SVG button
        document.getElementById('clean-svg').addEventListener('click', UI.handleCleanSvg);
        
        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', UI.handleZoomIn);
        document.getElementById('zoom-out').addEventListener('click', UI.handleZoomOut);
        
        // View controls
        document.getElementById('toggle-grid').addEventListener('click', UI.handleToggleGrid);
        document.getElementById('toggle-rulers').addEventListener('click', UI.handleToggleRulers);
        
        // File input change
        document.getElementById('file-input').addEventListener('change', UI.handleFileInputChange);
        
        // Modal close button
        document.getElementById('modal-close').addEventListener('click', UI.closeModal);
        
        // Modal cancel button
        document.getElementById('modal-cancel').addEventListener('click', UI.closeModal);
    },
    
    /**
     * Handle new SVG button click
     */
    handleNewSvg: () => {
        Utils.showModal(
            'New SVG',
            `
                <div class="form-group">
                    <label for="new-svg-width">Width:</label>
                    <input type="number" id="new-svg-width" value="800" min="1">
                </div>
                <div class="form-group">
                    <label for="new-svg-height">Height:</label>
                    <input type="number" id="new-svg-height" value="600" min="1">
                </div>
            `,
            () => {
                const width = parseInt(document.getElementById('new-svg-width').value) || 800;
                const height = parseInt(document.getElementById('new-svg-height').value) || 600;
                
                // Create new SVG
                const newSvg = SvgParser.createNewSvg(width, height);
                
                // Replace current SVG
                const svgCanvas = document.getElementById('svg-canvas');
                svgCanvas.parentNode.replaceChild(newSvg, svgCanvas);
                
                // Update the ID to maintain references
                newSvg.id = 'svg-canvas';
                
                // Reinitialize tools with the new SVG
                Tools.init(newSvg);
                
                // Update SVG code
                App.updateSvgCode();
                
                // Update layers
                App.updateLayers();
                
                // Update canvas size in status bar
                document.getElementById('canvas-size').textContent = `${width} × ${height}`;
            }
        );
    },
    
    /**
     * Handle open SVG button click
     */
    handleOpenSvg: () => {
        document.getElementById('file-input').click();
    },
    
    /**
     * Handle file input change
     * @param {Event} event - The change event
     */
    handleFileInputChange: (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check if it's an SVG file
        if (!file.name.toLowerCase().endsWith('.svg')) {
            Utils.showModal('Error', 'Please select an SVG file.', null);
            return;
        }
        
        // Load the SVG file
        SvgParser.loadFromFile(file)
            .then(svgDoc => {
                // Get the SVG element
                const svgElement = svgDoc.documentElement;
                
                // Replace current SVG
                const svgCanvas = document.getElementById('svg-canvas');
                
                // Preserve the original dimensions and viewBox
                const width = svgElement.getAttribute('width') || svgCanvas.getAttribute('width');
                const height = svgElement.getAttribute('height') || svgCanvas.getAttribute('height');
                const viewBox = svgElement.getAttribute('viewBox') || svgCanvas.getAttribute('viewBox');
                
                svgElement.setAttribute('width', width);
                svgElement.setAttribute('height', height);
                svgElement.setAttribute('viewBox', viewBox);
                
                svgCanvas.parentNode.replaceChild(svgElement, svgCanvas);
                
                // Update the ID to maintain references
                svgElement.id = 'svg-canvas';
                
                // Reinitialize tools with the new SVG
                Tools.init(svgElement);
                
                // Update SVG code
                App.updateSvgCode();
                
                // Update layers
                App.updateLayers();
                
                // Update canvas size in status bar
                document.getElementById('canvas-size').textContent = `${width} × ${height}`;
            })
            .catch(error => {
                Utils.showModal('Error', `Failed to load SVG file: ${error.message}`, null);
            });
        
        // Reset the file input
        event.target.value = '';
    },
    
    /**
     * Handle save SVG button click
     */
    handleSaveSvg: () => {
        const svgCanvas = document.getElementById('svg-canvas');
        const svgString = SvgParser.svgToString(svgCanvas);
        
        Utils.downloadFile(svgString, 'svg-builder.svg', 'image/svg+xml');
    },
    
    /**
     * Handle export SVG button click
     */
    handleExportSvg: () => {
        Utils.showModal(
            'Export SVG',
            `
                <div class="form-group">
                    <label for="export-format">Format:</label>
                    <select id="export-format">
                        <option value="svg">SVG</option>
                        <option value="png">PNG</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="export-filename">Filename:</label>
                    <input type="text" id="export-filename" value="svg-builder">
                </div>
            `,
            () => {
                const format = document.getElementById('export-format').value;
                const filename = document.getElementById('export-filename').value || 'svg-builder';
                
                if (format === 'svg') {
                    // Export as SVG
                    const svgCanvas = document.getElementById('svg-canvas');
                    const svgString = SvgParser.svgToString(svgCanvas);
                    
                    Utils.downloadFile(svgString, `${filename}.svg`, 'image/svg+xml');
                } else if (format === 'png') {
                    // Export as PNG
                    UI.exportAsPng(filename);
                }
            }
        );
    },
    
    /**
     * Export SVG as PNG
     * @param {string} filename - The filename
     */
    exportAsPng: (filename) => {
        const svgCanvas = document.getElementById('svg-canvas');
        const svgString = SvgParser.svgToString(svgCanvas);
        
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const width = parseInt(svgCanvas.getAttribute('width'));
        const height = parseInt(svgCanvas.getAttribute('height'));
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // Create an image from the SVG
        const img = new Image();
        
        img.onload = () => {
            // Draw the image on the canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert canvas to PNG
            try {
                const dataUrl = canvas.toDataURL('image/png');
                
                // Create a download link
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = `${filename}.png`;
                a.click();
            } catch (error) {
                Utils.showModal('Error', `Failed to export as PNG: ${error.message}`, null);
            }
        };
        
        img.onerror = () => {
            Utils.showModal('Error', 'Failed to export as PNG', null);
        };
        
        // Set the source of the image
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    },
    
    /**
     * Handle clean SVG button click
     */
    handleCleanSvg: () => {
        const svgCanvas = document.getElementById('svg-canvas');
        const svgString = SvgParser.svgToString(svgCanvas);
        
        // Clean the SVG
        const cleanedSvgString = SvgCleaner.cleanSvgString(svgString);
        
        // Parse the cleaned SVG
        const svgDoc = SvgParser.parseSvgString(cleanedSvgString);
        const cleanedSvgElement = svgDoc.documentElement;
        
        // Preserve the original dimensions and viewBox
        const width = svgCanvas.getAttribute('width');
        const height = svgCanvas.getAttribute('height');
        const viewBox = svgCanvas.getAttribute('viewBox');
        
        cleanedSvgElement.setAttribute('width', width);
        cleanedSvgElement.setAttribute('height', height);
        cleanedSvgElement.setAttribute('viewBox', viewBox);
        
        // Replace current SVG
        svgCanvas.parentNode.replaceChild(cleanedSvgElement, svgCanvas);
        
        // Update the ID to maintain references
        cleanedSvgElement.id = 'svg-canvas';
        
        // Reinitialize tools with the new SVG
        Tools.init(cleanedSvgElement);
        
        // Update SVG code
        App.updateSvgCode();
        
        // Update layers
        App.updateLayers();
        
        // Show success message
        Utils.showModal('Success', 'SVG has been cleaned and optimized.', null);
    },
    
    /**
     * Handle zoom in button click
     */
    handleZoomIn: () => {
        const canvasWrapper = document.getElementById('canvas-wrapper');
        const zoomLevel = document.getElementById('zoom-level');
        
        // Get current zoom level
        let currentZoom = parseFloat(zoomLevel.textContent) || 100;
        
        // Increase zoom level
        currentZoom += 25;
        
        // Apply zoom
        UI.applyZoom(currentZoom);
    },
    
    /**
     * Handle zoom out button click
     */
    handleZoomOut: () => {
        const canvasWrapper = document.getElementById('canvas-wrapper');
        const zoomLevel = document.getElementById('zoom-level');
        
        // Get current zoom level
        let currentZoom = parseFloat(zoomLevel.textContent) || 100;
        
        // Decrease zoom level (minimum 25%)
        currentZoom = Math.max(25, currentZoom - 25);
        
        // Apply zoom
        UI.applyZoom(currentZoom);
    },
    
    /**
     * Apply zoom level
     * @param {number} zoom - The zoom level in percentage
     */
    applyZoom: (zoom) => {
        const svgCanvas = document.getElementById('svg-canvas');
        const zoomLevel = document.getElementById('zoom-level');
        
        // Apply zoom transform
        svgCanvas.style.transform = `scale(${zoom / 100})`;
        
        // Update zoom level display
        zoomLevel.textContent = `${zoom}%`;
    },
    
    /**
     * Handle toggle grid button click
     */
    handleToggleGrid: () => {
        const canvasWrapper = document.getElementById('canvas-wrapper');
        const toggleButton = document.getElementById('toggle-grid');
        
        // Toggle grid class
        canvasWrapper.classList.toggle('show-grid');
        
        // Toggle button active state
        toggleButton.classList.toggle('active');
        
        // Add grid if it doesn't exist
        if (canvasWrapper.classList.contains('show-grid')) {
            if (!document.getElementById('svg-grid')) {
                UI.createGrid();
            }
        }
    },
    
    /**
     * Create grid for the canvas
     */
    createGrid: () => {
        const canvasWrapper = document.getElementById('canvas-wrapper');
        const svgCanvas = document.getElementById('svg-canvas');
        
        // Get canvas dimensions
        const width = parseInt(svgCanvas.getAttribute('width'));
        const height = parseInt(svgCanvas.getAttribute('height'));
        
        // Create grid container
        const gridContainer = document.createElement('div');
        gridContainer.id = 'svg-grid';
        gridContainer.className = 'svg-grid';
        gridContainer.style.width = `${width}px`;
        gridContainer.style.height = `${height}px`;
        gridContainer.style.position = 'absolute';
        gridContainer.style.top = '0';
        gridContainer.style.left = '0';
        gridContainer.style.pointerEvents = 'none';
        gridContainer.style.backgroundImage = 'linear-gradient(#ddd 1px, transparent 1px), linear-gradient(90deg, #ddd 1px, transparent 1px)';
        gridContainer.style.backgroundSize = '20px 20px';
        
        // Insert grid before the SVG canvas
        canvasWrapper.insertBefore(gridContainer, svgCanvas);
    },
    
    /**
     * Handle toggle rulers button click
     */
    handleToggleRulers: () => {
        const canvasWrapper = document.getElementById('canvas-wrapper');
        const toggleButton = document.getElementById('toggle-rulers');
        
        // Toggle rulers class
        canvasWrapper.classList.toggle('show-rulers');
        
        // Toggle button active state
        toggleButton.classList.toggle('active');
        
        // Add rulers if they don't exist
        if (canvasWrapper.classList.contains('show-rulers')) {
            if (!document.getElementById('svg-rulers')) {
                UI.createRulers();
            }
        }
    },
    
    /**
     * Create rulers for the canvas
     */
    createRulers: () => {
        const canvasWrapper = document.getElementById('canvas-wrapper');
        const svgCanvas = document.getElementById('svg-canvas');
        
        // Get canvas dimensions
        const width = parseInt(svgCanvas.getAttribute('width'));
        const height = parseInt(svgCanvas.getAttribute('height'));
        
        // Create rulers container
        const rulersContainer = document.createElement('div');
        rulersContainer.id = 'svg-rulers';
        rulersContainer.className = 'svg-rulers';
        
        // Create horizontal ruler
        const horizontalRuler = document.createElement('div');
        horizontalRuler.className = 'ruler horizontal';
        horizontalRuler.style.width = `${width}px`;
        horizontalRuler.style.height = '20px';
        horizontalRuler.style.position = 'absolute';
        horizontalRuler.style.top = '-20px';
        horizontalRuler.style.left = '0';
        horizontalRuler.style.backgroundColor = '#f0f0f0';
        horizontalRuler.style.borderBottom = '1px solid #ccc';
        horizontalRuler.style.overflow = 'hidden';
        
        // Create vertical ruler
        const verticalRuler = document.createElement('div');
        verticalRuler.className = 'ruler vertical';
        verticalRuler.style.width = '20px';
        verticalRuler.style.height = `${height}px`;
        verticalRuler.style.position = 'absolute';
        verticalRuler.style.top = '0';
        verticalRuler.style.left = '-20px';
        verticalRuler.style.backgroundColor = '#f0f0f0';
        verticalRuler.style.borderRight = '1px solid #ccc';
        verticalRuler.style.overflow = 'hidden';
        
        // Add ruler markings
        for (let i = 0; i < width; i += 10) {
            const mark = document.createElement('div');
            mark.style.position = 'absolute';
            mark.style.left = `${i}px`;
            mark.style.top = '0';
            mark.style.width = '1px';
            mark.style.height = i % 50 === 0 ? '10px' : '5px';
            mark.style.backgroundColor = '#999';
            
            if (i % 100 === 0) {
                const label = document.createElement('div');
                label.style.position = 'absolute';
                label.style.left = `${i + 2}px`;
                label.style.top = '10px';
                label.style.fontSize = '9px';
                label.textContent = i;
                horizontalRuler.appendChild(label);
            }
            
            horizontalRuler.appendChild(mark);
        }
        
        for (let i = 0; i < height; i += 10) {
            const mark = document.createElement('div');
            mark.style.position = 'absolute';
            mark.style.top = `${i}px`;
            mark.style.left = '0';
            mark.style.height = '1px';
            mark.style.width = i % 50 === 0 ? '10px' : '5px';
            mark.style.backgroundColor = '#999';
            
            if (i % 100 === 0) {
                const label = document.createElement('div');
                label.style.position = 'absolute';
                label.style.top = `${i + 2}px`;
                label.style.left = '10px';
                label.style.fontSize = '9px';
                label.textContent = i;
                verticalRuler.appendChild(label);
            }
            
            verticalRuler.appendChild(mark);
        }
        
        // Add rulers to container
        rulersContainer.appendChild(horizontalRuler);
        rulersContainer.appendChild(verticalRuler);
        
        // Add container to canvas wrapper
        canvasWrapper.appendChild(rulersContainer);
    },
    
    /**
     * Close modal
     */
    closeModal: () => {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.classList.add('hidden');
    }
};

// Export the UI object
window.UI = UI; 