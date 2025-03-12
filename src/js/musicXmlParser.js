/**
 * SVG Builder - MusicXML Parser Module
 * Handles parsing and processing of MusicXML files
 */

const MusicXmlParser = {
    /**
     * Base URL for W3C MusicXML examples
     */
    W3C_MUSICXML_BASE_URL: 'https://www.w3.org/2021/06/musicxml40/musicxml-reference/examples/',
    
    /**
     * Parse a MusicXML string into a DOM structure
     * @param {string} xmlString - The MusicXML content as a string
     * @returns {Document} The parsed XML document
     */
    parseXmlString: (xmlString) => {
        const parser = new DOMParser();
        return parser.parseFromString(xmlString, 'text/xml');
    },
    
    /**
     * Fetch MusicXML example from W3C repository
     * @param {string} exampleName - The name of the example file (without extension)
     * @returns {Promise<Document>} Promise resolving to the parsed MusicXML document
     */
    fetchExample: async (exampleName) => {
        const url = `${MusicXmlParser.W3C_MUSICXML_BASE_URL}${exampleName}.musicxml`;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch MusicXML example: ${response.status} ${response.statusText}`);
            }
            
            const xmlString = await response.text();
            return MusicXmlParser.parseXmlString(xmlString);
        } catch (error) {
            console.error('Error fetching MusicXML example:', error);
            throw error;
        }
    },
    
    /**
     * Convert MusicXML document to SVG
     * @param {Document} xmlDoc - The MusicXML document
     * @returns {SVGElement} The converted SVG element
     */
    convertToSvg: (xmlDoc) => {
        // Create a root SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 1200 800');
        svg.setAttribute('data-type', 'music-score');
        svg.setAttribute('data-format', 'segmented');
        
        // Extract basic information from MusicXML
        const title = xmlDoc.querySelector('work-title')?.textContent || 'Untitled Score';
        const composer = xmlDoc.querySelector('creator[type="composer"]')?.textContent || 'Unknown';
        
        // Add title and composer as text elements in SVG
        const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        titleElement.setAttribute('x', '600');
        titleElement.setAttribute('y', '50');
        titleElement.setAttribute('text-anchor', 'middle');
        titleElement.setAttribute('font-size', '24');
        titleElement.setAttribute('font-weight', 'bold');
        titleElement.setAttribute('data-role', 'title');
        titleElement.textContent = title;
        svg.appendChild(titleElement);
        
        const composerElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        composerElement.setAttribute('x', '600');
        composerElement.setAttribute('y', '80');
        composerElement.setAttribute('text-anchor', 'middle');
        composerElement.setAttribute('font-size', '16');
        composerElement.setAttribute('data-role', 'composer');
        composerElement.textContent = composer;
        svg.appendChild(composerElement);
        
        // Convert MusicXML parts to SVG elements
        const parts = xmlDoc.querySelectorAll('part');
        let yOffset = 150;
        
        parts.forEach((part, partIndex) => {
            const partGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            partGroup.setAttribute('id', `part-${partIndex}`);
            partGroup.setAttribute('data-part-index', partIndex.toString());
            partGroup.setAttribute('transform', `translate(100, ${yOffset})`);
            
            // Handle measures
            const measures = part.querySelectorAll('measure');
            let xOffset = 0;
            const measureWidth = 200;
            let currentLine = 0;
            
            measures.forEach((measure, measureIndex) => {
                const measureGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                measureGroup.setAttribute('id', `measure-${partIndex}-${measureIndex}`);
                measureGroup.setAttribute('data-measure-index', measureIndex.toString());
                measureGroup.setAttribute('data-line', currentLine.toString());
                measureGroup.setAttribute('transform', `translate(${xOffset}, 0)`);
                
                // Draw staff lines
                for (let i = 0; i < 5; i++) {
                    const staffLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    staffLine.setAttribute('x1', '0');
                    staffLine.setAttribute('y1', i * 10);
                    staffLine.setAttribute('x2', measureWidth);
                    staffLine.setAttribute('y2', i * 10);
                    staffLine.setAttribute('stroke', 'black');
                    staffLine.setAttribute('stroke-width', '1');
                    staffLine.setAttribute('data-type', 'staff-line');
                    measureGroup.appendChild(staffLine);
                }
                
                // Draw measure number
                const measureNumberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                measureNumberText.setAttribute('x', '5');
                measureNumberText.setAttribute('y', '-5');
                measureNumberText.setAttribute('font-size', '10');
                measureNumberText.setAttribute('data-type', 'measure-number');
                measureNumberText.textContent = measureIndex + 1;
                measureGroup.appendChild(measureNumberText);
                
                // Handle notes in this measure
                const notes = measure.querySelectorAll('note');
                let noteXOffset = 20;
                
                notes.forEach((note, noteIndex) => {
                    // Determine if it's a rest
                    const isRest = note.querySelector('rest') !== null;
                    
                    if (isRest) {
                        // Draw a rest symbol
                        const restSymbol = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                        restSymbol.setAttribute('x', noteXOffset);
                        restSymbol.setAttribute('y', '20');
                        restSymbol.setAttribute('font-family', 'serif');
                        restSymbol.setAttribute('font-size', '24');
                        restSymbol.setAttribute('data-type', 'rest');
                        restSymbol.textContent = '𝄽'; // Rest symbol
                        measureGroup.appendChild(restSymbol);
                    } else {
                        // Get pitch information
                        const step = note.querySelector('step')?.textContent || 'C';
                        const octave = parseInt(note.querySelector('octave')?.textContent || '4');
                        
                        // Calculate Y position based on pitch
                        const stepValues = { C: 0, D: -5, E: -10, F: -15, G: -20, A: -25, B: -30 };
                        const stepValue = stepValues[step] || 0;
                        const octaveOffset = (4 - octave) * 35;
                        const yPosition = 20 + stepValue + octaveOffset;
                        
                        // Draw note head
                        const noteHead = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
                        noteHead.setAttribute('cx', noteXOffset);
                        noteHead.setAttribute('cy', yPosition);
                        noteHead.setAttribute('rx', '6');
                        noteHead.setAttribute('ry', '4');
                        noteHead.setAttribute('fill', 'black');
                        noteHead.setAttribute('data-type', 'note-head');
                        noteHead.setAttribute('data-pitch', step);
                        noteHead.setAttribute('data-octave', octave.toString());
                        measureGroup.appendChild(noteHead);
                        
                        // Draw stem
                        const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        stem.setAttribute('x1', noteXOffset + 6);
                        stem.setAttribute('y1', yPosition);
                        stem.setAttribute('x2', noteXOffset + 6);
                        stem.setAttribute('y2', yPosition - 30);
                        stem.setAttribute('stroke', 'black');
                        stem.setAttribute('stroke-width', '1');
                        stem.setAttribute('data-type', 'stem');
                        measureGroup.appendChild(stem);
                    }
                    
                    noteXOffset += 30;
                });
                
                partGroup.appendChild(measureGroup);
                xOffset += measureWidth;
                
                // If we've reached the edge of our SVG, move to next line
                if (xOffset > 1000 && measureIndex < measures.length - 1) {
                    xOffset = 0;
                    currentLine++;
                    yOffset += 100;
                    // We don't adjust the partGroup transform here, as that would affect all measures
                }
            });
            
            svg.appendChild(partGroup);
            yOffset += 150;
        });
        
        return svg;
    },
    
    /**
     * Convert a segmented music score to a continuous score
     * @param {SVGElement} svgElement - The SVG element containing the segmented score
     * @returns {SVGElement} A new SVG element with a continuous score layout
     */
    convertToContinuousScore: (svgElement) => {
        // Create a new SVG element for the continuous score
        const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        newSvg.setAttribute('width', '100%');
        newSvg.setAttribute('height', '100%');
        newSvg.setAttribute('data-type', 'music-score');
        newSvg.setAttribute('data-format', 'continuous');
        
        // Clone the original SVG to work with
        const clonedSvg = svgElement.cloneNode(true);
        
        // Find all part groups in the original SVG
        const partGroups = Array.from(clonedSvg.querySelectorAll('g[id^="part-"]'));
        
        // Process each part
        partGroups.forEach((partGroup, partIndex) => {
            // Get all measures in this part
            const measures = Array.from(partGroup.querySelectorAll('g[id^="measure-"]'));
            
            // Sort measures by their index
            measures.sort((a, b) => {
                const aIndex = parseInt(a.getAttribute('data-measure-index') || '0');
                const bIndex = parseInt(b.getAttribute('data-measure-index') || '0');
                return aIndex - bIndex;
            });
            
            // Create a new group for the continuous part
            const continuousPartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            continuousPartGroup.setAttribute('id', `continuous-part-${partIndex}`);
            continuousPartGroup.setAttribute('transform', `translate(50, ${150 + partIndex * 150})`);
            
            // Arrange measures in a continuous line
            let xOffset = 0;
            const measureWidth = 200;
            
            measures.forEach((measure, index) => {
                const clonedMeasure = measure.cloneNode(true);
                clonedMeasure.setAttribute('transform', `translate(${xOffset}, 0)`);
                
                // Update measure number if needed
                const measureNumber = clonedMeasure.querySelector('text[data-type="measure-number"]');
                if (measureNumber) {
                    measureNumber.textContent = (index + 1).toString();
                }
                
                continuousPartGroup.appendChild(clonedMeasure);
                xOffset += measureWidth;
            });
            
            newSvg.appendChild(continuousPartGroup);
        });
        
        // Calculate total width needed
        const maxMeasures = Math.max(...partGroups.map(part => 
            part.querySelectorAll('g[id^="measure-"]').length
        ));
        const totalWidth = maxMeasures * 200 + 100; // Add padding
        
        // Set appropriate viewBox for the new SVG
        newSvg.setAttribute('viewBox', `0 0 ${totalWidth} ${150 + partGroups.length * 150 + 50}`);
        
        // Copy title and composer if present
        const title = svgElement.querySelector('text[data-role="title"]');
        const composer = svgElement.querySelector('text[data-role="composer"]');
        
        if (title) {
            const newTitle = title.cloneNode(true);
            newTitle.setAttribute('x', totalWidth / 2);
            newSvg.appendChild(newTitle);
        }
        
        if (composer) {
            const newComposer = composer.cloneNode(true);
            newComposer.setAttribute('x', totalWidth / 2);
            newSvg.appendChild(newComposer);
        }
        
        return newSvg;
    },
    
    /**
     * Determine if an SVG contains a music score
     * @param {SVGElement} svgElement - The SVG element to check
     * @returns {boolean} True if the SVG contains a music score
     */
    isMusicScore: (svgElement) => {
        // Check for specific music score elements
        return (
            svgElement.getAttribute('data-type') === 'music-score' ||
            svgElement.querySelectorAll('g[id^="part-"]').length > 0 ||
            svgElement.querySelectorAll('g[id^="measure-"]').length > 0 ||
            svgElement.querySelectorAll('line[data-type="staff-line"]').length > 0 ||
            svgElement.querySelectorAll('ellipse[data-type="note-head"]').length > 0
        );
    }
};

// Export the MusicXmlParser object
window.MusicXmlParser = MusicXmlParser; 