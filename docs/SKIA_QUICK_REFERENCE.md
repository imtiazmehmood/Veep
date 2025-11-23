# Skia Components Quick Reference

## 🚀 Import

```tsx
import {
  AnimatedGradientText,
  AnimatedSkiaButton,
  AnimatedSkiaCard,
  AnimatedSkiaLoader,
  AnimatedGlitterText,
} from './components/skia';
```

---

## 📝 AnimatedGradientText

```tsx
<AnimatedGradientText
  text="Hello"
  fontSize={48}
  fontWeight="bold"
  colors={['#FF00FF', '#00FFFF', '#FFFF00']}
  duration={2000}
/>
```

**Props**: text, fontSize, fontWeight, colors, duration

---

## 🔘 AnimatedSkiaButton

```tsx
<AnimatedSkiaButton
  title="Click Me"
  onPress={() => console.log('Pressed')}
  width={200}
  height={56}
  colors={['#FF00FF', '#00FFFF']}
  duration={3000}
  disabled={false}
/>
```

**Props**: title, onPress, width, height, borderRadius, colors, glowColors, duration, disabled

---

## 🎴 AnimatedSkiaCard

```tsx
<AnimatedSkiaCard
  width={350}
  height={200}
  colors={['#FF00FF', '#00FFFF', '#FFFF00']}
  duration={4000}
>
  <Text>Your content here</Text>
</AnimatedSkiaCard>
```

**Props**: children, width, height, borderRadius, colors, shimmerColors, duration, borderWidth

---

## ⭕ AnimatedSkiaLoader

```tsx
<AnimatedSkiaLoader
  size={80}
  strokeWidth={6}
  colors={['#FF00FF', '#00FFFF', '#FFFF00']}
  duration={2000}
/>
```

**Props**: size, strokeWidth, colors, duration

---

## ✨ AnimatedGlitterText

```tsx
<AnimatedGlitterText
  text="Sparkle"
  fontSize={48}
  fontWeight="bold"
  textColor="#FFD700"
  glitterColors={['#FFFFFF', '#FFD700']}
  particleCount={30}
  glitterSize={4}
  duration={3000}
/>
```

**Props**: text, fontSize, fontWeight, textColor, glitterColors, particleCount, glitterSize, duration

---

## 🎨 Color Presets

### Neon
```tsx
['#FF00FF', '#00FFFF', '#FFFF00', '#FF00FF']
```

### Purple Dream
```tsx
['#8B00FF', '#FF00FF', '#4B0082', '#8B00FF']
```

### Ocean
```tsx
['#00FFFF', '#00FF88', '#0088FF', '#00FFFF']
```

### Fire
```tsx
['#FF0000', '#FF00FF', '#FF8800', '#FF0000']
```

### Gold
```tsx
['#FFD700', '#FFA500', '#FFFF00', '#FFD700']
```

---

## ⚡ Performance Tips

1. **Use React.memo** - All components already wrapped
2. **Limit particles** - 20-40 for glitter text
3. **Reasonable durations** - 2000-4000ms
4. **Reuse components** - Don't create new instances unnecessarily
5. **Test on device** - Emulators may be slower

---

## 🐛 Quick Fixes

### Build fails
```bash
rm -rf android/app/.cxx
cd android && ./gradlew clean
cd .. && yarn android
```

### Animations choppy
- Reduce `particleCount`
- Increase `duration`
- Check device performance

### Canvas blank
- Ensure width/height are set
- Check Skia is installed
- Verify imports are correct

---

## 📱 Demo

See all components in action:
```tsx
import SkiaComponentsDemo from './screens/SkiaComponentsDemo';
```

---

## 📚 Full Docs

- `docs/SKIA_COMPONENTS.md` - Complete documentation
- `docs/GLITTER_TEXT.md` - Glitter text guide
- `docs/SKIA_TROUBLESHOOTING.md` - Build issues
- `docs/SKIA_COMPONENTS_SUMMARY.md` - Implementation summary
