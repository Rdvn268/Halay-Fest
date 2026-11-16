"""Blender 4.5: reference-driven 4.63 s contact cleanup on PR #8's character.

Observed 2D timing + authored depth/weight corrections, NOT verified 3D mocap.
No new character, scene/game mode or synthesized dance oscillator.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

import bpy
import numpy as np
from mathutils import Vector, Quaternion

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--keypoints", type=Path, required=True)
parser.add_argument("--out", type=Path, required=True)
args = parser.parse_args(sys.argv[sys.argv.index("--")+1:])
ROOT = Path(__file__).resolve().parents[1]
source = ROOT/"assets/animation-studies/deli-horon/wedding-guest-01-study.blend"
out = args.out.resolve()
if not out.is_relative_to(ROOT/"data"):
    raise ValueError("Generate locally first; review exports are copied explicitly")
out.mkdir(parents=True,exist_ok=True)
data = json.loads(args.keypoints.read_text())
rows = data["frames"]
N = 278
FPS = 60  # Dense IK bake; source observations remain 30 Hz.
DURATION = N/FPS
times = np.array([r["time"] for r in rows])
raw = np.array([r["points"] for r in rows])
scores = np.array([r["scores"] for r in rows])
grid = np.arange(N+1)/FPS
if len(rows)<130 or any(np.diff(times)<=0):
    raise ValueError("Need the inspected, timestamped short reference interval")


def smooth(values, radius=2, periodic=False):
    padded = np.pad(values,[(radius,radius)]+[(0,0)]*(values.ndim-1),mode="wrap" if periodic else "edge")
    return np.array([np.mean(padded[i:i+radius*2+1],axis=0) for i in range(len(values))])


rejected = []
points = np.zeros((N+1,26,2))
for joint in range(26):
    valid = scores[:,joint] >= (0.50 if joint<17 else 0.48)
    # Foreground shoes were visibly borrowed by both estimators at these depths.
    if joint in [15,16,20,21,22,23,24,25]:
        valid &= raw[:,joint,1] < 622
        hip_x=(raw[:,11,0]+raw[:,12,0])/2
        valid &= (raw[:,joint,0]-hip_x < 130) & (raw[:,joint,0]-hip_x > -220)
    if joint in [16,21,23,25]:
        valid &= raw[:,joint,0]-hip_x < 35
    if joint in [15,20,22,24]:
        delta=raw[:,20,0]-raw[:,21,0]
        valid &= (delta > -80) & (delta < 140)
    for axis in range(2):
        values = raw[:,joint,axis].copy()
        med = np.array([np.median(values[max(0,i-3):i+4]) for i in range(len(values))])
        valid &= abs(values-med) < (40 if joint>=13 else 65)
    if valid.sum()<15:
        raise ValueError(f"Insufficient reference for joint {joint}")
    rejected.extend({"sample":int(i),"time":float(times[i]),"joint":joint} for i in np.flatnonzero(~valid))
    for axis in range(2):
        points[:,joint,axis] = np.interp(grid,times[valid],raw[valid,joint,axis])
points = smooth(points,4)

# Visually estimated near/right forefoot support, boundary uncertainty +/-2 frames.
# Far/left foot support is not asserted where the profile/foreground occludes it.
contacts = [[0,.10],[.33,.60],[.73,.83],[1.10,1.23],[1.40,1.63],
            [1.80,2.00],[2.20,2.33],[2.73,2.97],[3.10,3.20],
            [3.33,3.60],[3.80,3.90],[4.10,4.30],[4.50,DURATION]]


def close_loop(values, seconds=.24):
    values=values.copy()
    edge=max(2,round(seconds*FPS))
    common=(values[0]+values[-1])/2
    first,last=values[0].copy(),values[-1].copy()
    for i in range(edge+1):
        w=(1-i/edge)**2*(1+2*i/edge)
        values[i] += (common-first)*w
        values[-1-i] += (common-last)*w
    values[-1]=values[0]
    # Identical seam tangents; this edits the source, it is not observed motion.
    tangent=(values[1]-values[-2])/2
    values[1]=common+tangent
    values[-2]=common-tangent
    return values


def contact_amount(t):
    weights=[]
    for start,end in contacts:
        distance=max(start-t,t-end,0)
        u=min(1,distance/.08)
        weights.append(1-(u*u*u*(u*(u*6-15)+10)))
    return max(weights)


toeR=points[:,21].copy()
toeL=points[:,20].copy()
heelR=points[:,25].copy()
heelL=points[:,24].copy()
hip=(points[:,11]+points[:,12])/2
shoulder=(points[:,5]+points[:,6])/2
# Remove the performer's accumulated group translation for an in-place loop.
travel=toeR[-1,0]-toeR[0,0]
drift=np.linspace(0,travel,N+1)
scale=.0035  # Authored scale; camera intrinsics/depth were not calibrated.
origin=toeR[0,0]
feet={}
floor=np.array([np.max(toeR[max(0,i-14):i+15,1]) for i in range(N+1)])
floor=smooth(floor,8)
for side,toe,heel,x in [("Right",toeR,heelR,-.105),("Left",toeL,heelL,.105)]:
    y=-(toe[:,0]-drift-origin)*scale
    z=np.maximum(0,(floor-(15 if side=="Left" else 0)-toe[:,1])*scale)
    z=np.minimum(z,.18)
    trajectory=close_loop(np.column_stack([np.full(N+1,x),y,z]))
    pitch=np.arctan2(np.maximum(-12,toe[:,1]-heel[:,1]-7),np.maximum(25,np.abs(toe[:,0]-heel[:,0])))
    pitch=close_loop(np.clip(pitch,-.12,.42))
    feet[side]={"raw":trajectory.copy(),"position":trajectory,"pitch":pitch}

# Reject neighbouring-shoe excursions that exceed this rig's plausible stance.
# This is an authored out-of-plane correction, recorded as such in the report.
left_before=feet["Left"]["position"][:,1].copy()
feet["Left"]["position"][:,1]=np.clip(left_before,
    feet["Right"]["raw"][:,1]-.34,feet["Right"]["raw"][:,1]+.10)
left_depth_corrections=np.abs(left_before-feet["Left"]["position"][:,1])

# Lock actual toe contact anchors, with zero-velocity approaches/releases.
anchors=[]
for start,end in contacts:
    active=(grid>=start)&(grid<=end)
    anchor=np.mean(feet["Right"]["raw"][active],axis=0)
    anchor[2]=0
    anchors.append(anchor)
anchors[0]=anchors[-1]=(anchors[0]+anchors[-1])/2
for i,t in enumerate(grid):
    distances=[max(start-t,t-end,0) for start,end in contacts]
    index=int(np.argmin(distances))
    w=contact_amount(t)
    feet["Right"]["position"][i] = feet["Right"]["raw"][i]*(1-w)+anchors[index]*w
feet["Right"]["position"][-1]=feet["Right"]["position"][0]

# Source torso bob/lean preserved after removing camera/group translation.
hip_bob=(smooth(hip[:,1],14)-hip[:,1])*scale
root_z=close_loop(np.clip(.94+hip_bob,.87,1.04))
lean=close_loop(np.clip((shoulder[:,0]-hip[:,0])*scale/.48,-.08,.26))
root_y=close_loop(smooth(np.interp(grid,[(a+b)/2 for a,b in contacts],
    [v[1] for v in anchors])+.025,6))
weight=close_loop(np.array([contact_amount(t) for t in grid]))
root_x=close_loop(smooth(-.065*weight,6))
arm_signals={side:close_loop(points[:,w]-points[:,s])
             for side,s,w in [("Left",5,9),("Right",6,10)]}

bpy.ops.wm.open_mainfile(filepath=str(source))
rig=bpy.data.objects["WeddingGuest01"]
rig.animation_data_clear()
bones=rig.pose.bones
P="mixamorig:"
for bone in bones:
    bone.matrix_basis.identity()
    bone.rotation_mode="QUATERNION"
bpy.context.view_layer.update()
rest={bone.name:bone.matrix_local.copy() for bone in rig.data.bones}
runtime=bpy.data.collections["RUNTIME - exported deform rig"]
shoe=next(o for o in runtime.objects if o.type=="MESH" and "shoes01" in o.name)
rest_vertices=[shoe.matrix_world@v.co for v in shoe.data.vertices]
# Leather soles must not follow shin weights through an ankle bend. Preserve
# geometry/materials and all other meshes; repair only the existing shoe weights.
for vertex in shoe.data.vertices:
    if (shoe.matrix_world@vertex.co).z>.07:
        continue  # Preserve ankle/cuff deformation; only the sole is rigid.
    side="Left" if (shoe.matrix_world@vertex.co).x>0 else "Right"
    for group in shoe.vertex_groups:
        group.remove([vertex.index])
    group=shoe.vertex_groups.get(P+side+"Foot")
    if group is None:
        group=shoe.vertex_groups.new(name=P+side+"Foot")
    group.add([vertex.index],1,"REPLACE")
pivots={}
sole_indices={}
for side,sign in [("Left",1),("Right",-1)]:
    ids=[i for i,v in enumerate(rest_vertices) if v.x*sign>0]
    low=min(rest_vertices[i].z for i in ids)
    sole=[i for i in ids if rest_vertices[i].z<low+.022]
    # Lowest vertex at a forefoot-loaded pitch, from the real shoe mesh.
    foot=rest[P+side+"Foot"]
    inv=foot.inverted()
    rotation=Quaternion((1,0,0),.42)@foot.to_quaternion()
    pivot=min(sole,key=lambda i:(rotation@(inv@rest_vertices[i])).z)
    pivots[side]=inv@rest_vertices[pivot]
    sole_indices[side]=sole

# Anticipate leg reach before a landing/kick rather than snapping the pelvis
# downward when a target becomes unreachable. The envelope only lowers the
# desired pelvis, so it cannot reintroduce foot stretch or penetrate the floor.
caps=[]
for i in range(N+1):
    cap=float(root_z[i])
    for side in ["Left","Right"]:
        rotation=Quaternion((1,0,0),max(0,float(feet[side]["pitch"][i])))@rest[P+side+"Foot"].to_quaternion()
        target=Vector(feet[side]["position"][i])-rotation@pivots[side]
        offset=Quaternion((1,0,0),float(lean[i])*.18)@(rest[P+side+"UpLeg"].translation-rest[P+"Hips"].translation)
        dx=target.x-float(root_x[i])-offset.x
        dy=target.y-float(root_y[i])-offset.y
        reach=rig.data.bones[P+side+"UpLeg"].length+rig.data.bones[P+side+"Leg"].length-.012
        cap=min(cap,target.z+math.sqrt(max(.01,reach*reach-dx*dx-dy*dy))-offset.z)
    caps.append(cap)
caps=np.array(caps)
anticipation=round(.10*FPS)
padded=np.pad(caps,(anticipation,anticipation),mode="wrap")
lower=np.array([min(padded[i:i+2*anticipation+1]) for i in range(N+1)])
root_z=np.minimum(caps,smooth(lower,anticipation,periodic=True))
root_z[-1]=root_z[0]

scene=bpy.context.scene
scene.render.fps=FPS
scene.frame_start=0
scene.frame_end=N
guides=bpy.data.collections.new("CONTACT EDIT GUIDES - baked pose, not live constraints")
scene.collection.children.link(guides)
empties={}
for side in ["Left","Right"]:
    obj=bpy.data.objects.new(side+" toe target",None)
    obj.empty_display_type="SPHERE"
    obj.empty_display_size=.025
    obj.hide_render=True
    guides.objects.link(obj)
    empties[side]=obj


def world_rotation(name,q):
    bone=bones[P+name]
    matrix=q.to_matrix().to_4x4()
    matrix.translation=bone.head
    bone.matrix=matrix
    bpy.context.view_layer.update()


def aim(name,direction):
    basis=rest[P+name].to_quaternion()
    q=(basis@Vector((0,1,0))).rotation_difference(direction.normalized())@basis
    world_rotation(name,q)


def solve_limb(a,b,c,target,pole):
    ba,bb,bc=[bones[P+n] for n in [a,b,c]]
    origin=ba.head.copy()
    l1=rig.data.bones[P+a].length
    l2=(rest[P+c].translation-rest[P+b].translation).length
    axis=target-origin
    distance=min(l1+l2-.00001,max(abs(l1-l2)+.00001,axis.length))
    axis.normalize()
    bend=pole-axis*pole.dot(axis)
    if bend.length<.001:
        bend=Vector((1,0,0))-axis*axis.x
    bend.normalize()
    along=(l1*l1-l2*l2+distance*distance)/(2*distance)
    knee=origin+axis*along+bend*math.sqrt(max(0,l1*l1-along*along))
    aim(a,knee-origin)
    aim(b,target-bb.head)
    return (bc.head-target).length


metrics=[]
previous_q={}
foot_rotation={}
for frame,t in enumerate(grid):
    scene.frame_set(frame)
    for bone in bones:
        bone.matrix_basis.identity()
    bpy.context.view_layer.update()
    for name,factor in [("Hips",.18),("Spine",.40),("Spine1",.70),("Spine2",1.)]:
        world_rotation(name,Quaternion((1,0,0),float(lean[frame])*factor)@rest[P+name].to_quaternion())
    world_rotation("Head",Quaternion((1,0,0),float(lean[frame])*.45)@rest[P+"Head"].to_quaternion())
    root=bones[P+"Hips"]
    matrix=root.matrix.copy()
    matrix.translation=Vector((float(root_x[frame]),float(root_y[frame]),float(root_z[frame])))
    root.matrix=matrix
    bpy.context.view_layer.update()
    targets={}
    for side in ["Left","Right"]:
        pitch=max(0,float(feet[side]["pitch"][frame]))
        q=Quaternion((1,0,0),pitch)@rest[P+side+"Foot"].to_quaternion()
        foot_rotation[side]=q
        toe=Vector(feet[side]["position"][frame])
        # Far foot's unverified depth is an authoring estimate, not ground truth.
        targets[side]=toe-q@pivots[side]
    # Limit pelvis height using the actual leg lengths, preserving soft knees.
    max_root=root.head.z
    for side in ["Left","Right"]:
        thigh=bones[P+side+"UpLeg"]
        target=targets[side]
        reach=rig.data.bones[P+side+"UpLeg"].length+rig.data.bones[P+side+"Leg"].length-.012
        xy=(Vector((target.x,target.y,0))-Vector((thigh.head.x,thigh.head.y,0))).length
        max_root=min(max_root,target.z+math.sqrt(max(.01,reach*reach-xy*xy))-(thigh.head.z-root.head.z))
    if max_root<root.head.z:
        matrix=root.matrix.copy()
        matrix.translation.z=max_root
        root.matrix=matrix
        bpy.context.view_layer.update()
    errors=[]
    for side in ["Left","Right"]:
        errors.append(solve_limb(side+"UpLeg",side+"Leg",side+"Foot",targets[side],Vector((0,-1,.05))))
        world_rotation(side+"Foot",foot_rotation[side])
        empties[side].location=feet[side]["position"][frame]
        empties[side].keyframe_insert("location",frame=frame)
    # Preserve measured vertical/forward wrist and elbow variations. The lateral
    # placement is authored because side video cannot measure out-of-plane depth.
    for side,ids,sign in [("Left",[5,7,9],1),("Right",[6,8,10],-1)]:
        dx,dy=arm_signals[side][frame]
        shoulder_world=bones[P+side+"Arm"].head.copy()
        target=shoulder_world+Vector((sign*.30,
            -float(np.clip(dx*scale,.05,.22)),
            float(np.clip(-dy*scale,.12,.30))))
        pole=Vector((sign*.3,-.2,-.3))
        solve_limb(side+"Arm",side+"ForeArm",side+"Hand",target,pole)
    # Geometric collision check on the actual deformed shoe mesh (not ankle Y).
    bpy.context.view_layer.update()
    evaluated=shoe.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh=evaluated.to_mesh()
    floor_min={side:min((evaluated.matrix_world@mesh.vertices[j].co).z for j in sole_indices[side])
               for side in ["Left","Right"]}
    evaluated.to_mesh_clear()
    # Tiny sole-shape offsets: lift both ankle targets rather than the whole body.
    floor_lift={side:max(0,.001-floor_min[side]) for side in ["Left","Right"]}
    for side in ["Left","Right"]:
        if floor_lift[side]:
            targets[side].z+=floor_lift[side]
            solve_limb(side+"UpLeg",side+"Leg",side+"Foot",targets[side],Vector((0,-1,.05)))
            world_rotation(side+"Foot",foot_rotation[side])
    for bone in bones:
        if bone.name in previous_q and bone.rotation_quaternion.dot(previous_q[bone.name])<0:
            bone.rotation_quaternion.negate()
        previous_q[bone.name]=bone.rotation_quaternion.copy()
        bone.keyframe_insert("rotation_quaternion",frame=frame,group=bone.name)
    root.keyframe_insert("location",frame=frame,group=root.name)
    metrics.append({"time":float(t),"root":[float(v) for v in root.head],
                    "ikMaximumErrorMetres":max(errors),"floorLiftMetres":floor_lift,
                    "rightContact":any(a-1e-6<=t<=b+1e-6 for a,b in contacts)})

action=rig.animation_data.action
action.name="DeliHoron_ContactCleanup_4p63s_REVIEW"
# Match the actual local quaternion/translation tangents across the wrap. This
# touches only +/-1 baked frame around the already matched support pose.
seam={}
for frame in [0,1,N-1]:
    scene.frame_set(frame)
    seam[frame]={b.name:b.rotation_quaternion.copy() for b in bones}
    seam[frame]["rootLocation"]=bones[P+"Hips"].location.copy()
for frame,sign in [(1,1),(N-1,-1)]:
    scene.frame_set(frame)
    for bone in bones:
        first=seam[0][bone.name]
        incoming=first.rotation_difference(seam[N-1][bone.name]).to_exponential_map()
        outgoing=first.rotation_difference(seam[1][bone.name]).to_exponential_map()
        delta=(outgoing-incoming)*.5*sign
        rotation=Quaternion(delta.normalized(),delta.length) if delta.length>1e-10 else Quaternion()
        bone.rotation_quaternion=first@rotation
        bone.keyframe_insert("rotation_quaternion",frame=frame,group=bone.name)
    delta=(seam[1]["rootLocation"]-seam[N-1]["rootLocation"])*.5
    bones[P+"Hips"].location=seam[0]["rootLocation"]+delta*sign
    bones[P+"Hips"].keyframe_insert("location",frame=frame,group=P+"Hips")
for layer in action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for key in curve.keyframe_points:
                    key.interpolation="LINEAR"
rig["dancePerformance"]="Reference-driven contact cleanup; estimated depth, artistic acceptance open"
rig["motionRights"]="unverified-user-waived-paperwork-review-only"
rig["artApproval"]="pending-user-review"
rig["footContactGroundTruth"]=False
scene.frame_set(0)
camera=scene.camera
camera.location=(0,-4,1.8)
camera.rotation_euler=(Vector((0,0,.9))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale=2.35
# Keep the existing character studio; subtle floor grid makes contacts inspectable.
floor_obj=bpy.data.objects.get("StudioFloor - not exported")
if floor_obj:
    if floor_obj.name not in scene.collection.objects:
        scene.collection.objects.link(floor_obj)
    for collection in list(floor_obj.users_collection):
        if collection!=scene.collection:
            collection.objects.unlink(floor_obj)
    floor_obj.hide_render=False
    mat=floor_obj.data.materials[0]
    mat.use_nodes=True
    nodes=mat.node_tree.nodes
    shader=next(n for n in nodes if n.type=="BSDF_PRINCIPLED")
    checker=nodes.new("ShaderNodeTexChecker")
    checker.inputs["Color1"].default_value=(.055,.065,.08,1)
    checker.inputs["Color2"].default_value=(.075,.085,.10,1)
    checker.inputs["Scale"].default_value=4
    coord=nodes.new("ShaderNodeTexCoord")
    mat.node_tree.links.new(coord.outputs["Object"],checker.inputs["Vector"])
    mat.node_tree.links.new(checker.outputs["Color"],shader.inputs["Base Color"])
for obj in list(bpy.data.objects):
    if obj.type in ["LIGHT","CAMERA"]:
        if obj.name not in scene.collection.objects:
            scene.collection.objects.link(obj)
        for collection in list(obj.users_collection):
            if collection!=scene.collection:
                collection.objects.unlink(obj)
        obj.hide_render=False
rig.select_set(True)
bpy.ops.object.select_all(action="DESELECT")
for obj in runtime.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(out/"wedding-guest-01-cleaned.glb"),export_format="GLB",
    use_selection=True,export_yup=True,export_animations=True,export_animation_mode="ACTIVE_ACTIONS",
    export_frame_range=True,export_force_sampling=True,export_skins=True,export_morph=False,export_extras=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/"wedding-guest-01-cleaned.blend"),compress=True)
report={"durationSeconds":DURATION,"frames":N+1,"sourceIntervalOriginal":[11,15.633333333],
        "sourceIntervalVideo":[data["sourceStartSeconds"],data["sourceStartSeconds"]+DURATION],
        "sourceBlendSha256":hashlib.sha256(source.read_bytes()).hexdigest(),
        "keypointsSha256":hashlib.sha256(args.keypoints.read_bytes()).hexdigest(),
        "method":"2D reference + authored depth/weight correction + two-bone IK, not verified mocap",
        "rightForefootContacts":contacts,"contactTimingUncertaintySeconds":2/30,
        "leftSupportVerified":False,"depthMeasured":False,"artApproved":False,
        "inPlaceTravelRemovedPixels":float(travel),"rejectedOrInterpolatedKeypoints":rejected,
        "shoeWeightRepair":"sole vertices below 70 mm rigid to corresponding foot; ankle/geometry unchanged",
        "maximumAuthoredDepthCorrectionMetres":float(max(left_depth_corrections)),
        "pelvisReachAnticipationSeconds":.10,
        "soleVertexIndices":sole_indices,"toePivotsLocal":{s:list(v) for s,v in pivots.items()},
        "toePivotsWorldBind":{s:list(rest[P+s+"Foot"]@v) for s,v in pivots.items()},
        "metrics":metrics}
(out/"cleanup-build.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
print("CLEANUP_BUILD",DURATION,"seconds",N+1,"frames; max IK error",max(m["ikMaximumErrorMetres"] for m in metrics))
