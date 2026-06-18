# Sounds Directory

The app ships with a default `bell.wav` in this folder.

If you want a custom sound, you can replace it with your own file and update
the path in `frontend/src/App.vue`.

## Recommended Sources for Free Sound Effects

- [Pixabay Sound Effects](https://pixabay.com/sound-effects/) - Free for commercial use
- [Freesound](https://freesound.org/) - Creative Commons sounds
- [Mixkit](https://mixkit.co/free-sound-effects/) - Free sound effects

## Default Fallback

If the sound file fails to load or autoplay is blocked, the app will use a
synthesized tone generated via the Web Audio API.
