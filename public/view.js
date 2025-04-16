const initialSize = 15;
let showLabels = false;
let useSizeForDimensionality = false;
const showBoxShadow = false; // Toggle this to false for paper figure (no shadow)

// Function to format author names and year for labels
function formatCitation(authors, year) {
    if (!authors || !year) return "Unknown";
    
    // Split authors string by semicolons or line breaks
    const authorList = authors.split(/[;\n]/).map(author => author.trim()).filter(a => a);
    
    if (authorList.length === 0) return "Unknown";
    
    if (authorList.length === 1) {
        // Get the last name of the single author (before the first comma)
        const lastName = authorList[0].split(',')[0].trim();
        return `${lastName} ${year}`;
    } else if (authorList.length === 2) {
        // Get last names of both authors
        const lastName1 = authorList[0].split(',')[0].trim();
        const lastName2 = authorList[1].split(',')[0].trim();
        return `${lastName1} & ${lastName2} ${year}`;
    } else {
        // Get first author's last name and add "et al."
        const lastName = authorList[0].split(',')[0].trim();
        return `${lastName} et al. ${year}`;
    }
}

// Format author citation in APA style
function formatAPACitation(authors, year) {
    if (!authors || !year) return "Unknown";
    
    // Split authors string by semicolons or line breaks
    const authorList = authors.split(/[;\n]/).map(author => author.trim()).filter(a => a);
    
    if (authorList.length === 0) return "Unknown";
    
    if (authorList.length === 1) {
        // Get the last name for a single author
        const lastName = authorList[0].split(',')[0].trim();
        return `${lastName} (${year})`;
    } else if (authorList.length === 2) {
        // Get last names for two authors
        const lastName1 = authorList[0].split(',')[0].trim();
        const lastName2 = authorList[1].split(',')[0].trim();
        return `${lastName1} & ${lastName2} (${year})`;
    } else {
        // Get first author's last name and add "et al."
        const lastName = authorList[0].split(',')[0].trim();
        return `${lastName} et al. (${year})`;
    }
}

// function to create traces for the plot
function createTraces(data, category) {
    const groupedData = {};
    data.forEach(d => {
        let key = d[category];
        if (key === 0 || !key) {
            key = 'undefined';
        }
        if (!groupedData[key]) {
            groupedData[key] = [];
        }
        groupedData[key].push(d);
    });

    return Object.keys(groupedData).map(key => {
        const group = groupedData[key];
        
        // Create a map to detect and handle duplicate points
        const pointMap = new Map();
        
        // Process each point to handle duplicates
        group.forEach(d => {
            const x = d['num parameters'];
            const y = d['num simulations'];
            const coordKey = `${x},${y}`;
            
            if (!pointMap.has(coordKey)) {
                pointMap.set(coordKey, {
                    points: [d],
                    count: 1
                });
            } else {
                const entry = pointMap.get(coordKey);
                entry.points.push(d);
                entry.count += 1;
            }
        });
        
        // Log duplicate points for debugging
        let totalDuplicates = 0;
        pointMap.forEach((value, key) => {
            if (value.count > 1) {
                console.log(`Found ${value.count} overlapping points at ${key}`);
                totalDuplicates += value.count - 1;
            }
        });
        
        if (totalDuplicates > 0) {
            console.log(`Group "${key}" has ${totalDuplicates} overlapping points`);
        }
        
        // Convert the map back to arrays, adding jitter to duplicates
        const processedPoints = [];
        const processedX = [];
        const processedY = [];
        const processedSizes = [];
        const processedTexts = [];
        
        pointMap.forEach((value, coordKey) => {
            const [baseX, baseY] = coordKey.split(',').map(Number);
            
            value.points.forEach((point, idx) => {
                let x = baseX;
                let y = baseY;
                
                // Add jitter for overlapping points
                if (idx > 0) {
                    // Create a spiral pattern for overlapping points
                    const angle = idx * 0.7; // radians
                    const radius = 0.1 * idx; // increases with each point
                    
                    x += radius * Math.cos(angle);
                    y *= (1 + radius * Math.sin(angle) * 0.01); // smaller effect on y because of log scale
                }
                
                processedPoints.push(point);
                processedX.push(x);
                processedY.push(y);
                
                // Increase size slightly for overlapping points to draw attention
                const size = useSizeForDimensionality 
                    ? Math.log(point['data dimensionality'] || 1) * 5
                    : initialSize;
                
                processedSizes.push(size * (idx > 0 ? 1.2 : 1));
                processedTexts.push(formatCitation(point['Authors'], point['Publication year']));
            });
        });
        
        return {
            x: processedX,
            y: processedY,
            mode: 'markers' + (showLabels ? '+text' : ''),
            name: key,
            marker: {
                size: processedSizes,
                symbol: 'square',
            },
            text: processedTexts,
            textposition: 'top center',
            textfont: {
                size: 10
            },
            customdata: processedPoints
        };
    });
}

// function for line breaks
function insertLineBreaks(str, maxLineLength) {
    let result = '';
    let lineLength = 0;

    for (let i = 0; i < str.length; i++) {
        result += str[i];
        lineLength++;

        if (str[i] === ' ') {
            let nextSpace = str.indexOf(' ', i + 1);
            if (nextSpace === -1) nextSpace = str.length;
            if (nextSpace - i + lineLength > maxLineLength) {
                result += '<br>';
                lineLength = 0;
            }
        } else if (lineLength >= maxLineLength) {
            result += '<br>';
            lineLength = 0;
        }
    }

    return result;
}

document.addEventListener('DOMContentLoaded', async () => {
    let data;
    try {
        const response = await fetch('/data');
        data = await response.json();
        
        // Debug logs if needed
        console.log("Data first item:", data[0]);
        console.log("Available column names:", Object.keys(data[0]));
        
    } catch (error) {
        console.error('Error fetching or parsing data:', error);
        return;
    }

    const layout = {
        title: 'sbi applications',
        font: {
            family: 'Arial, sans-serif',
            size: 11
        },
        xaxis: { 
            title: {
                text: 'number of parameters',
                standoff: 15,
                font: { size: 13 }
            },
            tickfont: { size: 11 },
            showline: true,
            linewidth: 2,
            linecolor: 'black',
            mirror: false,
            zeroline: false
        },
        yaxis: { 
            title: {
                text: 'number of simulations (log scale)',
                standoff: 15,
                font: { size: 13 }
            },
            tickfont: { size: 11 },
            type: 'log',
            showline: true,
            linewidth: 2,
            linecolor: 'black',
            mirror: false,
            zeroline: false
        },
        hovermode: 'closest',
        showlegend: true,
        autosize: true,
        margin: { t: 50, r: 30, b: 50, l: 50 },
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        legend: {
            font: { size: 11 }
        }
    };

    const chartDiv = document.getElementById('chart');
    if (!chartDiv) {
        console.error('Chart container not found');
        return;
    }

    // Function to recreate the plot
    function recreatePlot(category, dataToUse = data) {
        const newTraces = createTraces(dataToUse, category);
        Plotly.react(chartDiv, newTraces, layout);
    }
    
    // Keep track of original data for reset
    const originalData = [...data];
    let currentData = [...data];
    
    // Initial plot creation
    recreatePlot('research area');
    
    // Get the dropdown once and reuse the reference
    const dropdown = document.getElementById('category-dropdown');
    if (!dropdown) {
        console.error('Dropdown container not found');
        return;
    }
    
    // Convert dropdown options to lowercase
    Array.from(dropdown.options).forEach(option => {
        option.textContent = option.textContent.toLowerCase().replace(/-/g, ' ');
    });
    
    dropdown.addEventListener('change', (event) => {
        const selectedCategory = event.target.value;
        recreatePlot(selectedCategory);
    });
    
    // Set up button event handlers for pre-existing buttons
    const toggleLabelsButton = document.getElementById('toggle-labels-button');
    const toggleSizeButton = document.getElementById('toggle-size-button');
    const sheetLinkButton = document.getElementById('sheet-link-button');
    const submitButton = document.getElementById('submit-button');
    
    if (toggleLabelsButton) {
        toggleLabelsButton.addEventListener('click', () => {
            showLabels = !showLabels;
            recreatePlot(dropdown.value, currentData);
        });
    }
    
    if (toggleSizeButton) {
        toggleSizeButton.addEventListener('click', () => {
            useSizeForDimensionality = !useSizeForDimensionality;
            recreatePlot(dropdown.value, currentData);
        });
    }
    
    if (sheetLinkButton) {
        sheetLinkButton.addEventListener('click', () => {
            window.open('https://docs.google.com/spreadsheets/d/11NPoIwFo79gajRPdMtJsMmewxyBxTnkNH63trihvm8U/edit?usp=sharing', '_blank');
        });
    }
    
    if (submitButton) {
        submitButton.addEventListener('click', () => {
            window.open('https://docs.google.com/forms/d/e/1FAIpQLSeu7Er272IKAnTxBX6osqcbrdvG2ny-aIybv6FDIFLLe8SSoA/viewform?usp=sf_link', '_blank');
        });
    }
    
    // Set up search functionality
    const searchBox = document.getElementById('search-box');
    const searchButton = document.getElementById('search-button');
    const resetButton = document.getElementById('reset-search');
    const searchResults = document.getElementById('search-results');

    if (!searchBox || !searchButton || !resetButton || !searchResults) {
        console.error('Search elements not found');
        return;
    }
    
    // Live search as you type
    searchBox.addEventListener('input', () => {
        const searchTerm = searchBox.value.toLowerCase().trim();
        
        // Clear previous results
        searchResults.innerHTML = '';
        
        if (!searchTerm) {
            searchResults.classList.remove('active');
            return;
        }
        
        const filteredData = searchPapers(searchTerm);
        
        // Display results
        if (filteredData.length > 0) {
            // Show dropdown
            searchResults.classList.add('active');
            
            // Add results to dropdown (limit to first 10 for performance)
            const displayLimit = Math.min(filteredData.length, 10);
            
            for (let i = 0; i < displayLimit; i++) {
                const item = filteredData[i];
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                
                // Create structured result with citation, title and journal
                const citationDiv = document.createElement('div');
                citationDiv.className = 'result-citation';
                citationDiv.textContent = formatAPACitation(item['Authors'], item['Publication year']);
                
                const titleDiv = document.createElement('div');
                titleDiv.className = 'result-title';
                titleDiv.textContent = item['Paper title'] || 'Unknown title';
                
                const journalDiv = document.createElement('div');
                journalDiv.className = 'result-journal';
                journalDiv.textContent = item['Journal'] || item['publication venue'] || '';
                
                // Add all elements to result item
                resultItem.appendChild(citationDiv);
                resultItem.appendChild(titleDiv);
                resultItem.appendChild(journalDiv);
                
                // Add click handler
                resultItem.addEventListener('click', () => {
                    // Filter to just this item
                    currentData = [item];
                    recreatePlot(dropdown.value, currentData);
                    searchResults.classList.remove('active');
                    
                    // Set search box value using the same formatter used for labels
                    searchBox.value = formatCitation(item['Authors'], item['Publication year']);
                });
                
                searchResults.appendChild(resultItem);
            }
            
            // If there are more results, show a message with functionality
            if (filteredData.length > displayLimit) {
                const moreMessage = document.createElement('div');
                moreMessage.className = 'search-result-item';
                moreMessage.textContent = `${filteredData.length - displayLimit} more results...`;
                moreMessage.style.textAlign = 'center';
                moreMessage.style.fontWeight = '500';
                
                // Add click handler for "more results"
                moreMessage.addEventListener('click', () => {
                    // Apply all filtered results to the plot
                    currentData = filteredData;
                    recreatePlot(dropdown.value, currentData);
                    searchResults.classList.remove('active'); // Hide dropdown after search
                    
                    // Update search box to show count of results
                    searchBox.value = `${filteredData.length} results for "${searchBox.value}"`;
                });
                
                searchResults.appendChild(moreMessage);
            }
        } else {
            // Show no results message
            searchResults.classList.add('active');
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No matching papers found';
            searchResults.appendChild(noResults);
        }
    });

    // Full search on button click
    searchButton.addEventListener('click', () => {
        const searchTerm = searchBox.value.toLowerCase().trim();
        
        if (!searchTerm) {
            currentData = [...originalData];
            recreatePlot(dropdown.value, currentData);
            return;
        }
        
        // Use native JavaScript search
        const filteredData = searchPapers(searchTerm);
        
        if (filteredData.length > 0) {
            currentData = filteredData;
            recreatePlot(dropdown.value, currentData);
            searchResults.classList.remove('active'); // Hide dropdown after search
        } else {
            // Show no results message
            searchResults.classList.add('active');
            searchResults.innerHTML = '';
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.textContent = 'No matching papers found';
            searchResults.appendChild(noResults);
        }
    });

    // Close dropdown when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });

    // Reset search
    resetButton.addEventListener('click', () => {
        searchBox.value = '';
        searchResults.classList.remove('active');
        currentData = [...originalData];
        recreatePlot(dropdown.value, currentData);
    });

    // Search on Enter key
    searchBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });

    // Resize function
    function resizePlot() {
        Plotly.Plots.resize(chartDiv);
    }

    // Resize the chart when the window is resized
    window.addEventListener('resize', resizePlot);

    // Initial resize
    resizePlot();

    // Add event listener for the metadata hover
    const hoverInfo = document.getElementById('hover-info');
    if (!hoverInfo) {
        console.error('Hover info container not found');
        return;
    }
    let hoverTimeout;
    chartDiv.on('plotly_hover', function(data) {
        clearTimeout(hoverTimeout);
        const point = data.points[0];
        const d = point.customdata;

        const lineBreaksAfter = 80;
        const descriptionWithBreaks = insertLineBreaks(d['short application description'], lineBreaksAfter);
        const titleWithBreaks = insertLineBreaks(d['Paper title'], lineBreaksAfter);

        // NOTE: Make sure the keys in d match the sheet headers.
        const content = `
            <strong>Title:</strong> ${titleWithBreaks}<br>
            <strong>URL:</strong> <a href="${d.url}" target="_blank">${d['paper url']}</a><br>
            <strong>Task Name:</strong> ${d['application name']}<br>
            <strong>Description:</strong> ${descriptionWithBreaks}<br>
            <strong>Research Area:</strong> ${d['research area']}<br>
            <strong>Num Parameters:</strong> ${d['num parameters']}<br>
            <strong>Num Simulations:</strong> ${d['num simulations']}<br>
            <strong>Data Dimensionality:</strong> ${d['data dimensionality']}<br>
            <strong>Data Type:</strong> ${d['data type']}<br>
            <strong>Method:</strong> ${d['SBI method']}<br>
            <strong>Toolbox:</strong> ${d['SBI software package']}<br>
            <strong>GitHub:</strong> <a href="${d.github}" target="_blank">${d['url to code']}</a>
        `;

        hoverInfo.innerHTML = content;
        
        // Calculate position dynamically
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const hoverInfoWidth = hoverInfo.offsetWidth;
        const hoverInfoHeight = hoverInfo.offsetHeight;
        
        // Increase offset values to move hover info further from cursor
        const offsetX = 30; // Increased from previous value
        const offsetY = 30; // Increased from previous value

        // Determine the best position to avoid overlap
        // Try to position to the right and below by default
        let left = data.event.clientX + offsetX;
        let top = data.event.clientY + offsetY;

        // If near right edge, position to the left of the cursor
        if (left + hoverInfoWidth > screenWidth) {
            left = data.event.clientX - hoverInfoWidth - offsetX/2;
        }

        // If near bottom edge, position above the cursor
        if (top + hoverInfoHeight > screenHeight) {
            top = data.event.clientY - hoverInfoHeight - offsetY/2;
        }

        hoverInfo.style.left = `${left}px`;
        hoverInfo.style.top = `${top}px`;
        hoverInfo.style.display = 'block';
    });

    // Stop displaying the metadata when the mouse leaves the point after a delay
    chartDiv.on('plotly_unhover', function() {
        hoverTimeout = setTimeout(() => {
            hoverInfo.style.display = 'none';
        }, 300);
    });

    // Stop the timeout if the mouse enters the metadata
    hoverInfo.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
    });

    // Stop displaying the metadata when the mouse leaves the metadata
    hoverInfo.addEventListener('mouseleave', () => {
        hoverInfo.style.display = 'none';
    });

    // Apply shadow setting based on flag (add this near the beginning)
    const chartContainer = document.getElementById('chart-container');
    if (!showBoxShadow) {
        chartContainer.style.boxShadow = 'none';
    }

    // Update search function to require ALL terms to match (AND logic)
    function searchPapers(searchTerm) {
        if (!searchTerm) {
            return originalData;
        }
        
        const searchQuery = searchTerm.trim().toLowerCase();
        
        // Split search terms by spaces
        const terms = searchQuery.split(/\s+/).filter(term => term.length > 0);
        
        if (terms.length === 0) {
            return originalData;
        }
        
        // Simple array filtering with native JavaScript
        return originalData.filter(item => {
            // Check that EVERY term matches against at least one field
            return terms.every(term => {
                // Check if any field contains this term as a substring
                return (
                    (item['Authors'] && item['Authors'].toLowerCase().includes(term)) ||
                    (item['Publication year'] && String(item['Publication year']).includes(term)) ||
                    (item['Paper title'] && item['Paper title'].toLowerCase().includes(term)) ||
                    (item['bibtex key (e.g., cranmer_frontier_2020)'] && 
                     item['bibtex key (e.g., cranmer_frontier_2020)'].toLowerCase().includes(term)) ||
                    (item['application name'] && item['application name'].toLowerCase().includes(term)) ||
                    (item['short application description'] && 
                     item['short application description'].toLowerCase().includes(term)) ||
                    (item['research area'] && item['research area'].toLowerCase().includes(term)) ||
                    (item['SBI method'] && item['SBI method'].toLowerCase().includes(term))
                );
            });
        });
    }
});

