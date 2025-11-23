# React Native Skia Build Troubleshooting

Common build issues and solutions for React Native Skia projects.

## 🔧 Common Build Errors

### 1. CMake Directory Lock Error

**Error:**
```
Unable to delete directory '/path/to/android/app/.cxx/Debug/...' after 10 attempts
```

**Solution:**
```bash
# Clean CMake cache
rm -rf android/app/.cxx

# Clean Gradle cache
cd android && ./gradlew clean

# Clean build directory
rm -rf android/app/build
rm -rf android/.gradle

# Rebuild
yarn android
```

---

### 2. Skia Native Build Fails

**Error:**
```
Task :shopify_react-native-skia:externalNativeBuildDebug FAILED
```

**Solution:**
```bash
# Clean node modules
rm -rf node_modules
yarn install

# Clean Skia build
cd android
./gradlew :shopify_react-native-skia:clean

# Rebuild
cd ..
yarn android
```

---

### 3. Out of Memory During Build

**Error:**
```
Expiring Daemon because JVM heap space is exhausted
```

**Solution:**

Edit `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

---

### 4. NDK Version Mismatch

**Error:**
```
No version of NDK matched the requested version
```

**Solution:**

Check `android/build.gradle`:
```gradle
buildscript {
    ext {
        ndkVersion = "26.1.10909125" // Use this version
    }
}
```

Install via Android Studio SDK Manager or:
```bash
sdkmanager --install "ndk;26.1.10909125"
```

---

### 5. Worklets Plugin Not Working

**Error:**
```
'worklet' directive can only be used in files with '.worklet.ts' extension
```

**Solution:**

Update `babel.config.js`:
```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-worklets/plugin'],
};
```

Then clean and rebuild:
```bash
yarn start --reset-cache
```

---

### 6. Skia Canvas Not Rendering

**Symptoms:**
- Blank screen where canvas should be
- No errors in console

**Solution:**

1. Check imports:
```tsx
import { Canvas } from '@shopify/react-native-skia';
```

2. Ensure canvas has dimensions:
```tsx
<Canvas style={{ width: 200, height: 200 }}>
  {/* Your Skia components */}
</Canvas>
```

3. Verify Skia is installed:
```bash
yarn list @shopify/react-native-skia
```

---

### 7. Font Matching Issues

**Error:**
```
Font not found or matchFont returns null
```

**Solution:**

Use system fonts or install custom fonts:
```tsx
import { matchFont } from '@shopify/react-native-skia';

const font = matchFont({
  fontSize: 48,
  fontWeight: 700, // Use numeric values
});

// Check if font loaded
if (!font) {
  console.error('Font failed to load');
}
```

---

### 8. Gradle Daemon Issues

**Error:**
```
Gradle build daemon disappeared unexpectedly
```

**Solution:**
```bash
# Stop all Gradle daemons
cd android
./gradlew --stop

# Clear Gradle cache
rm -rf ~/.gradle/caches/
rm -rf ~/.gradle/daemon/

# Rebuild
cd ..
yarn android
```

---

### 9. Metro Bundler Cache Issues

**Symptoms:**
- Old code still running
- Changes not reflecting

**Solution:**
```bash
# Clear Metro cache
yarn start --reset-cache

# Or manually
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*
```

---

### 10. Android Build Tools Version

**Error:**
```
Failed to find Build Tools revision X.X.X
```

**Solution:**

Check `android/build.gradle`:
```gradle
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        compileSdkVersion = 34
        targetSdkVersion = 34
    }
}
```

Install via SDK Manager:
```bash
sdkmanager --install "build-tools;34.0.0"
```

---

### 11. Runtime Error: Value is an object, expected a number

**Error:**
```
Exception in HostFunction: Value is an object, expected a number
```

**Cause:**
Passing a Reanimated SharedValue object directly to a Skia prop that expects a number or vector.

**Solution:**
Use `useDerivedValue` to unwrap the SharedValue on the UI thread.

**Incorrect:**
```tsx
// ❌ Passing SharedValue directly
<Group transform={[{ rotate: rotation }]} />
<Circle c={vec(sharedX, sharedY)} />
```

**Correct:**
```tsx
// ✅ Use derived value
const transform = useDerivedValue(() => {
  'worklet';
  return [{ rotate: rotation.value }];
});

const center = useDerivedValue(() => {
  'worklet';
  return vec(sharedX.value, sharedY.value);
});

<Group transform={transform} />
<Circle c={center} />
```

---

## 🚀 Complete Clean Build Process

When all else fails, do a complete clean:

```bash
# 1. Clean native builds
rm -rf android/app/.cxx
rm -rf android/app/build
rm -rf android/.gradle
rm -rf android/build

# 2. Clean Gradle
cd android
./gradlew clean
./gradlew --stop
cd ..

# 3. Clean node modules
rm -rf node_modules
yarn install

# 4. Clean Metro
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-map-*

# 5. Rebuild
yarn android
```

---

## 🔍 Debugging Tips

### Enable Verbose Logging
```bash
cd android
./gradlew assembleDebug --stacktrace --info
```

### Check Skia Installation
```bash
yarn list @shopify/react-native-skia
yarn list react-native-reanimated
yarn list react-native-worklets
```

### Verify JDK Version
```bash
java -version
# Should be JDK 17 (Zulu recommended)
```

### Check Android Environment
```bash
npx react-native doctor
```

---

## 📱 Device-Specific Issues

### Emulator Performance

For better Skia performance on emulators:

1. Use hardware acceleration
2. Allocate more RAM (4GB+)
3. Enable GPU rendering in AVD settings

### Physical Device Issues

If animations are choppy:

1. Enable Developer Options
2. Disable "Force GPU rendering"
3. Set "Animator duration scale" to 1x
4. Ensure device is not in power-saving mode

---

## 🎯 Prevention Tips

1. **Lock Dependencies**: Use exact versions in `package.json`
2. **Clean Regularly**: Run clean builds weekly
3. **Update Carefully**: Test Skia updates in a branch first
4. **Monitor Memory**: Watch Gradle heap usage
5. **Use Zulu JDK 17**: Most stable for React Native

---

## 📚 Useful Commands

```bash
# Check Gradle version
cd android && ./gradlew --version

# List all Gradle tasks
./gradlew tasks --all

# Build specific variant
./gradlew assembleDebug
./gradlew assembleRelease

# Install on device
./gradlew installDebug

# Check dependencies
./gradlew :app:dependencies
```

---

## 🆘 Still Having Issues?

1. Check [React Native Skia GitHub Issues](https://github.com/Shopify/react-native-skia/issues)
2. Verify your setup with `npx react-native doctor`
3. Check Node version (use LTS)
4. Ensure Android SDK is up to date
5. Try building on a different machine to isolate environment issues

---

Last Updated: 2025-11-23
