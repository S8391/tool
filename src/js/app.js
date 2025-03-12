/**
 * SVG Builder - Main Application Module
 * Initializes and coordinates all components of the application
 */

const App = {
    /**
     * Initialize the application
     */
    init: () => {
        // Initialize all modules
        const svgCanvas = document.getElementById('svg-canvas');
        
        // Initialize tools
        Tools.init(svgCanvas);
        
        // Initialize properties panel
        Properties.init();
        
        // Initialize layers panel
        Layers.init();
        
        // Initialize UI
        UI.init();
        
        // Update SVG code display
        App.updateSvgCode();
        
        // Update layers panel
        App.updateLayers();
        
        // Set initial canvas size in status bar
        const width = svgCanvas.getAttribute('width');
        const height = svgCanvas.getAttribute('height');
        document.getElementById('canvas-size').textContent = `${width} × ${height}`;
        
        // Add event listener for window resize
        window.addEventListener('resize', App.handleResize);
        
        // Show welcome message
        App.showWelcomeMessage();
    },
    
    /**
     * Update SVG code in the code editor
     */
    updateSvgCode: () => {
        const svgCanvas = document.getElementById('svg-canvas');
        const svgCode = document.getElementById('svg-code');
        
        // Get SVG as string
        const svgString = SvgParser.svgToString(svgCanvas);
        
        // Format the SVG code
        const formattedSvg = Utils.formatSvgCode(svgString);
        
        // Update the code editor
        svgCode.value = formattedSvg;
    },
    
    /**
     * Update layers panel
     */
    updateLayers: () => {
        const svgCanvas = document.getElementById('svg-canvas');
        Layers.updateLayersPanel(svgCanvas);
    },
    
    /**
     * Handle window resize
     */
    handleResize: () => {
        // Adjust UI elements if needed
        // This is a placeholder for any resize-related adjustments
    },
    
    /**
     * Show welcome message
     */
    showWelcomeMessage: () => {
        Utils.showModal(
            'Welcome to SVG Builder',
            `
                <div class="welcome-message">
                    <p>SVG Builder is a modern, sleek SVG renderer and editor with the following features:</p>
                    <ul>
                        <li>Create and edit SVG graphics</li>
                        <li>Import and export SVG files</li>
                        <li>Clean and optimize SVG code</li>
                        <li>Edit SVG properties</li>
                        <li>Manage layers</li>
                    </ul>
                    <p>Get started by creating a new SVG or opening an existing one.</p>
                </div>
            `,
            null
        );
    }
};

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', App.init); 