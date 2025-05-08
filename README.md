# XPath Extractor Browser Extension

A powerful browser extension that automatically extracts full XPaths for all form controls and interactive elements on web pages, with advanced filtering and Excel export capabilities.


## Features

- 🔍 Smart detection and extraction of XPaths for form elements and controls
- 📊 One-click export to Excel with formatted data
- 🎯 Universal compatibility with any webpage
- 🔄 Real-time element filtering by type
- 📱 Modern, responsive popup interface
- 💾 Persistent storage of preferences
- 🎨 Clean, intuitive UI with Font Awesome icons
- ⚡ Fast and lightweight performance

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your browser toolbar
2. Navigate to the webpage you want to analyze
3. Click "Extract XPaths" to detect form controls
4. Use the popup interface to:
   - View all detected elements with their properties
   - Filter elements by type (input, button, select, etc.)
   - Export formatted data to Excel
   - Generate dummy test data
   - Clear results and start fresh

## File Structure

- `manifest.json` - Extension configuration and permissions
- `popup.html` - Modern popup interface with Font Awesome integration
- `popup.js` - Core functionality and element handling
- `popup.css` - Sleek, responsive styling
- `content.js` - Webpage interaction and element detection
- `background.js` - Background processes and tab management
- `icons/` - Extension branding assets

## Permissions

The extension requires these permissions for full functionality:
- Active Tab - For webpage interaction
- Storage - For saving preferences
- Downloads - For Excel export
- Scripting - For element detection
- All URLs - For universal compatibility

## Demeo

![image](https://github.com/user-attachments/assets/9a2e83df-118b-484e-8b1e-3e0cd5811533)
![image](https://github.com/user-attachments/assets/9abe49f6-ffd7-410f-ae00-677edb64ba5b)


## Development

To contribute or customize:
1. Make changes to the source files
2. Reload the extension in Chrome
3. Test thoroughly across different websites
4. Submit pull requests for improvements

## License

This project is proprietary software. All rights reserved.

## Support

For technical support, feature requests, or bug reports, please contact:

Ahmed Sadieh
saadyehahmmad@gmail.com
