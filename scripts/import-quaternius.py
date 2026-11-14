"""Offline, standard-library-only conversion of the official CC0 Standard archive.
Usage: python scripts/import-quaternius.py path/to/Universal-Base-Characters.zip
No network, Blender execution or downloaded code is involved.
"""
import hashlib
import json
from pathlib import Path
import struct
import sys
import subprocess
import zipfile

EXPECTED = "fdbf1804c90dfc1ea03e992bff7da2dfd1a79318e13270a660180f9308455f40"
archive = Path(sys.argv[1]).read_bytes()
if hashlib.sha256(archive).hexdigest() != EXPECTED:
    raise ValueError("Unreviewed archive: verify its source/license before updating EXPECTED")
z = zipfile.ZipFile(sys.argv[1])
prefix = "Universal Base Characters[Standard]/"
license_bytes = z.read(prefix + "License_Standard.txt")
if b"CC0 1.0 Universal" not in license_bytes:
    raise ValueError("CC0 statement missing")
root = Path(__file__).resolve().parent.parent
out = root / "apps/broadcaster/public/characters/humanoid"
out.mkdir(parents=True, exist_ok=True)
license_path = root / "assets/licenses/quaternius-base-characters-CC0.txt"
license_path.write_bytes(license_bytes)
inventory = []

def optimized_texture(data):
    # Offline Windows build tool only; checked-in GLBs need no Python/PowerShell at runtime.
    cache = root / ".git/asset-texture-cache"
    cache.mkdir(parents=True, exist_ok=True)
    key = hashlib.sha256(data).hexdigest()
    source, target = cache / (key + "-source.png"), cache / (key + "-1024.png")
    if not target.exists():
        source.write_bytes(data)
        subprocess.run(["powershell", "-NoProfile", "-File", str(root / "scripts/resize-asset-texture.ps1"), "-InputPath", str(source), "-OutputPath", str(target), "-MaxSize", "1024"], check=True, capture_output=True)
    return target.read_bytes()

def convert(directory, filename, target):
    source = prefix + directory + "/" + filename + ".gltf"
    doc = json.loads(z.read(source))
    blob = bytearray()
    offsets = []
    def append(data):
        while len(blob) % 4:
            blob.append(0)
        offset = len(blob)
        blob.extend(data)
        return offset
    for buf in doc["buffers"]:
        offsets.append(append(z.read(str(Path(source).parent.as_posix()) + "/" + buf["uri"])))
    for view in doc["bufferViews"]:
        view["byteOffset"] = view.get("byteOffset", 0) + offsets[view["buffer"]]
        view["buffer"] = 0
    fixes = []
    for img in doc.get("images", []):
        uri = img.pop("uri")
        location = str(Path(source).parent.as_posix()) + "/" + uri
        if location not in z.namelist():
            fixed = uri.replace("_png.png", ".png")
            location = str(Path(source).parent.as_posix()) + "/" + fixed
            fixes.append({"missing": uri, "resolved": fixed})
        data = optimized_texture(z.read(location))
        img["bufferView"] = len(doc["bufferViews"])
        img["mimeType"] = "image/png"
        doc["bufferViews"].append({"buffer": 0, "byteOffset": append(data), "byteLength": len(data)})
    doc["buffers"] = [{"byteLength": len(blob)}]
    data = json.dumps(doc, separators=(",", ":")).encode()
    data += b" " * (-len(data) % 4)
    blob += b"\0" * (-len(blob) % 4)
    glb = struct.pack("<III", 0x46546c67, 2, 28 + len(data) + len(blob))
    glb += struct.pack("<II", len(data), 0x4e4f534a) + data
    glb += struct.pack("<II", len(blob), 0x004e4942) + blob
    (out / target).write_bytes(glb)
    inventory.append({"path": target, "sourceEntry": source, "sha256": hashlib.sha256(glb).hexdigest(), "bytes": len(glb), "textureMaxSize": 1024, "uriRepairs": fixes})

convert("Base Characters/Godot - UE", "Superhero_Male_FullBody", "male.glb")
convert("Base Characters/Godot - UE", "Superhero_Female_FullBody", "female.glb")
convert("Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)", "Hair_SimpleParted", "hair-parted.glb")
convert("Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)", "Hair_Long", "hair-long.glb")
manifest = {"author": "Quaternius", "pack": "Universal Base Characters — Standard", "source": "https://quaternius.itch.io/universal-base-characters", "license": "CC0-1.0", "licenseEvidence": "assets/licenses/quaternius-base-characters-CC0.txt", "retrieved": "2026-11-14", "archiveSha256": EXPECTED, "commercialUse": True, "redistribution": True, "changes": "Embedded original buffers/images as GLB; repaired absent duplicate normal-map filenames. Textures resized to maximum 1024 pixels; topology and skin unchanged.", "productionApproved": False, "regionalCostumes": False, "assets": inventory}
(out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(json.dumps(inventory, indent=2))

if len(sys.argv) > 2:
    expected_outfits = "c3468b18871cc8c8f05ab14df7712baf22cb9f389cbd870babf130e595187f70"
    if hashlib.sha256(Path(sys.argv[2]).read_bytes()).hexdigest() != expected_outfits:
        raise ValueError("Unreviewed outfits archive")
    z = zipfile.ZipFile(sys.argv[2])
    prefix = "Modular Character Outfits - Fantasy[Standard]/"
    evidence = z.read(prefix + "License_Standard.txt")
    if b"CC0 1.0 Universal" not in evidence:
        raise ValueError("Outfits CC0 statement missing")
    (root / "assets/licenses/quaternius-outfits-CC0.txt").write_bytes(evidence)
    inventory = []
    convert("Exports/glTF (Godot-Unreal)/Outfits", "Male_Peasant", "outfit-male.glb")
    convert("Exports/glTF (Godot-Unreal)/Outfits", "Female_Peasant", "outfit-female.glb")
    manifest = {"author": "Quaternius", "pack": "Modular Character Outfits - Fantasy — Standard", "source": "https://quaternius.itch.io/modular-character-outfits-fantasy", "license": "CC0-1.0", "licenseEvidence": "assets/licenses/quaternius-outfits-CC0.txt", "retrieved": "2026-11-14", "archiveSha256": expected_outfits, "commercialUse": True, "redistribution": True, "regionalCostumes": False, "productionApproved": False, "changes": "Embedded buffers/images as GLB; textures resized to maximum 1024 pixels. Generic peasant outfits, NOT certified Anatolian costume.", "assets": inventory}
    (out / "outfits-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(inventory, indent=2))
