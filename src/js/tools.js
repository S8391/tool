/**
 * SVG Builder - Tools Module
 * Handles drawing tools and interactions
 */

const Tools = {
    // Current active tool
    activeTool: 'select',
    
    // Currently selected element
    selectedElement: null,
    
    // SVG canvas element
    svgCanvas: null,
    
    // Start point for drawing
    startPoint: { x: 0, y: 0 },
    
    // Current drawing element
    currentElement: null,
    
    // Dragging state
    isDragging: false,
    
    // Resize handles
    resizeHandles: [],
    
    // For freehand drawing
    pathPoints: [],
    
    /**
     * Initialize tools
     * @param {SVGElement} svgCanvas - The SVG canvas element
     */
    init: (svgCanvas) => {
        Tools.svgCanvas = svgCanvas;
        Tools.setupEventListeners();
        Tools.setupToolButtons();
    },
    
    /**
     * Set up event listeners for the SVG canvas
     */
    setupEventListeners: () => {
        const canvas = Tools.svgCanvas;
        
        canvas.addEventListener('mousedown', Tools.handleMouseDown);
        canvas.addEventListener('mousemove', Tools.handleMouseMove);
        canvas.addEventListener('mouseup', Tools.handleMouseUp);
        canvas.addEventListener('mouseleave', Tools.handleMouseUp);
        
        // Update cursor position in status bar
        canvas.addEventListener('mousemove', (event) => {
            const position = Utils.getMousePosition(event, canvas);
            document.getElementById('cursor-position').textContent = 
                `X: ${Math.round(position.x)} Y: ${Math.round(position.y)}`;
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', Tools.handleKeyDown);
    },
    
    /**
     * Set up tool buttons
     */
    setupToolButtons: () => {
        const toolButtons = document.querySelectorAll('.tool-btn');
        
        toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                toolButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Set active tool
                Tools.activeTool = button.id.replace('-tool', '');
                
                // Clear selection if switching to a drawing tool
                if (Tools.activeTool !== 'select') {
                    Tools.clearSelection();
                }
            });
        });
    },
    
    /**
     * Handle mouse down event
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseDown: (event) => {
        const position = Utils.getMousePosition(event, Tools.svgCanvas);
        Tools.startPoint = position;
        
        switch (Tools.activeTool) {
            case 'select':
                Tools.handleSelectStart(position);
                break;
            case 'rect':
                Tools.startRectangle(position);
                break;
            case 'circle':
                Tools.startCircle(position);
                break;
            case 'line':
                Tools.startLine(position);
                break;
            case 'path':
                Tools.startPath(position);
                break;
            case 'text':
                Tools.createText(position);
                break;
            case 'freehand':
                Tools.startFreehand(position);
                break;
            case 'eraser':
                Tools.eraseElement(position);
                break;
        }
    },
    
    /**
     * Handle mouse move event
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseMove: (event) => {
        if (!Tools.isDragging) return;
        
        const position = Utils.getMousePosition(event, Tools.svgCanvas);
        
        switch (Tools.activeTool) {
            case 'select':
                Tools.moveSelected(position);
                break;
            case 'rect':
                Tools.updateRectangle(position);
                break;
            case 'circle':
                Tools.updateCircle(position);
                break;
            case 'line':
                Tools.updateLine(position);
                break;
            case 'path':
                Tools.updatePath(position);
                break;
            case 'freehand':
                Tools.continueFreehand(position);
                break;
            case 'eraser':
                Tools.eraseElement(position);
                break;
        }
    },
    
    /**
     * Handle mouse up event
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseUp: (event) => {
        if (!Tools.isDragging) return;
        
        switch (Tools.activeTool) {
            case 'select':
                Tools.endMove();
                break;
            case 'rect':
                Tools.finishRectangle();
                break;
            case 'circle':
                Tools.finishCircle();
                break;
            case 'line':
                Tools.finishLine();
                break;
            case 'path':
                Tools.finishPath();
                break;
            case 'freehand':
                Tools.endFreehand();
                break;
        }
        
        Tools.isDragging = false;
    },
    
    /**
     * Handle key down event
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown: (event) => {
        // Delete selected element
        if ((event.key === 'Delete' || event.key === 'Backspace') && Tools.selectedElement) {
            Tools.deleteSelected();
            event.preventDefault();
        }
        
        // Copy with Ctrl+C
        if (event.key === 'c' && (event.ctrlKey || event.metaKey) && Tools.selectedElement) {
            Tools.copySelected();
            event.preventDefault();
        }
        
        // Cut with Ctrl+X
        if (event.key === 'x' && (event.ctrlKey || event.metaKey) && Tools.selectedElement) {
            Tools.cutSelected();
            event.preventDefault();
        }
        
        // Paste with Ctrl+V
        if (event.key === 'v' && (event.ctrlKey || event.metaKey)) {
            Tools.pasteSelected();
            event.preventDefault();
        }
    },
    
    /**
     * Handle select tool start
     * @param {Object} position - The mouse position
     */
    handleSelectStart: (position) => {
        // Check if clicked on an element
        const element = document.elementFromPoint(position.x, position.y);
        
        if (element && element !== Tools.svgCanvas && element.parentNode === Tools.svgCanvas) {
            Tools.selectElement(element);
            Tools.isDragging = true;
        } else {
            Tools.clearSelection();
        }
    },
    
    /**
     * Handle select tool move
     * @param {Object} position - The mouse position
     */
    handleSelectMove: (position) => {
        if (!Tools.selectedElement) return;
        
        // Calculate the movement delta
        const dx = position.x - Tools.startPoint.x;
        const dy = position.y - Tools.startPoint.y;
        
        // Get current transform or create a new one
        let transform = Tools.selectedElement.getAttribute('transform') || '';
        
        // Extract existing translate if any
        let existingTranslate = transform.match(/translate\(([^)]+)\)/);
        let tx = 0, ty = 0;
        
        if (existingTranslate) {
            const parts = existingTranslate[1].split(/[\s,]+/);
            tx = parseFloat(parts[0]) || 0;
            ty = parseFloat(parts[1]) || 0;
            
            // Remove existing translate
            transform = transform.replace(/translate\([^)]+\)/, '');
        }
        
        // Apply new translate
        const newTransform = `translate(${tx + dx}, ${ty + dy}) ${transform}`;
        Tools.selectedElement.setAttribute('transform', newTransform);
        
        // Update start point for next move
        Tools.startPoint = position;
        
        // Update properties panel
        Properties.updatePropertiesPanel(Tools.selectedElement);
    },
    
    /**
     * Handle select tool end
     * @param {Object} position - The mouse position
     */
    handleSelectEnd: (position) => {
        Tools.isDragging = false;
        App.updateSvgCode();
    },
    
    /**
     * Select an element
     * @param {SVGElement} element - The element to select
     */
    selectElement: (element) => {
        // Clear previous selection
        Tools.clearSelection();
        
        // Set new selection
        Tools.selectedElement = element;
        
        // Highlight selected element
        element.setAttribute('data-selected', 'true');
        element.style.outline = '2px dashed #4a6cf7';
        
        // Update properties panel
        Properties.updatePropertiesPanel(element);
        
        // Create resize handles
        Tools.createResizeHandles(element);
    },
    
    /**
     * Clear current selection
     */
    clearSelection: () => {
        if (Tools.selectedElement) {
            Tools.selectedElement.removeAttribute('data-selected');
            Tools.selectedElement.style.outline = '';
            Tools.selectedElement = null;
        }
        
        // Remove resize handles
        Tools.removeResizeHandles();
        
        // Update properties panel
        Properties.updatePropertiesPanel(null);
    },
    
    /**
     * Create resize handles for selected element
     * @param {SVGElement} element - The selected element
     */
    createResizeHandles: (element) => {
        // Remove existing handles
        Tools.removeResizeHandles();
        
        // Get bounding box
        const bbox = SvgParser.getBoundingBox(element);
        
        // Create handles at corners and midpoints
        const handlePositions = [
            { x: bbox.x, y: bbox.y, cursor: 'nw-resize' },
            { x: bbox.x + bbox.width / 2, y: bbox.y, cursor: 'n-resize' },
            { x: bbox.x + bbox.width, y: bbox.y, cursor: 'ne-resize' },
            { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2, cursor: 'e-resize' },
            { x: bbox.x + bbox.width, y: bbox.y + bbox.height, cursor: 'se-resize' },
            { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height, cursor: 's-resize' },
            { x: bbox.x, y: bbox.y + bbox.height, cursor: 'sw-resize' },
            { x: bbox.x, y: bbox.y + bbox.height / 2, cursor: 'w-resize' }
        ];
        
        handlePositions.forEach((pos, index) => {
            const handle = Utils.createSvgElement('rect');
            Utils.setSvgAttributes(handle, {
                x: pos.x - 4,
                y: pos.y - 4,
                width: 8,
                height: 8,
                fill: 'white',
                stroke: '#4a6cf7',
                'stroke-width': 1,
                'data-handle-index': index,
                'data-handle-type': 'resize',
                style: `cursor: ${pos.cursor}`
            });
            
            Tools.svgCanvas.appendChild(handle);
            Tools.resizeHandles.push(handle);
        });
    },
    
    /**
     * Remove resize handles
     */
    removeResizeHandles: () => {
        Tools.resizeHandles.forEach(handle => {
            if (handle.parentNode) {
                handle.parentNode.removeChild(handle);
            }
        });
        
        Tools.resizeHandles = [];
    },
    
    /**
     * Start drawing a rectangle
     * @param {Object} position - The start position
     */
    startRectangle: (position) => {
        const rect = Utils.createSvgElement('rect');
        Utils.setSvgAttributes(rect, {
            x: position.x,
            y: position.y,
            width: 0,
            height: 0,
            fill: 'none',
            stroke: 'black',
            'stroke-width': 2,
            id: Utils.generateId()
        });
        
        Tools.svgCanvas.appendChild(rect);
        Tools.currentElement = rect;
        Tools.isDragging = true;
    },
    
    /**
     * Update rectangle during drawing
     * @param {Object} position - The current position
     */
    updateRectangle: (position) => {
        if (!Tools.currentElement) return;
        
        const startX = parseFloat(Tools.currentElement.getAttribute('x'));
        const startY = parseFloat(Tools.currentElement.getAttribute('y'));
        
        let width = position.x - startX;
        let height = position.y - startY;
        
        // Handle negative dimensions
        if (width < 0) {
            Tools.currentElement.setAttribute('x', position.x);
            Tools.currentElement.setAttribute('width', -width);
        } else {
            Tools.currentElement.setAttribute('width', width);
        }
        
        if (height < 0) {
            Tools.currentElement.setAttribute('y', position.y);
            Tools.currentElement.setAttribute('height', -height);
        } else {
            Tools.currentElement.setAttribute('height', height);
        }
    },
    
    /**
     * Finish drawing a rectangle
     * @param {Object} position - The end position
     */
    finishRectangle: (position) => {
        if (!Tools.currentElement) return;
        
        const width = parseFloat(Tools.currentElement.getAttribute('width'));
        const height = parseFloat(Tools.currentElement.getAttribute('height'));
        
        // Remove tiny rectangles
        if (width < 5 || height < 5) {
            Tools.svgCanvas.removeChild(Tools.currentElement);
        } else {
            // Select the created rectangle
            Tools.selectElement(Tools.currentElement);
            App.updateSvgCode();
            App.updateLayers();
        }
    },
    
    /**
     * Start drawing a circle
     * @param {Object} position - The start position
     */
    startCircle: (position) => {
        const circle = Utils.createSvgElement('circle');
        Utils.setSvgAttributes(circle, {
            cx: position.x,
            cy: position.y,
            r: 0,
            fill: 'none',
            stroke: 'black',
            'stroke-width': 2,
            id: Utils.generateId()
        });
        
        Tools.svgCanvas.appendChild(circle);
        Tools.currentElement = circle;
        Tools.isDragging = true;
    },
    
    /**
     * Update circle during drawing
     * @param {Object} position - The current position
     */
    updateCircle: (position) => {
        if (!Tools.currentElement) return;
        
        const cx = parseFloat(Tools.currentElement.getAttribute('cx'));
        const cy = parseFloat(Tools.currentElement.getAttribute('cy'));
        
        const dx = position.x - cx;
        const dy = position.y - cy;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        Tools.currentElement.setAttribute('r', radius);
    },
    
    /**
     * Finish drawing a circle
     * @param {Object} position - The end position
     */
    finishCircle: (position) => {
        if (!Tools.currentElement) return;
        
        const radius = parseFloat(Tools.currentElement.getAttribute('r'));
        
        // Remove tiny circles
        if (radius < 5) {
            Tools.svgCanvas.removeChild(Tools.currentElement);
        } else {
            // Select the created circle
            Tools.selectElement(Tools.currentElement);
            App.updateSvgCode();
            App.updateLayers();
        }
    },
    
    /**
     * Start drawing a line
     * @param {Object} position - The start position
     */
    startLine: (position) => {
        const line = Utils.createSvgElement('line');
        Utils.setSvgAttributes(line, {
            x1: position.x,
            y1: position.y,
            x2: position.x,
            y2: position.y,
            stroke: 'black',
            'stroke-width': 2,
            id: Utils.generateId()
        });
        
        Tools.svgCanvas.appendChild(line);
        Tools.currentElement = line;
        Tools.isDragging = true;
    },
    
    /**
     * Update line during drawing
     * @param {Object} position - The current position
     */
    updateLine: (position) => {
        if (!Tools.currentElement) return;
        
        Tools.currentElement.setAttribute('x2', position.x);
        Tools.currentElement.setAttribute('y2', position.y);
    },
    
    /**
     * Finish drawing a line
     * @param {Object} position - The end position
     */
    finishLine: (position) => {
        if (!Tools.currentElement) return;
        
        const x1 = parseFloat(Tools.currentElement.getAttribute('x1'));
        const y1 = parseFloat(Tools.currentElement.getAttribute('y1'));
        const x2 = parseFloat(Tools.currentElement.getAttribute('x2'));
        const y2 = parseFloat(Tools.currentElement.getAttribute('y2'));
        
        // Calculate line length
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Remove tiny lines
        if (length < 5) {
            Tools.svgCanvas.removeChild(Tools.currentElement);
        } else {
            // Select the created line
            Tools.selectElement(Tools.currentElement);
            App.updateSvgCode();
            App.updateLayers();
        }
    },
    
    /**
     * Start drawing a path
     * @param {Object} position - The start position
     */
    startPath: (position) => {
        const path = Utils.createSvgElement('path');
        const d = `M ${position.x} ${position.y}`;
        
        Utils.setSvgAttributes(path, {
            d: d,
            fill: 'none',
            stroke: 'black',
            'stroke-width': 2,
            id: Utils.generateId()
        });
        
        Tools.svgCanvas.appendChild(path);
        Tools.currentElement = path;
        Tools.isDragging = true;
    },
    
    /**
     * Update path during drawing
     * @param {Object} position - The current position
     */
    updatePath: (position) => {
        if (!Tools.currentElement) return;
        
        const d = Tools.currentElement.getAttribute('d');
        const newD = `${d} L ${position.x} ${position.y}`;
        
        Tools.currentElement.setAttribute('d', newD);
    },
    
    /**
     * Finish drawing a path
     * @param {Object} position - The end position
     */
    finishPath: (position) => {
        if (!Tools.currentElement) return;
        
        // Select the created path
        Tools.selectElement(Tools.currentElement);
        App.updateSvgCode();
        App.updateLayers();
    },
    
    /**
     * Start adding text
     * @param {Object} position - The position for the text
     */
    startText: (position) => {
        const text = Utils.createSvgElement('text');
        Utils.setSvgAttributes(text, {
            x: position.x,
            y: position.y,
            'font-family': 'Arial',
            'font-size': '16',
            fill: 'black',
            id: Utils.generateId()
        });
        
        text.textContent = 'Text';
        
        Tools.svgCanvas.appendChild(text);
        Tools.selectElement(text);
        App.updateSvgCode();
        App.updateLayers();
    },
    
    /**
     * Start freehand drawing
     * @param {Object} position - The starting position
     */
    startFreehand: (position) => {
        // Reset path points
        Tools.pathPoints = [position];
        
        // Create a new path element
        const path = Utils.createSvgElement('path');
        Utils.setSvgAttributes(path, {
            d: `M ${position.x} ${position.y}`,
            fill: 'none',
            stroke: 'black',
            'stroke-width': 2,
            id: Utils.generateId()
        });
        
        // Add the path to the canvas
        Tools.svgCanvas.appendChild(path);
        Tools.currentElement = path;
        
        // Start dragging
        Tools.isDragging = true;
    },
    
    /**
     * Continue freehand drawing
     * @param {Object} position - The current position
     */
    continueFreehand: (position) => {
        if (!Tools.isDragging || !Tools.currentElement) return;
        
        // Add the new point
        Tools.pathPoints.push(position);
        
        // Update the path data
        const pathData = Tools.pathPoints.reduce((data, point, index) => {
            return index === 0 ? 
                `M ${point.x} ${point.y}` : 
                `${data} L ${point.x} ${point.y}`;
        }, '');
        
        // Update the path element
        Tools.currentElement.setAttribute('d', pathData);
    },
    
    /**
     * End freehand drawing
     */
    endFreehand: () => {
        if (!Tools.isDragging || !Tools.currentElement) return;
        
        // If we only have a few points, simplify to a line or remove
        if (Tools.pathPoints.length < 3) {
            if (Tools.pathPoints.length === 2) {
                // Convert to a line
                const start = Tools.pathPoints[0];
                const end = Tools.pathPoints[1];
                
                const line = Utils.createSvgElement('line');
                Utils.setSvgAttributes(line, {
                    x1: start.x,
                    y1: start.y,
                    x2: end.x,
                    y2: end.y,
                    stroke: 'black',
                    'stroke-width': 2,
                    id: Utils.generateId()
                });
                
                Tools.svgCanvas.replaceChild(line, Tools.currentElement);
                Tools.currentElement = line;
            } else {
                // Remove the element if it's just a point
                Tools.svgCanvas.removeChild(Tools.currentElement);
                Tools.currentElement = null;
            }
        } else {
            // Simplify the path if it has many points
            if (Tools.pathPoints.length > 20) {
                const simplifiedPoints = Utils.simplifyPath(Tools.pathPoints, 2);
                
                const pathData = simplifiedPoints.reduce((data, point, index) => {
                    return index === 0 ? 
                        `M ${point.x} ${point.y}` : 
                        `${data} L ${point.x} ${point.y}`;
                }, '');
                
                Tools.currentElement.setAttribute('d', pathData);
            }
        }
        
        // Reset state
        Tools.isDragging = false;
        if (Tools.currentElement) {
            // Notify about the new element
            UI.updateLayers();
            UI.updateSvgCode();
        }
        Tools.currentElement = null;
        Tools.pathPoints = [];
    },
    
    /**
     * Erase element at the given position
     * @param {Object} position - The position
     */
    eraseElement: (position) => {
        // Find the element under the cursor
        const element = Utils.getElementAtPosition(Tools.svgCanvas, position);
        
        if (element && element !== Tools.svgCanvas) {
            // Remove the element
            element.parentNode.removeChild(element);
            
            // Update UI
            Tools.clearSelection();
            UI.updateLayers();
            UI.updateSvgCode();
        }
    },
    
    /**
     * Delete the selected element
     */
    deleteSelected: () => {
        if (!Tools.selectedElement) return;
        
        // Remove the element
        Tools.selectedElement.parentNode.removeChild(Tools.selectedElement);
        
        // Clear selection
        Tools.clearSelection();
        
        // Update UI
        UI.updateLayers();
        UI.updateSvgCode();
    },
    
    /**
     * Copy the selected element
     */
    copySelected: () => {
        if (!Tools.selectedElement) return;
        
        const clone = SvgParser.cloneElement(Tools.selectedElement);
        clone.id = Utils.generateId();
        
        // Offset the clone slightly
        const transform = clone.getAttribute('transform') || '';
        clone.setAttribute('transform', transform + ' translate(10, 10)');
        
        Tools.svgCanvas.appendChild(clone);
        Tools.selectElement(clone);
        App.updateSvgCode();
        App.updateLayers();
    },
    
    /**
     * Cut the selected element
     */
    cutSelected: () => {
        if (!Tools.selectedElement) return;
        
        // Copy the selected element
        Tools.copySelected();
        
        // Remove the selected element
        Tools.deleteSelected();
    },
    
    /**
     * Paste the copied element
     */
    pasteSelected: () => {
        if (!Tools.selectedElement) return;
        
        const clipboardData = document.getElementById('clipboard-data').value;
        if (!clipboardData) return;
        
        const svgDoc = new DOMParser().parseFromString(clipboardData, 'image/svg+xml');
        const pastedElement = svgDoc.documentElement;
        
        // Apply transform to pasted element
        const transform = Tools.selectedElement.getAttribute('transform') || '';
        pastedElement.setAttribute('transform', transform);
        
        // Add the pasted element to the canvas
        Tools.svgCanvas.appendChild(pastedElement);
        Tools.selectElement(pastedElement);
        App.updateSvgCode();
        App.updateLayers();
    }
};

// Add Utilities for path simplification
Utils.distance = (p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
};

Utils.pointToLineDistance = (p, a, b) => {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const abLength = Math.sqrt(abx * abx + aby * aby);
    
    if (abLength === 0) return Utils.distance(p, a);
    
    const t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / (abLength * abLength);
    
    if (t < 0) return Utils.distance(p, a);
    if (t > 1) return Utils.distance(p, b);
    
    return Utils.distance(p, {
        x: a.x + t * abx,
        y: a.y + t * aby
    });
};

Utils.simplifyPath = (points, tolerance) => {
    if (points.length <= 2) return points;
    
    const simplifySection = (start, end) => {
        let maxDistance = 0;
        let maxIndex = 0;
        
        for (let i = start + 1; i < end; i++) {
            const distance = Utils.pointToLineDistance(points[i], points[start], points[end]);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }
        
        if (maxDistance > tolerance) {
            const firstPart = simplifySection(start, maxIndex);
            const secondPart = simplifySection(maxIndex, end);
            return [...firstPart.slice(0, -1), ...secondPart];
        } else {
            return [points[start], points[end]];
        }
    };
    
    return simplifySection(0, points.length - 1);
};

// Export the Tools object
window.Tools = Tools; 