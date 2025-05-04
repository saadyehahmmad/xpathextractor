document.addEventListener('DOMContentLoaded', () => {
    const extractButton = document.getElementById('extract');
    const exportButton = document.getElementById('export');
    const statusDiv = document.getElementById('status');
    const resultsDiv = document.getElementById('results');
    const elementCountSpan = document.getElementById('elementCount');
    const elementList = document.getElementById('elementList');
    const elementTypeFilter = document.getElementById('elementTypeFilter');
    const clearFilterBtn = document.getElementById('clearFilter');
    
    let extractedElements = [];
    let pageTitle = '';
    let pageUrl = '';
    let uniqueElementTypes = new Set(['all']);

    // Element type to icon mapping
    const elementTypeIcons = {
        // Standard HTML controls
        'input': 'fa-keyboard',
        'button': 'fa-square',
        'select': 'fa-caret-square-down',
        'textarea': 'fa-paragraph',
        'checkbox': 'fa-check-square',
        'radio': 'fa-dot-circle',
        'link': 'fa-link',
        'image': 'fa-image',
        'text': 'fa-font',
        'password': 'fa-key',
        'submit': 'fa-paper-plane',
        'reset': 'fa-undo',
        'file': 'fa-file-upload',
        'hidden': 'fa-eye-slash',
        'number': 'fa-hashtag',
        'email': 'fa-envelope',
        'tel': 'fa-phone',
        'url': 'fa-link',
        'search': 'fa-search',
        'date': 'fa-calendar-alt',
        'time': 'fa-clock',
        'datetime': 'fa-calendar-plus',
        'month': 'fa-calendar',
        'week': 'fa-calendar-week',
        'color': 'fa-palette',
        'range': 'fa-sliders-h',
        
        // Angular Material Controls
        'mat-form-field': 'fa-square-full',
        'mat-select': 'fa-caret-square-down',
        'mat-option': 'fa-check',
        'mat-checkbox': 'fa-check-square',
        'mat-radio': 'fa-dot-circle',
        'mat-slide-toggle': 'fa-toggle-on',
        'mat-slider': 'fa-sliders-h',
        'mat-input': 'fa-keyboard',
        'mat-datepicker': 'fa-calendar-alt',
        'mat-autocomplete': 'fa-list',
        'mat-chip': 'fa-tag',
        'mat-chip-list': 'fa-tags',
        'mat-button': 'fa-square',
        'mat-raised-button': 'fa-square',
        'mat-flat-button': 'fa-square',
        'mat-icon-button': 'fa-circle',
        'mat-fab': 'fa-circle',
        'mat-mini-fab': 'fa-circle',
        'mat-card': 'fa-credit-card',
        'mat-expansion-panel': 'fa-chevron-down',
        'mat-tab': 'fa-folder',
        'mat-stepper': 'fa-steps',
        'mat-progress-bar': 'fa-battery-half',
        'mat-progress-spinner': 'fa-circle-notch',
        'mat-paginator': 'fa-file-alt',
        'mat-sort': 'fa-sort',
        'mat-table': 'fa-table',
        
        // Other common controls
        'dropdown': 'fa-caret-square-down',
        'listbox': 'fa-list',
        'combobox': 'fa-bars',
        'label': 'fa-tag',
        'form': 'fa-wpforms',
        'div': 'fa-square-full',
        'span': 'fa-text-width',
        'table': 'fa-table',
        'iframe': 'fa-window-maximize'
    };

    // Material form control attributes to extract
    const materialAttributes = [
        'formControlName',
        'name',
        'id',
        'aria-label',
        'aria-labelledby',
        'placeholder',
        'role',
        'required',
        'disabled',
        'readonly',
        'aria-required',
        'aria-disabled',
        'aria-invalid',
        'aria-expanded',
        'aria-haspopup',
        'aria-autocomplete'
    ];

    function updateFilterDropdown() {
        elementTypeFilter.innerHTML = '<option value="all">All Elements</option>';
        
        // Sort element types alphabetically
        const sortedTypes = Array.from(uniqueElementTypes)
            .filter(type => type !== 'all')
            .sort((a, b) => a.localeCompare(b));
        
        sortedTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            elementTypeFilter.appendChild(option);
        });
    }

    function filterElements() {
        const selectedType = elementTypeFilter.value;
        const items = elementList.getElementsByClassName('element-item');
        let visibleCount = 0;
        
        Array.from(items).forEach(item => {
            const type = item.querySelector('.element-type-tag').textContent.trim();
            if (selectedType === 'all' || type.toLowerCase() === selectedType.toLowerCase()) {
                item.classList.remove('filtered');
                visibleCount++;
            } else {
                item.classList.add('filtered');
            }
        });
        
        elementCountSpan.textContent = selectedType === 'all' ? 
            extractedElements.length : `${visibleCount} / ${extractedElements.length}`;
        
        clearFilterBtn.disabled = selectedType === 'all';
    }

    elementTypeFilter.addEventListener('change', filterElements);
    
    clearFilterBtn.addEventListener('click', () => {
        elementTypeFilter.value = 'all';
        filterElements();
    });

    function getElementTypeIcon(type) {
        // Convert type to lowercase and remove any whitespace
        const normalizedType = type.toLowerCase().trim();
        
        // Check if it's a Material component
        if (normalizedType.startsWith('mat-')) {
            return elementTypeIcons[normalizedType] || 'fa-puzzle-piece';
        }
        
        // Check if it's an input type
        if (normalizedType.startsWith('input')) {
            const inputType = normalizedType.split(' ')[1] || 'text';
            return elementTypeIcons[inputType] || 'fa-keyboard';
        }
        
        return elementTypeIcons[normalizedType] || 'fa-code';
    }

    function getElementTypeColor(type) {
        // Return specific colors for Material components
        const normalizedType = type.toLowerCase().trim();
        if (normalizedType.startsWith('mat-')) {
            return '#673ab7'; // Material Design Purple
        }
        return '#4285f4'; // Default Google Blue
    }

    function getMaterialElementInfo(element) {
        const info = {
            type: '',
            label: '',
            attributes: {}
        };

        // Get the actual type (handling mat-select inside mat-form-field)
        if (element.tagName.toLowerCase().startsWith('mat-')) {
            info.type = element.tagName.toLowerCase();
        } else {
            const matChild = element.querySelector('[class*="mat-"]');
            if (matChild) {
                info.type = matChild.tagName.toLowerCase();
            }
        }

        // Get label from various sources
        const labelSources = [
            // Try to get label from aria-label
            element.getAttribute('aria-label'),
            // Try to get label from aria-labelledby
            element.getAttribute('aria-labelledby') ? 
                document.getElementById(element.getAttribute('aria-labelledby'))?.textContent : null,
            // Try to get label from mat-label element
            element.querySelector('mat-label')?.textContent,
            // Try to get label from placeholder
            element.getAttribute('placeholder'),
            // Try to get label from mat-select-placeholder
            element.querySelector('.mat-select-placeholder')?.textContent,
            // Try to get label from form-field-label
            element.closest('mat-form-field')?.querySelector('.mat-form-field-label')?.textContent
        ];

        // Use the first non-null label found
        info.label = labelSources.find(label => label) || '';

        // Extract all relevant attributes
        materialAttributes.forEach(attr => {
            const value = element.getAttribute(attr);
            if (value !== null) {
                info.attributes[attr] = value;
            }
        });

        // Extract Angular-specific attributes
        const ngAttributes = Array.from(element.attributes)
            .filter(attr => attr.name.startsWith('ng-') || attr.name.startsWith('_ng'))
            .reduce((acc, attr) => {
                acc[attr.name] = attr.value;
                return acc;
            }, {});

        info.attributes = { ...info.attributes, ...ngAttributes };

        // Add class information
        info.attributes.class = element.className;

        // Add state information
        info.state = {
            isRequired: element.hasAttribute('required') || element.getAttribute('aria-required') === 'true',
            isDisabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
            isInvalid: element.getAttribute('aria-invalid') === 'true',
            isExpanded: element.getAttribute('aria-expanded') === 'true'
        };

        return info;
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status show ${type}`;
        setTimeout(() => {
            statusDiv.className = 'status';
        }, 3000);
    }

    function updateElementList() {
        elementCountSpan.textContent = extractedElements.length;
        elementList.innerHTML = '';
        uniqueElementTypes = new Set(['all']);
        
        extractedElements.forEach((element, index) => {
            // Add element type to the set for the filter dropdown
            uniqueElementTypes.add(element.type.toLowerCase());
            
            const item = document.createElement('div');
            const isMaterial = element.type.toLowerCase().startsWith('mat-');
            item.className = `element-item extracted${isMaterial ? ' material' : ''}`;
            
            const info = document.createElement('div');
            info.className = 'element-info';
            
            // Create header with type tag and label
            const header = document.createElement('div');
            header.className = 'element-header';
            
            // Create element type tag with icon
            const typeTag = document.createElement('div');
            typeTag.className = 'element-type-tag';
            const icon = getElementTypeIcon(element.type);
            const color = getElementTypeColor(element.type);
            typeTag.style.backgroundColor = `${color}15`;
            typeTag.style.color = color;
            if (isMaterial) {
                typeTag.setAttribute('data-material', 'true');
            }
            typeTag.innerHTML = `<i class="fas ${icon}"></i> ${element.type}`;
            
            // Add name (label) if exists with a special style
            const nameSpan = document.createElement('div');
            nameSpan.className = 'element-name';
            nameSpan.innerHTML = element.name ? `<strong>${element.name}</strong>` : '';
            
            header.appendChild(typeTag);
            if (element.name) {
                header.appendChild(nameSpan);
            }
            
            // Create a formatted XPath display
            const xpathDisplay = document.createElement('div');
            xpathDisplay.className = 'xpath';
            xpathDisplay.textContent = element.xpath;
            
            // Add additional info if available
            let additionalInfo = '';
            if (element.attributes) {
                additionalInfo = document.createElement('div');
                additionalInfo.className = 'additional-info';
                
                const infoItems = [];
                
                // Add ID if available
                if (element.attributes.id) {
                    infoItems.push(`<i class="fas fa-fingerprint"></i> ID: <span>${element.attributes.id}</span>`);
                }
                
                // Add Name if available
                if (element.attributes.name) {
                    infoItems.push(`<i class="fas fa-tag"></i> Name: <span>${element.attributes.name}</span>`);
                }
                
                // Add Form Control Name if available
                if (element.attributes.formControlName) {
                    infoItems.push(`<i class="fas fa-code"></i> Form Control: <span>${element.attributes.formControlName}</span>`);
                }
                
                // Add Role if available
                if (element.attributes.role) {
                    infoItems.push(`<i class="fas fa-theater-masks"></i> Role: <span>${element.attributes.role}</span>`);
                }
                
                // Add State information
                if (element.state) {
                    const states = [];
                    if (element.state.isRequired) states.push('<i class="fas fa-asterisk"></i> Required');
                    if (element.state.isDisabled) states.push('<i class="fas fa-ban"></i> Disabled');
                    if (element.state.isInvalid) states.push('<i class="fas fa-exclamation-circle"></i> Invalid');
                    if (states.length > 0) {
                        infoItems.push(`<div class="element-states">${states.join(' ')}</div>`);
                    }
                }
                
                additionalInfo.innerHTML = infoItems.join(' | ');
            }
            
            // Add all elements to the info container
            info.appendChild(header);
            if (additionalInfo) info.appendChild(additionalInfo);
            info.appendChild(xpathDisplay);
            
            // Add click handler for copying
            item.addEventListener('click', () => {
                navigator.clipboard.writeText(element.xpath)
                    .then(() => {
                        item.classList.add('copied');
                        showStatus('XPath copied to clipboard!', 'success');
                        setTimeout(() => {
                            item.classList.remove('copied');
                        }, 1500);
                    })
                    .catch(() => {
                        showStatus('Failed to copy XPath', 'error');
                    });
            });
            
            item.appendChild(info);
            elementList.appendChild(item);
            
            setTimeout(() => {
                item.style.opacity = '1';
            }, index * 50);
        });

        updateFilterDropdown();
    }

    extractButton.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            extractButton.disabled = true;
            extractButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Extracting...';
            showStatus('Extracting XPaths...', 'info');
            
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractXPaths' });
            
            if (response.success) {
                extractedElements = response.elements;
                exportButton.disabled = false;
                resultsDiv.className = 'results show';
                updateElementList();
                showStatus(`Found ${extractedElements.length} elements!`, 'success');
            }
        } catch (error) {
            showStatus('Error extracting XPaths. Please refresh the page and try again.', 'error');
            console.error('Error:', error);
        } finally {
            extractButton.disabled = false;
            extractButton.innerHTML = '<i class="fas fa-code"></i> Extract XPaths';
        }
    });

    async function createExcelContent() {
        // Get current date and time
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString();

        // Get page title and URL from the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            pageTitle = tab.title;
            pageUrl = tab.url;
        }

        // Create header with metadata
        const metadata = [
            ['XPath Extractor Report'],
            ['Generated on:', `${dateStr} at ${timeStr}`],
            ['Page Title:', pageTitle || 'N/A'],
            ['Page URL:', pageUrl || 'N/A'],
            ['Total Elements Found:', extractedElements.length.toString()],
            [''],  // Empty row for spacing
        ];

        // Create main section headers
        const mainHeaders = [
            ['Element Information'],
            ['#', 'Form Control Name', 'Label Text', 'XPath', 'Element Type', 'Current Value', 'Visibility', 'Required', 'Disabled', 'Element ID', 'Name', 'Class', 'Placeholder', 'Readonly']
        ];

        // Create main data rows
        const mainData = extractedElements.map((el, index) => [
            (index + 1).toString(),
            el.name,
            el.label,
            el.xpath,   
            el.type,
            el.value,
            el.visibility,
            el.attributes.required,
            el.attributes.disabled,
            el.attributes.id,
            el.attributes.name,
            el.attributes.class,
            el.attributes.placeholder,
            el.attributes.readonly
        ]);
        
        // Add spacing
        const spacing = [[''], ['']];

        // Combine all parts
        const allRows = [
            ...metadata,
            ...mainHeaders,
            ...mainData,
            ...spacing,
        ];

        // Convert to CSV with proper escaping and formatting
        return allRows.map(row => 
            row.map(cell => {
                if (cell === undefined || cell === null) cell = '';
                // Escape special characters and wrap in quotes
                const escaped = cell.toString().replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',')
        ).join('\n');
    }

    exportButton.addEventListener('click', async () => {
        try {
            if (extractedElements.length === 0) {
                showStatus('No elements to export', 'error');
                return;
            }

            exportButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            exportButton.disabled = true;
            
            const csvContent = await createExcelContent();
            const blob = new Blob(['\ufeff' + csvContent], { 
                type: 'text/csv;charset=utf-8;' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Get current tab title for filename
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const sanitizedTitle = (tab?.title || 'xpath_export')
                .replace(/[^a-z0-9]/gi, '_')
                .toLowerCase()
                .substring(0, 50);
            
            a.download = `xpath_${sanitizedTitle}_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            
            URL.revokeObjectURL(url);
            showStatus('Export successful!', 'success');
            
            setTimeout(() => {
                exportButton.innerHTML = '<i class="fas fa-file-excel"></i> Export to Excel';
                exportButton.disabled = false;
            }, 1000);
        } catch (error) {
            showStatus('Error exporting data', 'error');
            console.error('Error:', error);
            exportButton.innerHTML = '<i class="fas fa-file-excel"></i> Export to Excel';
            exportButton.disabled = false;
        }
    });

    // Add click handler for dummy data button
    document.getElementById('dummydata').addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                throw new Error('No active tab found');
            }
            
            const dummyButton = document.getElementById('dummydata');
            dummyButton.disabled = true;
            dummyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Filling...';
            showStatus('Filling forms with dummy data...', 'info');
            
            // Send message to content script to fill forms
            const response = await chrome.tabs.sendMessage(tab.id, { 
                action: 'fillDummyData'
            });
            
            if (response.success) {
                const message = response.filledCount 
                    ? `Successfully filled ${response.filledCount} out of ${response.totalCount} form fields!`
                    : 'No fillable form fields found on the page';
                showStatus(message, 'success');
            } else {
                throw new Error(response.error || 'Unknown error occurred');
            }
        } catch (error) {
            console.error('Error details:', error);
            let errorMessage = 'Error filling forms. ';
            
            if (error.message.includes('Cannot access contents of url')) {
                errorMessage += 'Cannot access page contents. Please refresh the page and try again.';
            } else if (error.message.includes('Could not establish connection')) {
                errorMessage += 'Could not connect to the page. Please refresh the page and try again.';
            } else {
                errorMessage += error.message;
            }
            
            showStatus(errorMessage, 'error');
        } finally {
            const dummyButton = document.getElementById('dummydata');
            dummyButton.disabled = false;
            dummyButton.innerHTML = '<i class="fas fa-user-edit"></i> Dummy Data';
        }
    });
});