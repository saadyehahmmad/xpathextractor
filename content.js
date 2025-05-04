console.log("XPath Extractor Loaded");

// Function to get a unique XPath for an element with multiple strategies
function getXPath(element) {
  // Function to get absolute XPath
  function getAbsoluteXPath(element) {
    if (!element) return "";
    if (element === document.body) return "/html/body";
    if (element === document.documentElement) return "/html";

    let path = "";
    let current = element;

    while (
      current &&
      current.nodeType === Node.ELEMENT_NODE &&
      current !== document.documentElement
    ) {
      let nodeName = current.nodeName.toLowerCase();

      // Only add index if there are multiple elements of the same type
      let siblings = Array.from(current.parentNode.children).filter(
        (child) => child.nodeName.toLowerCase() === nodeName
      );

      let nodeIndex =
      siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : "";
      path = `/${nodeName}${nodeIndex}${path}`;
      current = current.parentNode;
    }

    return "/html/body" + path;
  }

  // Function to get alternative XPath with attributes
  function getAttributeXPath(element) {
    if (!element) return "";
    if (element === document.body) return "/html/body";
    if (element === document.documentElement) return "/html";

    let path = "";
    let current = element;

    while (
      current &&
      current.nodeType === Node.ELEMENT_NODE &&
      current !== document.documentElement
    ) {
      let nodeName = current.nodeName.toLowerCase();
      let attributes = [];

      // Handle Material components first
      if (nodeName.startsWith('mat-') || current.classList.contains('mat-input-element')) {
        // Add Material-specific attributes
        if (current.getAttribute("formcontrolname")) {
          attributes.push(`@formcontrolname='${current.getAttribute("formcontrolname")}'`);
        }
        if (current.hasAttribute("matinput")) {
          attributes.push(`@matinput`);
        }
        if (current.hasAttribute("matselect")) {
          attributes.push(`@matselect`);
        }
        if (current.hasAttribute("matcheckbox")) {
          attributes.push(`@matcheckbox`);
        }
        if (current.hasAttribute("matradiobutton")) {
          attributes.push(`@matradiobutton`);
        }
      }

      // Add standard attributes
      if (current.id) {
        attributes.push(`@id='${current.id}'`);
      }
      if (current.name) {
        attributes.push(`@name='${current.name}'`);
      }
      if (current.getAttribute("type")) {
        attributes.push(`@type='${current.getAttribute("type")}'`);
      }
      if (current.className && !current.className.includes(" ")) {
        attributes.push(`@class='${current.className}'`);
      }
      if (current.placeholder) {
        attributes.push(`@placeholder='${current.placeholder}'`);
      }
      if (current.getAttribute("role")) {
        attributes.push(`@role='${current.getAttribute("role")}'`);
      }

      // Get position among siblings (only if multiple elements exist)
      let siblings = Array.from(current.parentNode.children).filter(
        (child) => child.nodeName.toLowerCase() === nodeName
      );

      let nodeIndex =
        siblings.length > 1 ? `[${siblings.indexOf(current) + 1}]` : "";

      // Construct the path segment
      let pathSegment = nodeName;
      if (attributes.length > 0) {
        pathSegment += `[${attributes.join(" and ")}]`;
      }
      if (nodeIndex) {
        pathSegment += nodeIndex;
      }

      path = "/" + pathSegment + path;
      current = current.parentNode;
    }

    return "/html/body" + path;
  }

  // Get both XPath versions
  const absoluteXPath = getAbsoluteXPath(element);
  const attributeXPath = getAttributeXPath(element);

  // Validate XPaths
  function validateXPath(xpath) {
    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      return result.snapshotLength === 1 && result.snapshotItem(0) === element;
    } catch (e) {
      return false;
    }
  }

  // Return the absolute XPath by default, fall back to attribute XPath if validation fails
  if (validateXPath(absoluteXPath)) {
    return absoluteXPath;
  } else if (validateXPath(attributeXPath)) {
    return attributeXPath;
  }

  // If both fail (shouldn't happen), return absolute XPath anyway
  return absoluteXPath;
}

// Function to highlight an element
function highlightElement(element) {
  const originalBackground = element.style.backgroundColor;
  const originalOutline = element.style.outline;

  element.style.backgroundColor = "#fff3cd";
  element.style.outline = "2px solid rgb(214, 238, 77)";
  element.style.borderRadius = "5px";

  setTimeout(() => {
    element.style.backgroundColor = originalBackground;
    element.style.outline = originalOutline;
  }, 1500);
}

// Function to get associated label text for an element
function getLabelText(element) {
  // First check for preceding label element
  let previousElement = element.previousElementSibling;
  while (previousElement) {
    if (previousElement.tagName.toLowerCase() === 'label') {
      const labelText = previousElement.textContent.trim();
      if (labelText) return labelText;
    }
    previousElement = previousElement.previousElementSibling;
  }

  // Check for Material-specific labels
  if (element.tagName.toLowerCase().startsWith('mat-') || element.classList.contains('mat-input-element')) {
    // Check for mat-label element
    const matLabel = element.querySelector('mat-label');
    if (matLabel) return matLabel.textContent.trim();

    // Check for form-field-label
    const formFieldLabel = element.closest('mat-form-field')?.querySelector('.mat-form-field-label');
    if (formFieldLabel) return formFieldLabel.textContent.trim();

    // Check for mat-select-placeholder
    const selectPlaceholder = element.querySelector('.mat-select-placeholder');
    if (selectPlaceholder) return selectPlaceholder.textContent.trim();
  }

  // Check for explicit label
  const id = element.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent.trim();
  }

  // Check for wrapping label
  const parentLabel = element.closest("label");
  if (parentLabel) return parentLabel.textContent.trim();

  // Check for aria-label
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  // Check for aria-labelledby
  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) return labelElement.textContent.trim();
  }

  // Check for placeholder attribute
  const placeholder = element.getAttribute("placeholder");
  if (placeholder) return placeholder;

  // Check for floating label in Material form field
  const floatingLabel = element.closest('mat-form-field')?.querySelector('.mat-form-field-label-wrapper');
  if (floatingLabel) return floatingLabel.textContent.trim();

  return "";
}

// Function to get element's visibility state
function getVisibilityState(element) {
  const style = window.getComputedStyle(element);
  if (style.display === "none") return "hidden (display: none)";
  if (style.visibility === "hidden") return "hidden (visibility: hidden)";
  if (style.opacity === "0") return "hidden (opacity: 0)";
  if (element.hasAttribute("hidden")) return "hidden (hidden attribute)";
  return "visible";
}

// Function to fill form element with dummy data
function fillFormElement(element, generateDummyData) {
  const elementType = element.type || element.tagName.toLowerCase();
  const label = getLabelText(element);
  const dummyValue = generateDummyData(elementType, label);

  // Handle different types of inputs
  if (elementType === 'checkbox' || elementType === 'radio' || 
      elementType === 'mat-checkbox' || elementType === 'mat-radio-button') {
    if (!element.checked && dummyValue) {
      element.click();
    }
  } else if (elementType === 'select' || elementType === 'mat-select') {
    const options = element.options || element.querySelectorAll('mat-option');
    if (options && options.length > 0) {
      options[options.length - 1].selected = true;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } else {
    // For text inputs and other elements
    element.value = dummyValue;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Highlight the filled element
  highlightElement(element);
}

// Function to generate dummy data based on element type
function generateDummyData(elementType, label = '') {
  const normalizedLabel = label.toLowerCase();
  const normalizedType = elementType.toLowerCase();

  // Handle email fields
  if (normalizedType === 'email' || normalizedLabel.includes('email')) {
    return 'test@example.com';
  }

  // Handle password fields
  if (normalizedType === 'password' || normalizedLabel.includes('password')) {
    return 'Test@123';
  }

  // Handle phone fields
  if (normalizedType === 'tel' || normalizedLabel.includes('phone') || normalizedLabel.includes('mobile')) {
    return '+1234567890';
  }

  // Handle date fields with more variety
  if (normalizedType === 'date' || normalizedLabel.includes('date')) {
    const today = new Date();
    
    // Function to format date as d/m/yyyy
    function formatDate(date) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // If it includes "birth" or "dob", generate a random birth date (18-80 years ago)
    if (normalizedLabel.includes('birth') || normalizedLabel.includes('dob')) {
      const minAge = 18;
      const maxAge = 80;
      const randomAge = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
      const birthDate = new Date(today.getFullYear() - randomAge, 
                               Math.floor(Math.random() * 12), 
                               Math.floor(Math.random() * 28) + 1);
      return formatDate(birthDate);
    }
    
    // If it includes "future" or "deadline", generate a future date (1-30 days ahead)
    if (normalizedLabel.includes('future') || normalizedLabel.includes('deadline')) {
      const daysAhead = Math.floor(Math.random() * 30) + 1;
      const futureDate = new Date(today.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
      return formatDate(futureDate);
    }
    
    return formatDate(today);
  }

  // Handle number fields with contextual random numbers
  if (normalizedType === 'number' || normalizedLabel.includes('quantity')) {
    if (normalizedLabel.includes('age')) {
      return Math.floor(Math.random() * 62) + 18; // Random age between 18-80
    }
    if (normalizedLabel.includes('year')) {
      return Math.floor(Math.random() * 10) + new Date().getFullYear() - 5; // Random year ±5 years from current
    }
    if (normalizedLabel.includes('price') || normalizedLabel.includes('amount')) {
      return (Math.random() * 1000).toFixed(2); // Random price up to 1000 with 2 decimals
    }
    if (normalizedLabel.includes('percentage')) {
      return Math.floor(Math.random() * 100); // Random percentage 0-100
    }
    return Math.floor(Math.random() * 100); // Default random number 0-100
  }

  // Handle checkbox and radio
  if (normalizedType === 'checkbox' || normalizedType === 'radio' || 
      normalizedType === 'mat-checkbox' || normalizedType === 'mat-radio-button') {
    return Math.random() < 0.5; // Random true/false
  }

  // Handle select/dropdown with more intelligence
  if (normalizedType === 'select' || normalizedType === 'mat-select') {
    // Try to get the available options
    const options = document.querySelectorAll(`select[name="${label}"] option, mat-select[name="${label}"] mat-option`);
    if (options.length > 0) {
      return options.length - 1; // Return the last option index
    }
    return 0; // Fallback to first option if can't find options
  }

  // Default text for other fields
  return 'Test Data';
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractXPaths") {
    const formElements = document.querySelectorAll(
       `input,
        select,
        textarea,
        button,
        [type="radio"],
        [type="checkbox"],
        [type="datetime-local"],
        [contenteditable="true"],
        mat-form-field,
        mat-select,
        mat-checkbox,
        mat-radio-button,
        mat-slide-toggle,
        mat-slider,
        mat-input,
        mat-datepicker,
        mat-autocomplete,
        mat-chip,
        mat-button,
        mat-raised-button,
        mat-flat-button,
        mat-icon-button,
        mat-fab,
        mat-mini-fab`
    );

    const results = Array.from(formElements).map((element) => {
      const xpath = getXPath(element);
      const labelText = getLabelText(element);
      const rect = element.getBoundingClientRect();

      // Detect Material component type
      let elementType = element.type || element.tagName.toLowerCase();
      const materialPrefix = 'mat-';
      
      // Check if it's a Material component
      if (element.tagName.toLowerCase().startsWith(materialPrefix)) {
        elementType = element.tagName.toLowerCase();
      } else {
        // Check for Material classes
        const materialClasses = Array.from(element.classList)
          .filter(cls => cls.startsWith('mat-'))
          .map(cls => cls.replace('mat-', materialPrefix));
        
        if (materialClasses.length > 0) {
          elementType = materialClasses[0];
        }
      }

      const elementInfo = {
        xpath: xpath,
        type: elementType,
        name: labelText || "",
        label: labelText || element.placeholder || element.name || element.id || "",
        value: element.value || element.textContent || "",
        attributes: {
          id: element.id || "",
          name: element.name || "",
          class: element.className || "",
          placeholder: element.placeholder || "",
          required: element.required ? "Yes" : "No",
          disabled: element.disabled ? "Yes" : "No",
          readonly: element.readOnly ? "Yes" : "No",
          // Add Material-specific attributes
          formControlName: element.getAttribute("formControlName") || "",
          matInput: element.hasAttribute("matInput") ? "Yes" : "No",
          matSelect: element.hasAttribute("matSelect") ? "Yes" : "No",
          matCheckbox: element.hasAttribute("matCheckbox") ? "Yes" : "No",
          matRadioButton: element.hasAttribute("matRadioButton") ? "Yes" : "No",
        },
        visibility: getVisibilityState(element),
        position: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      };

      // Highlight the element
      highlightElement(element);

      return elementInfo;
    });

    sendResponse({ success: true, elements: results });
    return true;
  } else if (request.action === "fillDummyData") {
    console.log('Received fillDummyData request');
    try {
      // Get all form elements
      const formElements = document.querySelectorAll(
        `input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]),
         select,
         textarea,
         [type="radio"],
         [type="checkbox"],
         [type="datetime-local"],
         [contenteditable="true"],
         mat-form-field input,
         mat-select,
         mat-checkbox,
         mat-radio-button,
         mat-slide-toggle,
         mat-slider,
         mat-input,
         mat-datepicker input`
      );
      
      console.log('Found form elements:', formElements.length);

      // Fill each form element with dummy data
      let filledCount = 0;
      formElements.forEach((element, index) => {
        try {
          if (!element.disabled && !element.readOnly) {
            console.log(`Filling element ${index + 1}:`, {
              type: element.type || element.tagName.toLowerCase(),
              id: element.id,
              name: element.name
            });
            fillFormElement(element, generateDummyData);
            filledCount++;
          }
        } catch (elementError) {
          console.error('Error filling individual element:', elementError, {
            element: element.outerHTML,
            type: element.type || element.tagName.toLowerCase(),
            id: element.id,
            name: element.name
          });
        }
      });

      console.log(`Successfully filled ${filledCount} out of ${formElements.length} elements`);
      sendResponse({ success: true, filledCount, totalCount: formElements.length });
    } catch (error) {
      console.error('Error in fillDummyData:', error);
      console.error('Error stack:', error.stack);
      sendResponse({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        details: 'Check console for more information'
      });
    }
    return true;
  }
});
