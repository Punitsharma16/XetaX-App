#!/bin/bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
cd /home/punit/Music/xetax-mobile || exit 1
echo "=== prebuild started $(date) ==="
npx expo prebuild --platform android --no-install || exit 1
cd android || exit 1
echo "=== gradle started $(date) ==="
./gradlew assembleRelease
rc=$?
echo "=== build finished $(date) rc=$rc ==="
ls -lh app/build/outputs/apk/release/app-release.apk 2>/dev/null
exit $rc
