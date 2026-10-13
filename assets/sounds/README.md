# Runner notification sounds

- `ready.wav`: Mixkit “Correct answer tone” (`2870`), approximately 2 seconds.
- `blocked.wav`: Mixkit “Wrong answer fail notification” (`946`), approximately 2 seconds.

Downloaded from Mixkit's free sound-effects collection on 2026-10-11. Mixkit states that
these effects are free to download and use under the Mixkit License:
https://mixkit.co/free-sound-effects/game-show/

The runner plays these asynchronously. `--no-sound` disables audio, while
`--ready-sound` and `--blocked-sound` allow consumer-owned replacements.
