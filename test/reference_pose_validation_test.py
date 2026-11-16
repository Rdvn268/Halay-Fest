"""Synthetic inputs test rejection, not regional dance authenticity."""
import copy
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from reference_pose_validation import assess_pose_sequence, require_retarget_input


def fixture():
    return {"frames": [{"time": i/15, "valid": True,
                        "world": [[0., 0., 0., 1.] for _ in range(33)],
                        "image": [[0., 0., 0., 1.] for _ in range(33)],
                        "minimumLegVisibility": 1.} for i in range(300)]}


class ReferenceGateTests(unittest.TestCase):
    def test_complete_data_does_not_grant_art_or_contact_approval(self):
        result = require_retarget_input(fixture())
        self.assertTrue(result["eligibleForUninterruptedRetarget"])
        self.assertFalse(result["artApproved"])
        self.assertFalse(result["contactValidated"])

    def test_missing_motion_rejected_but_explicit_diagnostic_records_holds(self):
        report = fixture()
        for i in [40, 41, 42, 90]:
            report["frames"][i] = {"time": i/15, "valid": False}
        with self.assertRaisesRegex(ValueError, "Diagnostic export only"):
            require_retarget_input(report)
        result = require_retarget_input(report, True)
        self.assertEqual(result["missingSamples"], 4)
        self.assertEqual(result["longestMissingRunSamples"], 3)

    def test_low_confidence_and_short_duration_are_rejected(self):
        report = fixture()
        report["frames"][10]["minimumLegVisibility"] = .69
        with self.assertRaises(ValueError):
            require_retarget_input(report)
        report["frames"] = report["frames"][:100]
        self.assertFalse(assess_pose_sequence(report)["eligibleForUninterruptedRetarget"])

    def test_nan_duplicate_time_malformed_landmarks_and_missing_start_rejected(self):
        good = fixture()
        for mutation in ["nan", "time", "landmark", "start"]:
            report = copy.deepcopy(good)
            if mutation == "nan": report["frames"][20]["world"][0][0] = float("nan")
            if mutation == "time": report["frames"][20]["time"] = report["frames"][19]["time"]
            if mutation == "landmark": report["frames"][20]["image"].pop()
            if mutation == "start": report["frames"][0]["valid"] = False
            with self.subTest(mutation=mutation), self.assertRaises(ValueError):
                require_retarget_input(report, True)


if __name__ == "__main__":
    unittest.main()
