"""Optional report authoring: pip install matplotlib==3.11.2.
Reads real Playwright evidence; never fabricates samples or edits screenshots.
Run from repo root after the hardware test: python scripts/plot-phase2.py
"""
import json
import statistics
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

directory = Path('docs/evidence/phase-2')
data = json.loads((directory / 'hardware-performance.json').read_text(encoding='utf-8'))
groups = [('6 NPC', data['baseline'], '#187a78'), ('100 mock + 6 NPC', data['crowd'], '#b36a15')]
summary = {'environment': data['environment'], 'errors': data['errors'], 'stages': {}}
for label, rows, _ in groups:
    stable = [r['telemetry'] for r in rows if label != '6 NPC' or r['elapsed'] >= 30]
    def values(key):
        return [t[key] for t in stable if t[key] is not None]
    def bounds(key):
        v = values(key)
        return {'min': min(v), 'median': statistics.median(v), 'max': max(v)} if v else None
    summary['stages'][label] = {
        'measuredSeconds': rows[-1]['elapsed'], 'samples': len(rows),
        'summarySamples': len(stable), 'fps': bounds('fps'),
        'frameP95Ms': bounds('frameP95Ms'), 'jsHeapMiB': bounds('heapMB'),
        'clockDriftP95Ms': bounds('driftP95Ms'), 'onsetGridP95Ms': bounds('onsetErrorP95Ms'),
        'handGapMeters': bounds('handGapMeters'), 'last': rows[-1]['telemetry'],
    }
(directory / 'measurement-summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')

fig, axes = plt.subplots(4, 1, sharex=True, figsize=(12, 10), layout='constrained')
for label, rows, color in groups:
    x = [r['telemetry']['mediaSeconds'] for r in rows]
    for axis, key in zip(axes[:3], ['fps', 'frameP95Ms', 'heapMB']):
        axis.plot(x, [r['telemetry'][key] for r in rows], color=color, label=label, linewidth=1.5)
    axes[3].plot(x, [r['telemetry']['driftP95Ms'] for r in rows], color=color, label=f'{label}: clock', linewidth=1.5)
    axes[3].plot(x, [r['telemetry']['onsetErrorP95Ms'] for r in rows], color=color, label=f'{label}: onset/grid', linestyle='--', linewidth=1.5)
axes[0].axhline(60, color='#76828b', linestyle=':', label='60 FPS goal')
axes[1].axhline(1000 / 60, color='#76828b', linestyle=':', label='16.7 ms reference')
for axis, title in zip(axes, ['FPS (bounded scene window)', 'Frame time p95 (ms)', 'JavaScript heap (MiB; not GPU memory or process RSS)', 'Audio clock / decoded onset-grid p95 (ms; not speaker latency)']):
    axis.set_title(title, loc='left', fontsize=10)
    axis.grid(alpha=.2)
    axis.legend(loc='upper left', bbox_to_anchor=(1.01, 1), fontsize=8, frameon=False)
axes[-1].set_xlabel('Actual media playback time (seconds); gap between stages includes join/warm-up')
fig.suptitle('HALAY FEST - Phase 2: one measured 1080 x 1920 hardware run', fontsize=14)
fig.text(.01, -.02, f"{data['environment']['renderer']['name']}\n{data['environment']['date']} | 600 s baseline + 60 s crowd; not a five-hour soak", fontsize=8)
fig.savefig(directory / 'hardware-performance.png', dpi=150, bbox_inches='tight')
print(json.dumps({k: {p: v[p] for p in ['measuredSeconds', 'fps', 'frameP95Ms', 'jsHeapMiB', 'clockDriftP95Ms', 'onsetGridP95Ms']} for k, v in summary['stages'].items()}, indent=2))
