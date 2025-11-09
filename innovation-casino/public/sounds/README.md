# Sound Files

This directory should contain the following sound files for the casino chip interactions:

## Required Files

1. **chip-place.mp3** - Short "clink" sound when placing a chip (0.1-0.2 seconds)
2. **chip-remove.mp3** - Soft "swoosh" sound when removing a chip (0.15-0.25 seconds)
3. **chips-lock.mp3** - Cascading chips sound for submission (0.4-0.6 seconds)
4. **success.mp3** - Positive confirmation sound (0.3-0.5 seconds)
5. **error.mp3** - Error/failure sound (0.2-0.3 seconds)

## Recommended Sources

- [Freesound.org](https://freesound.org/) - Free sound effects with various licenses
- [Zapsplat](https://www.zapsplat.com/) - Free sound effects (requires free account)
- [Mixkit](https://mixkit.co/free-sound-effects/) - Royalty-free sounds

## Fallback

If sound files are not present, the application will use Web Audio API to generate simple synthetic sounds as a fallback.

## File Format

- Format: MP3
- Sample Rate: 44.1 kHz
- Bit Rate: 128 kbps minimum
- Volume: Normalized to -3dB peak

## License

Ensure all sound files used are properly licensed for commercial use or have appropriate Creative Commons licenses.