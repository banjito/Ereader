# TrueReader App CSS/StyleSheet Documentation

## Overview
TrueReader is a React Native application that uses JavaScript-based styling through `StyleSheet.create()` rather than traditional CSS files. The app follows a dark theme design with a monochromatic color scheme.

## Color Palette
- **Primary Background**: `#000000` (Black)
- **Primary Text**: `#FFFFFF` (White) 
- **Secondary Text**: `#808080` (Gray)
- **Accent Color**: `#FFFFFF` (White for buttons and highlights)
- **Delete Action**: `#FF3B30` (Red)

## Typography
- **Header Title**: 32px, 600 weight
- **Book Title**: 18px, 600 weight
- **Book Author**: 14px, normal weight
- **Progress Text**: 12px, normal weight
- **Modal Title**: 20px, 600 weight
- **Modal Subtitle**: 14px, normal weight
- **Input Text**: 16px, normal weight
- **Button Text**: 16px, 500 weight

## Layout Components

### Container Styles
```javascript
container: {
  flex: 1,
  backgroundColor: '#000000',
}
```

### Header
```javascript
header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 24,
  paddingVertical: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#808080',
}
```

### Book Cards
```javascript
bookCard: {
  backgroundColor: '#000000',
  borderWidth: 1,
  borderColor: '#808080',
  borderRadius: 8,
  marginBottom: 16,
  padding: 20,
}
```

### Progress Bar
```javascript
progressBarBackground: {
  flex: 1,
  height: 4,
  backgroundColor: '#808080',
  borderRadius: 2,
  marginRight: 12,
}
progressBarFill: {
  height: '100%',
  backgroundColor: '#FFFFFF',
  borderRadius: 2,
}
```

### Floating Action Button
```javascript
addButton: {
  position: 'absolute',
  right: 24,
  bottom: 40,
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: '#FFFFFF',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#FFFFFF',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
}
```

### Modal Styles
```javascript
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  justifyContent: 'center',
  alignItems: 'center',
}
modalContent: {
  backgroundColor: '#000000',
  borderWidth: 1,
  borderColor: '#808080',
  borderRadius: 12,
  padding: 24,
  width: '80%',
  maxWidth: 400,
}
```

### Input Fields
```javascript
input: {
  backgroundColor: '#000000',
  borderWidth: 1,
  borderColor: '#808080',
  borderRadius: 8,
  padding: 12,
  fontSize: 16,
  color: '#FFFFFF',
  marginBottom: 24,
}
```

### Buttons
```javascript
// Primary button (white background)
addBookButton: {
  backgroundColor: '#FFFFFF',
}
addBookButtonText: {
  color: '#000000',
  fontSize: 16,
  fontWeight: '500',
}

// Secondary button (black background with border)
cancelButton: {
  backgroundColor: '#000000',
  borderWidth: 1,
  borderColor: '#808080',
}
cancelButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '500',
}
```

## Design Patterns

### Border Radius
- Small elements (buttons, inputs): 8px
- Medium elements (modals): 12px
- Large elements (FAB): 28px

### Spacing
- Small gaps: 8px, 12px
- Medium gaps: 16px, 20px
- Large gaps: 24px
- Extra large: 40px (FAB bottom margin)

### Border Width
- Standard borders: 1px
- Progress bar height: 4px

### Shadow Effects
- FAB uses white shadow with 0.3 opacity
- Shadow offset: 0px horizontal, 2px vertical
- Shadow radius: 4px

## File Structure
Styling is defined within component files using `StyleSheet.create()`:
- `HomeScreen.tsx:413-620` - Main app styles
- `ReaderScreen.tsx` - Reader-specific styles (if exists)

## Notes
- No external CSS files are used
- All styling is done through React Native's StyleSheet API
- The app maintains a consistent dark theme throughout
- Typography uses system fonts with varying weights and sizes
- Interactive elements use white as accent color on black background