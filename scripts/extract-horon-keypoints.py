"""Offline, top-down HALPE-26 extraction for the selected PR #8 performer.

2D estimates only. Model/software stay outside runtime and Git. No downloader.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--video", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--site", type=Path, required=True)
    parser.add_argument("--rtmlib", type=Path, required=True)
    parser.add_argument("--original-poses", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    sys.path[:0] = [str(args.site.resolve()), str(args.rtmlib.resolve())]
    import cv2
    import numpy as np
    from rtmlib import RTMPose

    original = json.loads(args.original_poses.read_text())
    source_rows = [r for r in original["frames"] if r["valid"] and 10.5 <= r["time"] <= 16]
    # This interval was visually checked: left-of-frame, side-facing performer.
    times = np.array([r["time"] for r in source_rows])
    hips = np.array([[(r["image"][23][k] + r["image"][24][k])/2 for k in range(2)] for r in source_rows])
    hips = np.array([np.median(hips[max(0,i-2):i+3],axis=0) for i in range(len(hips))])
    pose = RTMPose(str(args.model), backend="onnxruntime", device="cpu", to_openpose=False)
    cap = cv2.VideoCapture(str(args.video))
    cap.set(cv2.CAP_PROP_POS_MSEC, 11000)
    args.out.mkdir(parents=True, exist_ok=True)
    frames = []
    while True:
        ok, image = cap.read()
        if not ok:
            break
        time = cap.get(cv2.CAP_PROP_POS_MSEC)/1000
        if time < 11-0.001:
            continue
        if time > 15.633334:
            break
        cx = float(np.interp(time,times,hips[:,0]))*image.shape[1]
        # Exclude foreground socks/shoes below this performer's visible floor.
        # Only the inference copy is masked; original evidence is never changed.
        inference = image.copy()
        inference[625:] = 96
        bbox = [max(0,cx-210),70,min(image.shape[1],cx+120),625]
        xy, scores = pose(inference,bboxes=[bbox])
        points, confidence = xy[0], scores[0]
        row = {"time":time-11,"originalTime":time,"sourceTime":original["sourceStart"]+time,
               "points":points.tolist(),"scores":confidence.tolist(),"bbox":bbox}
        frames.append(row)
        if len(frames)%15 == 1:
            for j in [5,6,7,8,9,10,11,12,13,14,15,16,20,21,22,23,24,25]:
                x,y=map(int,points[j]);color=(0,255,0) if confidence[j]>.5 else (0,0,255)
                cv2.circle(image,(x,y),4,color,-1)
                cv2.putText(image,str(j),(x+4,y),cv2.FONT_HERSHEY_SIMPLEX,.4,color,1)
            cv2.imwrite(str(args.out/f"verified-target-{len(frames):03}.jpg"),image)
    cap.release()
    result = {"method":"RTMPose HALPE-26, top-down 2D, not 3D mocap",
              "modelSha256":hashlib.sha256(args.model.read_bytes()).hexdigest(),
              "videoSha256":hashlib.sha256(args.video.read_bytes()).hexdigest(),
              "startOriginalSeconds":11,"endOriginalSeconds":15.633333333,
              "sourceStartSeconds":original["sourceStart"]+11,"fps":30,
              "performer":"left-of-frame side profile; same performer in inspected frames",
              "depthMeasured":False,"contactGroundTruth":False,"frames":frames}
    (args.out/"keypoints.json").write_text(json.dumps(result),encoding="utf-8")
    print("EXTRACTED",len(frames),"frames; min leg score median",
          float(np.median([min(r["scores"][11:17]) for r in frames])))


if __name__ == "__main__":
    main()
