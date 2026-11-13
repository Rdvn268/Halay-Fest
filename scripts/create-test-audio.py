"""Optional fixture authoring, not an app dependency. Requires numpy + soundfile.
Original recorded calibration pulses; never present these as folk-music recordings.
Rebuild: python scripts/create-test-audio.py
"""
from pathlib import Path
import numpy as np
import soundfile as sf

target = Path('test/fixtures/audio')
target.mkdir(parents=True, exist_ok=True)
rate = 16000
t = np.arange(8 * rate) / rate
phase = (t - .15) % .5
pulse = np.where((t >= .15) & (phase < .07), np.sin(2 * np.pi * 180 * phase) * np.exp(-phase * 70) * .68, 0)
for extension, format_name in [('mp3', 'MP3'), ('ogg', 'OGG')]:
    sf.write(target / f'calibration.{extension}', pulse, rate, format=format_name)
    print(sf.info(target / f'calibration.{extension}'))
