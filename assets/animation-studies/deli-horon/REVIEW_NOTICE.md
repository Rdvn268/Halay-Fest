# Deli Horon video estimate — review only, not an accepted dance asset

These files are an explicitly **unvalidated diagnostic study** on PR #6's existing
`wedding-guest-01` character. They are excluded from the application public/build
directories and are not automatically played by the game. Do not present them as
validated mocap, an authentic finished regional figure, or a commercially cleared
production animation. Artistic acceptance remains open; the PR stays draft.

The source reference is [Hadi Dans Edelim - Deli Horon](https://www.youtube.com/watch?v=lEE_s05sTkM),
published by Engin Işık. The inspected segment starts at source time 6.045044 s;
this is not a figure boundary. The user waived a separate permission-document
requirement. No verified grant from the recording, performance or music rights
holders was obtained; public visibility is not recorded as such a grant. This
notice does not grant a new commercial license to the inferred motion.

The **character geometry/materials/rig** retain their documented MakeHuman CC0
provenance: `assets/licenses/makehuman-CC0.txt`,
`assets/licenses/makehuman-character-provenance.txt`, and the original
`apps/broadcaster/public/characters/production/build-info.json`.
That geometry license does not establish rights to the performance or music.

Motion was estimated with MediaPipe Heavy (33 landmarks), then direction-retargeted
to the existing 52-bone rig using `scripts/retarget-reference-study.py` with
`--diagnostic-only`. 35/300 samples are missing and hold the last observed pose;
192/265 detected samples have leg visibility below 0.7. Single-camera depth is
inferred. Foot rotations are neutral because inferred toe directions failed visual
inspection. Foot locking, depth/root trajectory, hand grasp, natural weight
transfer, seamless loop, beat/footfall match and expert dance accuracy are **not
validated**. Clothing deformation and floating/sliding feet remain visible defects.

The `.blend` is editable, the `.glb` contains one ~19.97 s clip and the same rig.
The front/side videos and PNGs are actual Three.js renders, with a diagnostic
watermark on the videos. View names refer to the starting orientation; the dancer
turns during the clip. The MP4 files in this directory have **no audio track**.
No source video frames, source audio, raw pose estimates or model weights are
included. Audible review copies remain in ignored `data/private-prototypes/`.

See `docs/DELI_HORON_LOCAL_PROTOTYPE.md` and
`docs/evidence/deli-horon-local/technical-results.json` for measured results,
local-only outputs and tests. This study is not completion of Phase 2 or approval
to expand to six characters, other dances or Phase 3.
