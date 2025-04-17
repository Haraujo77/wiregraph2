# WireGraph2

An interactive 3D card visualization tool built with p5.js. This web application allows you to create and manipulate 3D card stacks with dynamic animations and customizable parameters.

## Features

- **Cards Mode**: Create and animate stacks of cards with customizable properties
  - Animations: Wheel, Fan, Wave, and Randomized Heights
  - Adjustable card dimensions, colors, and spacing
  - Camera controls with rotation and zoom capabilities

- **Blocks Mode**: Visualize portfolio data as 3D blocks
  - Group cards into categories with custom colors
  - Add and manage cards with specific values
  - Automatic thickness scaling based on card values

- **Visualization Options**:
  - Isometric view with adjustable angles
  - Perspective view with orbit controls
  - Auto-rotation on multiple axes
  - Camera transitions during animations

- **Export Capabilities**:
  - Export visualizations as SVG
  - Copy SVG to clipboard for use in other applications

## Live Demo

Check out the live demo at [https://haraujo77.github.io/wiregraph2/](https://haraujo77.github.io/wiregraph2/)

## Usage

1. Select either Cards or Blocks tab
2. Adjust the settings using the control panel
3. Use the "Animate" button to start animations
4. Export your visualization as SVG when finished

### Cards Mode

The Cards mode allows you to create a stack of cards with uniform dimensions and animate them in various patterns:
- **Wheel**: Arranges cards in a circular pattern
- **Fan**: Spreads cards in a fan-like arrangement
- **Wave**: Creates a wave pattern with the cards
- **Random Heights**: Generates varied card heights with market-like fluctuations

### Blocks Mode

The Blocks mode is designed for visualizing data with proportional card thickness:
- Create card groups representing different categories
- Assign values to cards that automatically determine their thickness
- Customize colors for different card groups

## Implementation Details

The application is built with p5.js and uses WEBGL for 3D rendering. Key technical features include:
- Custom 3D camera controls with orbit functionality
- SVG export with accurate depth representation
- Smooth animations with easing functions
- Responsive design that works on various screen sizes

## Running Locally

```bash
# Clone the repository
git clone https://github.com/haraujo77/wiregraph2.git

# Navigate to the directory
cd wiregraph2

# Install dependencies
npm install

# Start the server
npm start
```

Then open your browser to `http://localhost:8082`

## License

MIT License

## Credits

Created by Helder Araujo (haraujo77)