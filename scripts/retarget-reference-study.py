"""Blender 4.5: video pose estimates -> existing WeddingGuest01, local review only.

No synthetic dance fallback, no forced loop, no claimed contact or beat labels.
Requires extraction output. Original source is opened read-only and never saved over.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Matrix, Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
from reference_pose_validation import require_retarget_input

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--poses", required=True, type=Path)
parser.add_argument("--out", required=True, type=Path)
parser.add_argument("--diagnostic-only", action="store_true",
                    help="Hold the last observed pose at missing samples; NOT a deliverable dance")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
ROOT = Path(__file__).resolve().parents[1]
source = ROOT / "assets/characters/wedding-guest-01/wedding-guest-01.blend"
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
out = args.out.resolve()
if not out.is_relative_to(ROOT / "data"):
    raise ValueError("Unapproved reference studies must stay in ignored data/")
out.mkdir(parents=True, exist_ok=True)
report = json.loads(args.poses.read_text(encoding="utf-8"))
rows = report["frames"]
quality = require_retarget_input(report, args.diagnostic_only)
bpy.ops.wm.open_mainfile(filepath=str(source))
rig = bpy.data.objects["WeddingGuest01"]
if len(rig.data.bones) != 52:
    raise ValueError("Expected original 52 bone character")
scene = bpy.context.scene
scene.render.fps = 30
scene.render.fps_base = 1
rig.animation_data_clear()
rig["dancePerformance"] = "Deli Horon video-estimated local study, NOT validated mocap"
rig["motionRights"] = "unverified-user-waived-paperwork"
rig["geometryLicense"] = "CC0-1.0"
rig["license"] = "Geometry CC0-1.0 ONLY; animation rights unverified, local diagnostic study"
rig["artApproval"] = "pending-user-review"
bones = rig.pose.bones
prefix = "mixamorig:"
rest = {b.name: b.matrix_local.copy() for b in rig.data.bones}


def vec(row, index):
    p = row["world"][index]
    return Vector((p[0], p[2], -p[1]))  # camera axes -> Blender Z up


def body_basis(row):
    x = (vec(row, 23) - vec(row, 24)).normalized()
    up = ((vec(row, 11) + vec(row, 12)) / 2 - (vec(row, 23) + vec(row, 24)) / 2).normalized()
    y = up.cross(x).normalized()
    z = x.cross(y).normalized()
    return Matrix((x, y, z)).transposed().to_quaternion()


def set_world_rotation(name, rotation):
    bone = bones[prefix + name]
    matrix = bone.matrix.copy()
    matrix = rotation.to_matrix().to_4x4()
    matrix.translation = bone.head.copy()
    bone.matrix = matrix
    bpy.context.view_layer.update()


def aim(name, direction, body):
    if direction.length < 0.005:
        raise ValueError("Degenerate inferred limb")
    basis = body @ rest[prefix + name].to_quaternion()
    base_direction = basis @ Vector((0, 1, 0))
    set_world_rotation(name, base_direction.rotation_difference(direction.normalized()) @ basis)


segments = [
    ("LeftArm", 11, 13), ("LeftForeArm", 13, 15),
    ("RightArm", 12, 14), ("RightForeArm", 14, 16),
    ("LeftUpLeg", 23, 25), ("LeftLeg", 25, 27),
    ("RightUpLeg", 24, 26), ("RightLeg", 26, 28),
]
# Symmetric three-sample smoothing reduces inference jitter without shifting audio.
smoothed = []
for i, row in enumerate(rows):
    sample = dict(row)
    if row["valid"]:
        window = [r for r in rows[max(0, i-1):min(len(rows), i+2)] if r["valid"]]
        sample["world"] = [[sum(r["world"][j][k] for r in window)/len(window)
                            for k in range(4)] for j in range(33)]
    smoothed.append(sample)
initial = rows[0]
initial_hip = [(initial["image"][23][k] + initial["image"][24][k])/2 for k in range(2)]
# Fixed-camera image translation; depth cannot be reconstructed metrically.
pixel_height = max(initial["image"][27][1], initial["image"][28][1]) - initial["image"][0][1]
image_scale = 1.55 / pixel_height
hip_rest = rest[prefix + "Hips"].translation.copy()
first = rows[0]["time"]
max_frame = 0
previous_quaternions = {}
diagnostics = []
last_basis = None
view_rotation = body_basis(smoothed[0]).inverted()
for i, row in enumerate(smoothed):
    # glTF exports Blender frame numbers / FPS. Frame 1 would add a 33 ms
    # pose/audio offset even though the viewer's media clock is perfectly shared.
    frame = (row["time"] - first) * 30
    max_frame = max(max_frame, math.ceil(frame))
    scene.frame_set(math.floor(frame), subframe=frame % 1)
    if not row["valid"]:
        if last_basis is None:
            raise ValueError("Cannot hold an unobserved initial pose")
        for bone in bones:
            bone.matrix_basis = last_basis[bone.name]
            bone.keyframe_insert("rotation_quaternion", frame=frame, group=bone.name)
        bones[prefix+"Hips"].keyframe_insert("location", frame=frame, group=prefix+"Hips")
        diagnostics.append({"time": row["time"]-first, "heldMissingSample": True})
        continue
    for bone in bones:
        bone.matrix_basis.identity()
        bone.rotation_mode = "QUATERNION"
    bpy.context.view_layer.update()
    body = view_rotation @ body_basis(row)
    set_world_rotation("Hips", body @ rest[prefix + "Hips"].to_quaternion())
    hip = bones[prefix + "Hips"]
    image_hip = [(row["image"][23][k] + row["image"][24][k])/2 for k in range(2)]
    matrix = hip.matrix.copy()
    matrix.translation = hip_rest + view_rotation @ Vector(((image_hip[0]-initial_hip[0])*image_scale*16/9,
                                            0, (initial_hip[1]-image_hip[1])*image_scale))
    hip.matrix = matrix
    bpy.context.view_layer.update()
    # Body orientation from observed hips/shoulders; no invented shoulder rhythm.
    for name, a, b in segments:
        aim(name, view_rotation @ (vec(row, b) - vec(row, a)), body)
    # The inferred toe depths produced visibly inverted soles. Reject those
    # rotations rather than presenting them as measured contact. Keep neutral
    # bind foot orientation relative to body; toe roll remains unimplemented.
    for name in ["LeftFoot", "RightFoot"]:
        set_world_rotation(name, body @ rest[prefix+name].to_quaternion())
    # Hand/finger twist and head expression remain the inherited bind pose.
    # Correct visible floor penetration only; this is NOT a stance/foot lock solver.
    floor_before = min(bones[prefix + name].head.z for name in ["LeftFoot", "RightFoot"])
    lift = max(0, 0.055 - floor_before)
    if lift:
        matrix = hip.matrix.copy()
        matrix.translation.z += lift
        hip.matrix = matrix
        bpy.context.view_layer.update()
    for bone in bones:
        q = bone.rotation_quaternion
        if bone.name in previous_quaternions and q.dot(previous_quaternions[bone.name]) < 0:
            q.negate()
        previous_quaternions[bone.name] = q.copy()
        bone.keyframe_insert("rotation_quaternion", frame=frame, group=bone.name)
    hip.keyframe_insert("location", frame=frame, group=hip.name)
    last_basis = {bone.name: bone.matrix_basis.copy() for bone in bones}
    diagnostics.append({"time": row["time"] - first,
                        "ankleFloorBeforeCorrectionMetres": floor_before,
                        "rootLiftMetres": lift,
                        "ankles": {side: list(bones[prefix+side+"Foot"].head) for side in ["Left", "Right"]}})
action = rig.animation_data.action
action.name = "DeliHoron_VideoEstimate_UNVALIDATED"
for layer in action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for key in curve.keyframe_points:
                    key.interpolation = "LINEAR"
scene.frame_start, scene.frame_end = 0, max_frame
scene.frame_set(0)
runtime = bpy.data.collections["RUNTIME - exported deform rig"]
bpy.ops.object.select_all(action="DESELECT")
for obj in runtime.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=str(out / "wedding-guest-01-deli-horon-study.glb"),
    export_format="GLB", use_selection=True, export_yup=True, export_animations=True,
    export_animation_mode="ACTIONS", export_frame_range=True, export_force_sampling=True,
    export_skins=True, export_morph=False, export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out / "wedding-guest-01-deli-horon-study.blend"), compress=True)
summary = {
    "kind": "single-camera-video-estimated-retarget-study-not-mocap",
    "durationSeconds": max_frame/30, "samples": len(rows), "bones": len(bones),
    "sourceCharacterSha256": source_hash, "sourceVideoStart": report["sourceStart"],
    "poseEstimateSha256": hashlib.sha256(args.poses.read_bytes()).hexdigest(),
    "rights": report["rights"], "legVisibilityBelow07": report["legVisibilityBelow07"],
    "diagnosticOnly": args.diagnostic_only,
    "inputQuality": quality,
    "heldMissingSamples": sum(not r["valid"] for r in rows),
    "footLocking": False, "groundTruthFootContact": None, "beatValidation": None,
    "loopValidated": False, "artApproved": False,
    "limitations": ["Depth inferred; root Y not reconstructed", "No measured centre of mass",
                    "Foot rotations held neutral; inferred toe depth rejected",
                    "No hand/finger capture", "No expert validation", "No verified loop seam",
                    "Floor penetration correction is not foot contact validation"],
    "diagnostics": diagnostics,
}
(out / "retarget-report.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
assert hashlib.sha256(source.read_bytes()).hexdigest() == source_hash
print("RETARGET_STUDY", json.dumps({k:v for k,v in summary.items() if k != "diagnostics"}))
