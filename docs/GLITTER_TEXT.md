# AnimatedGlitterText Component

A stunning text component with sparkling glitter particles and shine effects, built with React Native Skia for maximum performance.

## ✨ Features

- **Sparkling Particles**: Randomly distributed glitter particles that fade in/out
- **Radial Glow**: Each particle has a radial gradient glow effect
- **Pulsing Animation**: Particles pulse and scale dynamically
- **Floating Movement**: Particles move in sine/cosine patterns for organic feel
- **Shine Sweep**: Additional gradient sweep effect across the text
- **Background Glow**: Soft blur behind text for depth
- **Fully Customizable**: Colors, particle count, size, duration, and more

## 🎯 Usage

### Basic Example

```tsx
import AnimatedGlitterText from './components/AnimatedGlitterText';

<AnimatedGlitterText
  text="Sparkle"
  fontSize={48}
  fontWeight="bold"
  textColor="#FFD700"
/>
```

### Advanced Example

```tsx
<AnimatedGlitterText
  text="✨ Diamond ✨"
  fontSize={52}
  fontWeight="bold"
  textColor="#00FFFF"
  glitterColors={[
    '#FFFFFF',
    '#00FFFF',
    '#0088FF',
    '#FFFFFF',
  ]}
  particleCount={40}
  duration={3000}
  glitterSize={5}
/>
```

## 📋 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | `string` | `'Sparkle'` | Text to display |
| `fontSize` | `number` | `48` | Font size in pixels |
| `fontWeight` | `string` | `'bold'` | Font weight (normal, bold, 100-900) |
| `textColor` | `string` | `'#FFFFFF'` | Base text color |
| `glitterColors` | `string[]` | White/Gold/Pink/Cyan | Colors for glitter particles |
| `particleCount` | `number` | `30` | Number of glitter particles |
| `duration` | `number` | `3000` | Animation duration in ms |
| `glitterSize` | `number` | `4` | Base size of particles in pixels |

## 🎨 Preset Styles

### Golden Sparkle
```tsx
<AnimatedGlitterText
  text="Gold"
  textColor="#FFD700"
  glitterColors={['#FFFFFF', '#FFD700', '#FFA500', '#FFFFFF']}
  particleCount={40}
  glitterSize={5}
/>
```

### Diamond Ice
```tsx
<AnimatedGlitterText
  text="Diamond"
  textColor="#00FFFF"
  glitterColors={['#FFFFFF', '#00FFFF', '#0088FF', '#FFFFFF']}
  particleCount={35}
  glitterSize={4}
/>
```

### Magic Purple
```tsx
<AnimatedGlitterText
  text="Magic"
  textColor="#FF00FF"
  glitterColors={['#FFFFFF', '#FF00FF', '#FF69B4', '#FFD700']}
  particleCount={30}
  glitterSize={3}
/>
```

### Rainbow Shimmer
```tsx
<AnimatedGlitterText
  text="Rainbow"
  textColor="#FFFFFF"
  glitterColors={[
    '#FF0000',
    '#FF00FF',
    '#0000FF',
    '#00FFFF',
    '#00FF00',
    '#FFFF00',
  ]}
  particleCount={50}
  glitterSize={4}
/>
```

## 🔧 How It Works

### 1. **Particle Generation**
Each particle is randomly positioned and assigned:
- Random X/Y offset within text bounds
- Random size variation (0.5x to 2x base size)
- Random delay for staggered animation
- Random speed multiplier
- Random color from the palette

### 2. **Animation Cycle**
Each particle goes through phases:
1. **Fade In** (0-30%): Opacity and scale increase
2. **Peak** (30-50%): Full brightness with subtle pulse
3. **Fade Out** (50-80%): Opacity and scale decrease
4. **Hidden** (80-100%): Invisible, waiting to restart

### 3. **Movement Pattern**
Particles float using sine/cosine functions:
- Horizontal: `sin(progress * 2π) * 10px`
- Vertical: `cos(progress * 2π) * 8px`

### 4. **Rendering Layers**
1. Background glow (blurred text)
2. Main text with gradient
3. Glitter particles (outer glow + core + center)
4. Shine sweep overlay

## 🚀 Performance

- **60 FPS** on modern devices
- **UI Thread Animations** using worklets
- **Efficient Rendering** with Skia
- **Memoized Particles** to prevent regeneration
- **Optimized Calculations** with `useDerivedValue`

## 💡 Tips

### Adjust Particle Density
```tsx
// Subtle sparkle
<AnimatedGlitterText particleCount={15} />

// Heavy sparkle
<AnimatedGlitterText particleCount={60} />
```

### Control Animation Speed
```tsx
// Slow, relaxed
<AnimatedGlitterText duration={5000} />

// Fast, energetic
<AnimatedGlitterText duration={1500} />
```

### Particle Size Variations
```tsx
// Tiny sparkles
<AnimatedGlitterText glitterSize={2} />

// Large sparkles
<AnimatedGlitterText glitterSize={8} />
```

### Match Your Brand Colors
```tsx
<AnimatedGlitterText
  textColor="#YOUR_BRAND_COLOR"
  glitterColors={[
    '#FFFFFF',
    '#YOUR_BRAND_COLOR',
    '#YOUR_ACCENT_COLOR',
  ]}
/>
```

## 🎬 Use Cases

- **App Titles**: Eye-catching headers
- **Premium Features**: Highlight paid/premium content
- **Achievements**: Celebrate user milestones
- **Special Events**: Holiday or seasonal themes
- **CTAs**: Make buttons stand out
- **Loading States**: Engaging loading indicators

## 🐛 Troubleshooting

### Particles not visible
- Increase `particleCount` or `glitterSize`
- Check `glitterColors` contrast with background
- Ensure text is visible first

### Performance issues
- Reduce `particleCount` (try 20-30)
- Increase `duration` for slower animation
- Reduce `glitterSize`

### Text looks blurry
- Ensure `fontSize` is appropriate for device
- Check font weight is supported
- Verify Skia is properly installed

## 🔮 Future Enhancements

- [ ] Custom particle shapes (stars, hearts, etc.)
- [ ] Gesture interaction (tap to burst)
- [ ] Trail effects following particles
- [ ] Color cycling through rainbow
- [ ] Sound effects on particle spawn
- [ ] Haptic feedback integration

---

Built with ❤️ using React Native Skia
