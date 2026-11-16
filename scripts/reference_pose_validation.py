"""Conservative input gate for reference estimates; never grants art acceptance."""
import math


def assess_pose_sequence(report):
    rows = report["frames"]
    if len(rows) < 2:
        raise ValueError("Need at least two source samples")
    previous = -1
    missing = low = longest = current = 0
    for row in rows:
        time = row["time"]
        if not math.isfinite(time) or time <= previous:
            raise ValueError("Source times must be finite and strictly increasing")
        previous = time
        if not row["valid"]:
            missing += 1
            current += 1
            longest = max(longest, current)
            continue
        current = 0
        for field in ["image", "world"]:
            points = row[field]
            if len(points) != 33 or any(len(p) != 4 or not all(math.isfinite(v) for v in p) for p in points):
                raise ValueError("Need 33 finite x/y/z/visibility landmarks")
        confidence = row["minimumLegVisibility"]
        if not math.isfinite(confidence) or not 0 <= confidence <= 1:
            raise ValueError("Invalid leg visibility")
        low += confidence < 0.7
    duration = rows[-1]["time"] - rows[0]["time"]
    return {"samples": len(rows), "durationSeconds": duration,
            "missingSamples": missing, "longestMissingRunSamples": longest,
            "lowLegVisibilitySamples": low,
            "eligibleForUninterruptedRetarget": duration >= 15 and missing == 0 and low == 0,
            "artApproved": False, "contactValidated": False}


def require_retarget_input(report, diagnostic_only=False):
    result = assess_pose_sequence(report)
    if not result["eligibleForUninterruptedRetarget"] and not diagnostic_only:
        raise ValueError(f"Reference rejected for dance delivery: {result}. Diagnostic export only.")
    if not report["frames"][0]["valid"]:
        raise ValueError("Cannot start with an unobserved pose")
    return result
