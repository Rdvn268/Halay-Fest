"""Local single-camera pose estimates, NOT captured/validated dance motion.

Run with Python 3.11 + mediapipe 0.10.21 + opencv-contrib-python 4.11.0.86.
Inputs/outputs remain local; this script does not download or grant rights.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, help="Optional isolated Python dependencies")
    parser.add_argument("--video", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--source-start", type=float, required=True)
    parser.add_argument("--initial-hip-x", type=float, default=0.61)
    parser.add_argument("--crop-width", type=float, default=1.0,
                        help="Normalized width around tracked hip; 1 keeps full frame")
    parser.add_argument("--independent-frames", action="store_true",
                        help="Re-detect each frame instead of SDK temporal tracking")
    args = parser.parse_args()
    if args.site:
        sys.path.insert(0, str(args.site.resolve()))
    import cv2
    import mediapipe as mp
    import numpy as np

    args.out.mkdir(parents=True, exist_ok=True)
    capture = cv2.VideoCapture(str(args.video))
    fps = capture.get(cv2.CAP_PROP_FPS)
    if not 10 <= fps <= 120:
        raise ValueError("Remux to a timestamped CFR video first; invalid FPS")
    options = mp.tasks.vision.PoseLandmarkerOptions(
        # Buffer also avoids Windows non-ASCII path failures in the native SDK.
        base_options=mp.tasks.BaseOptions(model_asset_buffer=args.model.read_bytes()),
        running_mode=(mp.tasks.vision.RunningMode.IMAGE if args.independent_frames
                      else mp.tasks.vision.RunningMode.VIDEO),
        num_poses=1 if args.crop_width < 1 else 6,
    )
    rows = []
    previous = np.array([args.initial_hip_x, 0.5])
    index = 0
    connections = [(11, 12), (11, 13), (13, 15), (12, 14), (14, 16),
                   (11, 23), (12, 24), (23, 24), (23, 25), (25, 27),
                   (24, 26), (26, 28), (27, 31), (28, 32)]
    with mp.tasks.vision.PoseLandmarker.create_from_options(options) as model:
        while True:
            ok, image = capture.read()
            if not ok:
                break
            time = capture.get(cv2.CAP_PROP_POS_MSEC) / 1000
            current_index = index
            index += 1
            if current_index % 2:
                continue  # ~15 Hz, original presentation timestamps retained.
            h, w = image.shape[:2]
            left = max(0, min(1-args.crop_width, previous[0]-args.crop_width/2))
            x0, x1 = round(left*w), round((left+args.crop_width)*w)
            crop = image[:, x0:x1]
            input_image = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
            result = (model.detect(input_image) if args.independent_frames else
                      model.detect_for_video(input_image, round(time * 1000)))
            candidates = []
            for i, pose in enumerate(result.pose_landmarks):
                for point in pose:
                    point.x = (point.x*(x1-x0)+x0)/w
                hip = np.array([(pose[23].x + pose[24].x) / 2,
                                (pose[23].y + pose[24].y) / 2])
                distance = float(np.linalg.norm(hip - previous))
                candidates.append((distance, i, hip))
            best = min(candidates, key=lambda item: item[0]) if candidates else None
            row = {"time": time, "sourceTime": args.source_start + time, "valid": False}
            if best is not None and best[0] < 0.12:
                _, selected, previous = best
                pose = result.pose_landmarks[selected]
                world = result.pose_world_landmarks[selected]
                row.update({
                    "valid": True,
                    "image": [[p.x, p.y, p.z, p.visibility] for p in pose],
                    "world": [[p.x, p.y, p.z, p.visibility] for p in world],
                    "trackDistance": best[0],
                    "minimumLegVisibility": min(pose[j].visibility for j in [23, 24, 25, 26, 27, 28]),
                })
                if current_index % 60 == 0:
                    h, w = image.shape[:2]
                    for a, b in connections:
                        pa, pb = pose[a], pose[b]
                        color = (0, 220, 0) if min(pa.visibility, pb.visibility) >= 0.7 else (0, 0, 255)
                        cv2.line(image, (int(pa.x*w), int(pa.y*h)),
                                 (int(pb.x*w), int(pb.y*h)), color, 3)
                    cv2.imwrite(str(args.out / f"tracking-{current_index:04}.jpg"), image)
            rows.append(row)
    capture.release()
    if not rows:
        raise ValueError("No decoded frames")
    valid = [r for r in rows if r["valid"]]
    report = {
        "kind": "single-camera-estimate-not-mocap",
        "rights": "unverified-user-waived-paperwork-local-study-only",
        "sourceStart": args.source_start,
        "videoSha256": hashlib.sha256(args.video.read_bytes()).hexdigest(),
        "modelSha256": hashlib.sha256(args.model.read_bytes()).hexdigest(),
        "model": "MediaPipe Pose Landmarker Heavy / BlazePose GHUM",
        "mediapipe": mp.__version__, "cropWidth": args.crop_width,
        "independentFrames": args.independent_frames,
        "fps": fps, "decodedFrames": index,
        "samples": len(rows), "validSamples": len(valid),
        "legVisibilityBelow07": sum(r["minimumLegVisibility"] < 0.7 for r in valid),
        "limitations": ["Depth inferred, not measured", "Track identity needs visual review",
                        "Visibility is model confidence, not accuracy", "No measured ground contacts"],
        "frames": rows,
    }
    (args.out / "pose-estimates.json").write_text(json.dumps(report), encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k != "frames"}, indent=2))


if __name__ == "__main__":
    main()
