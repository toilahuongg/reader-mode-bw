# Reader Mode Chrome Extension

A Chrome extension that provides reader mode functionality directly within the content page. The extension detects content with the class `contents-post` and provides controls for reader mode, dark mode, and font size adjustment.

## Features

- Reader Mode: Focus on content by removing distractions
- Dark Mode: Toggle between light and dark themes
- Font Size Control: Increase or decrease font size for better readability

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Navigate to any webpage
2. Look for the control buttons in the top right corner of the page
3. Use the buttons to:
   - Toggle Reader Mode
   - Toggle Dark Mode
   - Adjust Font Size (A+ and A- buttons)

## Development

The extension consists of three main files:
- `manifest.json`: Extension configuration
- `content.js`: Main functionality
- `styles.css`: Styling for controls and reader mode

## Notes

- The extension works best with pages that have content in elements with the class `contents-post`
- All controls are injected directly into the page for easy access
- The extension is responsive and works well on both desktop and mobile devices 