/**
 * SVG Builder - UI Module
 * Handles user interface interactions
 */

const UI = {
    // Modal related variables
    modalContainer: null,
    modalTitle: null,
    modalBody: null,
    modalCancelBtn: null,
    modalConfirmBtn: null,
    modalCloseBtn: null,
    
    // Current modal callback
    modalCallback: null,
    
    /**
     * Initialize UI components
     */
    init: () => {
        // Initialize modal elements
        UI.modalContainer = document.getElementById('modal-container');
        UI.modalTitle = document.getElementById('modal-title');
        UI.modalBody = document.getElementById('modal-body');
        UI.modalCancelBtn = document.getElementById('modal-cancel');
        UI.modalConfirmBtn = document.getElementById('modal-confirm');
        UI.modalCloseBtn = document.getElementById('modal-close');
        
        // Set up modal event listeners
        UI.setupModalEventListeners();
        
        // Set up toolbar button event listeners
        UI.setupToolbarEventListeners();
        
        // Set up canvas control listeners
        UI.setupCanvasControlListeners();
        
        // Set up code panel listeners
        UI.setupCodePanelListeners();
    },
    
    /**
     * Set up modal event listeners
     */
    setupModalEventListeners: () => {
        // Close modal when clicking backdrop or close button
        UI.modalContainer.querySelector('.modal-backdrop').addEventListener('click', UI.closeModal);
        UI.modalCloseBtn.addEventListener('click', UI.closeModal);
        UI.modalCancelBtn.addEventListener('click', UI.closeModal);
        
        // Handle confirm button click
        UI.modalConfirmBtn.addEventListener('click', () => {
            // Call the callback function if set
            if (UI.modalCallback) {
                UI.modalCallback();
            }
            UI.closeModal();
        });
    },
    
    /**
     * Show a modal dialog
     * @param {string} title - The title of the modal
     * @param {string|Node} content - The content to display (HTML string or DOM node)
     * @param {Function} callback - The callback function to execute when confirmed
     */
    showModal: (title, content, callback) => {
        UI.modalTitle.textContent = title;
        
        // Clear previous content
        while (UI.modalBody.firstChild) {
            UI.modalBody.removeChild(UI.modalBody.firstChild);
        }
        
        // Add new content
        if (typeof content === 'string') {
            UI.modalBody.innerHTML = content;
        } else {
            UI.modalBody.appendChild(content);
        }
        
        // Set callback
        UI.modalCallback = callback;
        
        // Show the modal
        UI.modalContainer.classList.remove('hidden');
    },
    
    /**
     * Set up toolbar button event listeners
     */
    setupToolbarEventListeners: () => {
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
        
        // Import MusicXML button
        document.getElementById('import-musicxml').addEventListener('click', UI.handleImportMusicXML);
        
        // Convert score button
        document.getElementById('convert-score').addEventListener('click', UI.handleConvertScore);
        
        // File input for opening SVG
        document.getElementById('file-input').addEventListener('change', UI.handleFileInputChange);
    },
    
    /**
     * Set up canvas control listeners
     */
    setupCanvasControlListeners: () => {
        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', UI.handleZoomIn);
        document.getElementById('zoom-out').addEventListener('click', UI.handleZoomOut);
        
        // View controls
        document.getElementById('toggle-grid').addEventListener('click', UI.handleToggleGrid);
        document.getElementById('toggle-rulers').addEventListener('click', UI.handleToggleRulers);
    },
    
    /**
     * Set up code panel listeners
     */
    setupCodePanelListeners: () => {
        // Format code button
        document.getElementById('format-code').addEventListener('click', () => {
            UI.updateSvgCode(); // Re-format the code
        });
        
        // Copy code button
        document.getElementById('copy-code').addEventListener('click', () => {
            const codeTextarea = document.getElementById('svg-code');
            codeTextarea.select();
            document.execCommand('copy');
            
            // Show a temporary success message
            const copyBtn = document.getElementById('copy-code');
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
            }, 1500);
        });
    },
    
    /**
     * Handle new SVG button click
     */
    handleNewSvg: () => {
        UI.showModal(
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
                UI.updateSvgCode();
                
                // Update layers
                UI.updateLayers();
                
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
            UI.showModal('Error', 'Please select an SVG file.', null);
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
                UI.updateSvgCode();
                
                // Update layers
                UI.updateLayers();
                
                // Update canvas size in status bar
                document.getElementById('canvas-size').textContent = `${width} × ${height}`;
            })
            .catch(error => {
                UI.showModal('Error', `Failed to load SVG file: ${error.message}`, null);
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
        
        UI.downloadFile(svgString, 'svg-builder.svg', 'image/svg+xml');
    },
    
    /**
     * Handle export SVG button click
     */
    handleExportSvg: () => {
        UI.showModal(
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
                    
                    UI.downloadFile(svgString, `${filename}.svg`, 'image/svg+xml');
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
                UI.showModal('Error', `Failed to export as PNG: ${error.message}`, null);
            }
        };
        
        img.onerror = () => {
            UI.showModal('Error', 'Failed to export as PNG', null);
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
        UI.updateSvgCode();
        
        // Update layers
        UI.updateLayers();
        
        // Show success message
        UI.showModal('Success', 'SVG has been cleaned and optimized.', null);
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
    },
    
    /**
     * Handle MusicXML import button click
     */
    handleImportMusicXML: () => {
        const template = document.getElementById('musicxml-import-template');
        const content = template.content.cloneNode(true);
        
        UI.showModal('Import MusicXML', content, () => {
            const source = document.getElementById('musicxml-source').value;
            
            if (source === 'file') {
                const fileInput = document.getElementById('musicxml-file');
                
                if (fileInput.files.length === 0) {
                    alert('Please select a MusicXML file.');
                    return;
                }
                
                UI.handleMusicXMLFileImport(fileInput.files[0]);
            } else if (source === 'url') {
                const example = document.getElementById('musicxml-example').value;
                UI.handleMusicXMLExampleImport(example);
            }
        });
        
        // Set up the source toggle
        const sourceSelect = content.querySelector('#musicxml-source');
        const fileInputContainer = content.querySelector('#file-input-container');
        const exampleInputContainer = content.querySelector('#example-input-container');
        
        sourceSelect.addEventListener('change', () => {
            const source = sourceSelect.value;
            
            if (source === 'file') {
                fileInputContainer.classList.remove('hidden');
                exampleInputContainer.classList.add('hidden');
            } else if (source === 'url') {
                fileInputContainer.classList.add('hidden');
                exampleInputContainer.classList.remove('hidden');
            }
        });
    },
    
    /**
     * Handle MusicXML file import
     * @param {File} file - The MusicXML file
     */
    handleMusicXMLFileImport: (file) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const xmlString = event.target.result;
                const xmlDoc = MusicXmlParser.parseXmlString(xmlString);
                
                // Check for parsing errors
                const parserError = xmlDoc.querySelector('parsererror');
                if (parserError) {
                    alert('MusicXML parsing error: ' + parserError.textContent);
                    return;
                }
                
                // Convert to SVG
                const svgElement = MusicXmlParser.convertToSvg(xmlDoc);
                
                // Replace current SVG content
                const svgCanvas = document.getElementById('svg-canvas');
                svgCanvas.innerHTML = '';
                
                // Copy attributes from the generated SVG
                Array.from(svgElement.attributes).forEach(attr => {
                    svgCanvas.setAttribute(attr.name, attr.value);
                });
                
                // Copy all child nodes
                Array.from(svgElement.childNodes).forEach(node => {
                    svgCanvas.appendChild(node.cloneNode(true));
                });
                
                // Update UI
                UI.updateLayers();
                UI.updateSvgCode();
            } catch (error) {
                alert('Error processing MusicXML file: ' + error.message);
            }
        };
        
        reader.onerror = () => {
            alert('Error reading MusicXML file.');
        };
        
        reader.readAsText(file);
    },
    
    /**
     * Handle MusicXML example import
     * @param {string} exampleName - The name of the example to import
     */
    handleMusicXMLExampleImport: async (exampleName) => {
        try {
            const xmlDoc = await MusicXmlParser.fetchExample(exampleName);
            
            // Convert to SVG
            const svgElement = MusicXmlParser.convertToSvg(xmlDoc);
            
            // Replace current SVG content
            const svgCanvas = document.getElementById('svg-canvas');
            svgCanvas.innerHTML = '';
            
            // Copy attributes from the generated SVG
            Array.from(svgElement.attributes).forEach(attr => {
                svgCanvas.setAttribute(attr.name, attr.value);
            });
            
            // Copy all child nodes
            Array.from(svgElement.childNodes).forEach(node => {
                svgCanvas.appendChild(node.cloneNode(true));
            });
            
            // Update UI
            UI.updateLayers();
            UI.updateSvgCode();
        } catch (error) {
            alert('Error importing MusicXML example: ' + error.message);
        }
    },
    
    /**
     * Handle convert score button click
     */
    handleConvertScore: () => {
        const svgCanvas = document.getElementById('svg-canvas');
        
        try {
            // Show loading modal
            UI.showModal('Converting Layout', 
                '<p>Converting to continuous layout...</p>', 
                null);
            
            // Use setTimeout to allow the UI to update before processing
            setTimeout(() => {
                // First, ask the user for the number of lines
                UI.closeModal();
                
                UI.showModal('Continuous Layout Options',
                    `
                    <div class="form-group">
                        <label for="num-lines">Number of lines:</label>
                        <select id="num-lines">
                            <option value="2">2 lines</option>
                            <option value="3">3 lines</option>
                        </select>
                    </div>
                    `,
                    () => {
                        const numLines = parseInt(document.getElementById('num-lines').value);
                        
                        // Show processing modal
                        UI.showModal('Processing', '<p>Arranging elements into continuous layout...</p>', null);
                        
                        // Use setTimeout to allow the UI to update
                        setTimeout(() => {
                            try {
                                // Convert to continuous layout using our new function
                                const continuousSvg = UI.convertToContinuousLayout(svgCanvas, numLines);
                                
                                // Replace current SVG content
                                svgCanvas.innerHTML = '';
                                
                                // Copy attributes from the generated SVG
                                Array.from(continuousSvg.attributes).forEach(attr => {
                                    svgCanvas.setAttribute(attr.name, attr.value);
                                });
                                
                                // Copy all child nodes
                                Array.from(continuousSvg.childNodes).forEach(node => {
                                    svgCanvas.appendChild(node.cloneNode(true));
                                });
                                
                                // Update UI
                                UI.updateLayers();
                                UI.updateSvgCode();
                                
                                // Close the loading modal
                                UI.closeModal();
                                
                                // Show success message
                                UI.showModal('Conversion Complete', 
                                    '<p>Successfully converted to continuous layout.</p>', 
                                    null);
                            } catch (error) {
                                UI.closeModal();
                                UI.showModal('Error', 
                                    `<p>Error converting layout: ${error.message}</p>`, 
                                    null);
                            }
                        }, 100);
                    }
                );
            }, 100);
        } catch (error) {
            UI.closeModal();
            UI.showModal('Error', 
                `<p>Error converting layout: ${error.message}</p>`, 
                null);
        }
    },
    
    /**
     * Update the layers panel
     */
    updateLayers: () => {
        const svgCanvas = document.getElementById('svg-canvas');
        const layersContainer = document.getElementById('layers-container');
        
        // Clear current layers
        layersContainer.innerHTML = '';
        
        // Get all top-level elements
        const elements = Array.from(svgCanvas.children);
        
        if (elements.length === 0) {
            const noLayersMessage = document.createElement('div');
            noLayersMessage.className = 'no-layers-message';
            noLayersMessage.textContent = 'No elements in SVG';
            layersContainer.appendChild(noLayersMessage);
            return;
        }
        
        // Create layer items in reverse order (to match z-index)
        elements.slice().reverse().forEach(element => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            layerItem.dataset.id = element.id || '';
            
            // Determine element type
            const type = element.tagName.toLowerCase();
            let name = type;
            
            // Try to get a more descriptive name
            if (element.id) {
                name = `${type} (${element.id})`;
            } else {
                // Generate a name based on attributes
                if (type === 'rect') {
                    const width = element.getAttribute('width') || '?';
                    const height = element.getAttribute('height') || '?';
                    name = `rect ${width}×${height}`;
                } else if (type === 'circle') {
                    const radius = element.getAttribute('r') || '?';
                    name = `circle (r=${radius})`;
                } else if (type === 'text') {
                    name = `text "${element.textContent.slice(0, 10)}${element.textContent.length > 10 ? '...' : ''}"`;
                } else if (type === 'g') {
                    const childCount = element.children.length;
                    name = `group (${childCount} elements)`;
                }
            }
            
            // Create visibility toggle
            const visibilityToggle = document.createElement('button');
            visibilityToggle.className = 'visibility-toggle';
            visibilityToggle.innerHTML = '<i class="fas fa-eye"></i>';
            visibilityToggle.title = 'Toggle visibility';
            
            visibilityToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                
                // Toggle visibility
                if (element.style.display === 'none') {
                    element.style.display = '';
                    visibilityToggle.innerHTML = '<i class="fas fa-eye"></i>';
                } else {
                    element.style.display = 'none';
                    visibilityToggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
                }
                
                UI.updateSvgCode();
            });
            
            // Create layer name
            const layerName = document.createElement('span');
            layerName.className = 'layer-name';
            layerName.textContent = name;
            
            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.title = 'Delete element';
            
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                
                // Remove the element
                element.parentNode.removeChild(element);
                
                // Update UI
                UI.updateLayers();
                UI.updateSvgCode();
                
                // Clear selection if the deleted element was selected
                if (Tools.selectedElement === element) {
                    Tools.clearSelection();
                }
            });
            
            // Add the components
            layerItem.appendChild(visibilityToggle);
            layerItem.appendChild(layerName);
            layerItem.appendChild(deleteBtn);
            
            // Select this element when clicking the layer
            layerItem.addEventListener('click', () => {
                Tools.selectElement(element);
            });
            
            // Add to layers container
            layersContainer.appendChild(layerItem);
        });
    },
    
    /**
     * Update the SVG code display
     */
    updateSvgCode: () => {
        const svgCanvas = document.getElementById('svg-canvas');
        const codeTextarea = document.getElementById('svg-code');
        
        // Get the SVG as a string
        const svgString = SvgParser.svgToString(svgCanvas);
        
        // Format the SVG string with indentation
        const formattedSvg = UI.formatXml(svgString);
        
        // Update the textarea
        codeTextarea.value = formattedSvg;
    },

    /**
     * Download a file to the user's device
     * @param {string} content - The content of the file
     * @param {string} filename - The name of the file
     * @param {string} mimeType - The MIME type of the file
     */
    downloadFile: (content, filename, mimeType) => {
        // Create a Blob from the content
        const blob = new Blob([content], { type: mimeType });
        
        // Create a download link
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        
        // Append the link to the body, click it, and remove it
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Release the blob URL
        URL.revokeObjectURL(a.href);
    },

    /**
     * Format XML with indentation
     * @param {string} xml - The XML string to format
     * @returns {string} The formatted XML string
     */
    formatXml: (xml) => {
        // Replace all self-closing tags properly
        xml = xml.replace(/<([^\s>]+)([^>]*)\/>/g, '<$1$2></$1>');
        
        let formatted = '';
        let indent = '';
        
        // Split the XML by tags
        const nodes = xml.split(/(<\/?[^>]+>)/g);
        
        // Keep track of if we're in a text node
        let isTextNode = false;
        
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i].trim();
            
            if (!node) continue;
            
            // Check if it's a closing tag
            if (node.startsWith('</')) {
                indent = indent.substring(2);
                
                if (!isTextNode) {
                    formatted += indent;
                }
                
                formatted += node;
                isTextNode = false;
            } 
            // Check if it's an opening tag
            else if (node.startsWith('<')) {
                if (!isTextNode) {
                    formatted += indent;
                }
                
                formatted += node;
                
                // Don't increase indent for self-closing tags or processing instructions
                if (!node.endsWith('/>') && !node.startsWith('<?') && !node.startsWith('<!')) {
                    indent += '  ';
                    isTextNode = true;
                } else {
                    isTextNode = false;
                }
            } 
            // It's a text node
            else {
                formatted += node;
                isTextNode = false;
            }
            
            // Add a new line if not in a text node
            if (!isTextNode) {
                formatted += '\n';
            }
        }
        
        return formatted;
    },

    /**
     * Convert SVG elements to a continuous layout arrangement
     * @param {SVGElement} svgElement - The SVG element to convert
     * @param {number} numLines - Number of lines to arrange content into (2 or 3)
     * @returns {SVGElement} A new SVG element with continuous layout
     */
    convertToContinuousLayout: (svgElement, numLines = 2) => {
        // Clone the original SVG to avoid modifying it directly
        const clonedSvg = svgElement.cloneNode(true);
        
        // Create a new SVG element for the continuous layout
        const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        
        // Get all top-level elements
        const elements = Array.from(clonedSvg.children);
        
        if (elements.length === 0) {
            return clonedSvg; // Nothing to convert
        }
        
        // Get original dimensions
        const originalWidth = parseInt(clonedSvg.getAttribute('width') || 800);
        const originalHeight = parseInt(clonedSvg.getAttribute('height') || 600);
        
        // Calculate dimensions for the new layout
        const newWidth = originalWidth * 2; // Make it wider for continuous display
        let totalHeight = 0;
        
        // First, try to detect if this is a music score
        const isMusicScore = elements.some(el => {
            // Check for common music notation elements
            const isGroup = el.tagName.toLowerCase() === 'g';
            if (!isGroup) return false;
            
            // Look for clefs, staff lines, or music text elements
            const hasStaffLines = el.querySelector('path[d*="M"][d*="H"]') !== null;
            const hasClef = el.querySelector('path[d*="C"][d*="A"][d*="Z"]') !== null;
            const hasNotes = el.querySelector('ellipse, circle') !== null;
            
            return hasStaffLines || hasClef || hasNotes;
        });
        
        if (isMusicScore) {
            // For music scores, detect systems (groups of staves)
            let systems = [];
            let currentSystem = [];
            let lastY = -1;
            
            // Sort all elements by Y position first
            const sortedElements = [...elements].sort((a, b) => {
                const aY = parseFloat(a.getAttribute('transform')?.match(/translate\([^,]+,\s*([^)]+)\)/)?.at(1) || 0);
                const bY = parseFloat(b.getAttribute('transform')?.match(/translate\([^,]+,\s*([^)]+)\)/)?.at(1) || 0);
                return aY - bY;
            });
            
            // Group elements into systems based on vertical proximity
            sortedElements.forEach((el, index) => {
                const transform = el.getAttribute('transform');
                const yMatch = transform?.match(/translate\([^,]+,\s*([^)]+)\)/);
                const y = parseFloat(yMatch?.at(1) || index * 100);
                
                // If this element is far from the last one, it's likely a new system
                if (lastY >= 0 && Math.abs(y - lastY) > 80) {
                    systems.push([...currentSystem]);
                    currentSystem = [];
                }
                
                currentSystem.push(el);
                lastY = y;
            });
            
            // Don't forget the last system
            if (currentSystem.length > 0) {
                systems.push(currentSystem);
            }
            
            // If we couldn't detect systems properly, fallback to treating each element as its own system
            if (systems.length === 0) {
                systems = elements.map(el => [el]);
            }
            
            // Consolidate the systems into the requested number of lines
            const consolidatedSystems = [];
            for (let i = 0; i < numLines; i++) {
                consolidatedSystems.push([]);
            }
            
            // Distribute systems across the requested number of lines
            systems.forEach((system, index) => {
                const lineIndex = index % numLines;
                consolidatedSystems[lineIndex].push(...system);
            });
            
            // Calculate the height needed for each consolidated system
            const lineHeight = originalHeight / systems.length;
            totalHeight = lineHeight * numLines;
            
            // Set attributes for the new SVG
            newSvg.setAttribute('width', newWidth.toString());
            newSvg.setAttribute('height', totalHeight.toString());
            newSvg.setAttribute('viewBox', `0 0 ${newWidth} ${totalHeight}`);
            newSvg.setAttribute('data-format', 'continuous');
            
            // Copy other attributes from the original SVG
            Array.from(clonedSvg.attributes).forEach(attr => {
                if (!['width', 'height', 'viewBox'].includes(attr.name)) {
                    newSvg.setAttribute(attr.name, attr.value);
                }
            });
            
            // Position systems in their new locations
            consolidatedSystems.forEach((lineElements, lineIndex) => {
                let currentX = 0;
                
                lineElements.forEach(el => {
                    // Create a clone of the element
                    const clone = el.cloneNode(true);
                    
                    // Get original transform
                    let transformX = 0;
                    let transformY = 0;
                    const transform = clone.getAttribute('transform');
                    
                    if (transform) {
                        const matches = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                        if (matches) {
                            transformX = parseFloat(matches[1]);
                            transformY = parseFloat(matches[2]);
                        }
                    }
                    
                    // Update transform to position in the new layout
                    clone.setAttribute('transform', `translate(${currentX}, ${lineIndex * lineHeight})`);
                    
                    // Add to SVG
                    newSvg.appendChild(clone);
                    
                    // Update current X position - each system takes original width
                    currentX += originalWidth / systems.length;
                });
            });
            
            return newSvg;
        }
        
        // Non-music score handling (original implementation)
        // Calculate bounding boxes for all elements
        const elementInfo = elements.map(el => {
            let bbox;
            
            // For groups, calculate bounding box of all children
            if (el.tagName.toLowerCase() === 'g') {
                // Find min/max coordinates of all child elements
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                
                Array.from(el.querySelectorAll('*')).forEach(child => {
                    // Skip elements without getBBox
                    if (typeof child.getBBox !== 'function') return;
                    
                    try {
                        const childBox = child.getBBox();
                        minX = Math.min(minX, childBox.x);
                        minY = Math.min(minY, childBox.y);
                        maxX = Math.max(maxX, childBox.x + childBox.width);
                        maxY = Math.max(maxY, childBox.y + childBox.height);
                    } catch (e) {
                        // Ignore elements that can't compute bounding box
                    }
                });
                
                // If valid bounds were found
                if (minX !== Infinity && minY !== Infinity && maxX !== -Infinity && maxY !== -Infinity) {
                    bbox = {
                        x: minX,
                        y: minY,
                        width: maxX - minX,
                        height: maxY - minY
                    };
                } else {
                    // Fallback for groups with no valid children
                    bbox = { x: 0, y: 0, width: 100, height: 100 };
                }
            } else {
                // For regular elements, use getBBox if available
                try {
                    bbox = el.getBBox();
                } catch (e) {
                    // Fallback for elements that can't compute bounding box
                    bbox = { 
                        x: parseFloat(el.getAttribute('x') || 0),
                        y: parseFloat(el.getAttribute('y') || 0),
                        width: parseFloat(el.getAttribute('width') || 100),
                        height: parseFloat(el.getAttribute('height') || 100)
                    };
                }
            }
            
            return { element: el, bbox };
        });
        
        // Sort elements by their y-position (top to bottom)
        elementInfo.sort((a, b) => a.bbox.y - b.bbox.y);
        
        // Calculate total height and line height
        const lineHeight = Math.max(...elementInfo.map(info => info.bbox.height));
        const padding = lineHeight * 0.2; // 20% padding between lines
        
        // Organize elements into lines
        const lines = [];
        for (let i = 0; i < numLines; i++) {
            lines.push([]);
        }
        
        // Distribute elements evenly across lines
        elementInfo.forEach((info, index) => {
            const lineIndex = index % numLines;
            lines[lineIndex].push(info);
        });
        
        // Calculate new total height
        totalHeight = (lineHeight + padding) * numLines;
        
        // Set attributes for the new SVG
        newSvg.setAttribute('width', newWidth.toString());
        newSvg.setAttribute('height', totalHeight.toString());
        newSvg.setAttribute('viewBox', `0 0 ${newWidth} ${totalHeight}`);
        newSvg.setAttribute('data-format', 'continuous');
        
        // Copy other attributes from the original SVG
        Array.from(clonedSvg.attributes).forEach(attr => {
            if (!['width', 'height', 'viewBox'].includes(attr.name)) {
                newSvg.setAttribute(attr.name, attr.value);
            }
        });
        
        // Position elements in their new locations
        lines.forEach((line, lineIndex) => {
            // Sort elements in this line by x-position (left to right)
            line.sort((a, b) => a.bbox.x - b.bbox.x);
            
            // Position each element in the line
            let currentX = 0;
            line.forEach(info => {
                const el = info.element;
                const bbox = info.bbox;
                
                // Create a group for this element if not already a group
                let elementGroup;
                if (el.tagName.toLowerCase() === 'g') {
                    elementGroup = el;
                } else {
                    elementGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    elementGroup.appendChild(el.cloneNode(true));
                }
                
                // Calculate translation
                const translateX = currentX - bbox.x;
                const translateY = (lineHeight + padding) * lineIndex - bbox.y;
                
                // Apply translation
                elementGroup.setAttribute('transform', `translate(${translateX}, ${translateY})`);
                
                // Add to SVG
                newSvg.appendChild(elementGroup);
                
                // Update current X position
                currentX += bbox.width + padding;
            });
        });
        
        return newSvg;
    }
};

// Export the UI object
window.UI = UI; 