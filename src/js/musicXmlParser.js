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
        titleElement.textContent = title;
        svg.appendChild(titleElement);
        
        const composerElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        composerElement.setAttribute('x', '600');
        composerElement.setAttribute('y', '80');
        composerElement.setAttribute('text-anchor', 'middle');
        composerElement.setAttribute('font-size', '16');
        composerElement.textContent = composer;
        svg.appendChild(composerElement);
        
        // Convert MusicXML parts to SVG elements
        const parts = xmlDoc.querySelectorAll('part');
        let yOffset = 150;
        
        parts.forEach((part, partIndex) => {
            const partGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            partGroup.setAttribute('id', `part-${partIndex}`);
            partGroup.setAttribute('transform', `translate(100, ${yOffset})`);
            
            // Handle measures
            const measures = part.querySelectorAll('measure');
            let xOffset = 0;
            const measureWidth = 200;
            
            measures.forEach((measure, measureIndex) => {
                const measureGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                measureGroup.setAttribute('id', `measure-${partIndex}-${measureIndex}`);
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
                    measureGroup.appendChild(staffLine);
                }
                
                // Draw measure number
                const measureNumberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                measureNumberText.setAttribute('x', '5');
                measureNumberText.setAttribute('y', '-5');
                measureNumberText.setAttribute('font-size', '10');
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
                        measureGroup.appendChild(noteHead);
                        
                        // Draw stem
                        const stem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        stem.setAttribute('x1', noteXOffset + 6);
                        stem.setAttribute('y1', yPosition);
                        stem.setAttribute('x2', noteXOffset + 6);
                        stem.setAttribute('y2', yPosition - 30);
                        stem.setAttribute('stroke', 'black');
                        stem.setAttribute('stroke-width', '1');
                        measureGroup.appendChild(stem);
                    }
                    
                    noteXOffset += 30;
                });
                
                partGroup.appendChild(measureGroup);
                xOffset += measureWidth;
                
                // If we've reached the edge of our SVG, move to next line
                if (xOffset > 1000 && measureIndex < measures.length - 1) {
                    xOffset = 0;
                    yOffset += 100;
                    partGroup.setAttribute('transform', `translate(100, ${yOffset})`);
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
        
        // Clone the original SVG to work with
        const clonedSvg = svgElement.cloneNode(true);
        
        // Find all measure groups in the original SVG
        const partGroups = Array.from(clonedSvg.querySelectorAll('g[id^="part-"]'));
        const allMeasures = [];
        
        // Extract all measures from all parts
        partGroups.forEach(partGroup => {
            const measures = Array.from(partGroup.querySelectorAll('g[id^="measure-"]'));
            allMeasures.push(...measures);
        });
        
        // Sort measures by their index
        allMeasures.sort((a, b) => {
            const aIndex = parseInt(a.id.split('-')[2]);
            const bIndex = parseInt(b.id.split('-')[2]);
            return aIndex - bIndex;
        });
        
        // Create a new group for the continuous score
        const continuousGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        continuousGroup.setAttribute('id', 'continuous-score');
        continuousGroup.setAttribute('transform', 'translate(100, 150)');
        
        // Arrange measures in a continuous line
        let xOffset = 0;
        const measureWidth = 200;
        
        allMeasures.forEach((measure, index) => {
            const clonedMeasure = measure.cloneNode(true);
            clonedMeasure.setAttribute('transform', `translate(${xOffset}, 0)`);
            continuousGroup.appendChild(clonedMeasure);
            xOffset += measureWidth;
        });
        
        // Set appropriate viewBox for the new SVG
        const totalWidth = xOffset + 200; // Add some padding
        newSvg.setAttribute('viewBox', `0 0 ${totalWidth} 400`);
        
        // Copy title and composer if present
        const title = clonedSvg.querySelector('text[font-weight="bold"]');
        const composer = title?.nextElementSibling;
        
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
        
        newSvg.appendChild(continuousGroup);
        return newSvg;
    }
};

// Export the MusicXmlParser object
window.MusicXmlParser = MusicXmlParser; 