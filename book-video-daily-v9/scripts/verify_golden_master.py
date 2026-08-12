#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


SKILL_DIR = Path(__file__).resolve().parent.parent
DEFAULT_MANIFEST = SKILL_DIR / "assets" / "golden-master-v2" / "manifest.json"


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def add(checks: list[dict[str, Any]], name: str, ok: bool, detail: str) -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail})


def resolve_manifest_path(manifest_path: Path, value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else (manifest_path.parent / path).resolve()


def media_probe(path: Path) -> dict[str, Any]:
    completed = subprocess.run(
        ["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify the immutable V9 golden master and bundled references.")
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    checks: list[dict[str, Any]] = []

    source_entries = {"final_mp4": manifest["final_mp4"]}
    source_entries.update({f"segment_{key}": value for key, value in manifest["segments"].items()})
    for name, entry in source_entries.items():
        path = resolve_manifest_path(args.manifest, entry["path"])
        exists = path.is_file()
        add(checks, f"{name}_exists", exists, str(path))
        if exists:
            actual = digest(path)
            add(checks, f"{name}_sha256", actual == entry["sha256"], actual)

    bundle_dir = args.manifest.parent
    for relative, expected in manifest["bundled_sources"].items():
        path = bundle_dir / relative
        exists = path.is_file()
        add(checks, f"bundle_{relative}_exists", exists, str(path))
        if exists:
            actual = digest(path)
            add(checks, f"bundle_{relative}_sha256", actual == expected, actual)

    final_path = resolve_manifest_path(args.manifest, manifest["final_mp4"]["path"])
    if final_path.is_file():
        probe = media_probe(final_path)
        video = next((item for item in probe["streams"] if item.get("codec_type") == "video"), {})
        audio = next((item for item in probe["streams"] if item.get("codec_type") == "audio"), {})
        expected_video = manifest["final_mp4"]["video"]
        expected_audio = manifest["final_mp4"]["audio"]
        add(checks, "golden_video_codec", video.get("codec_name") == expected_video["codec"] and video.get("profile") == expected_video["profile"], str(video))
        add(checks, "golden_video_geometry", video.get("width") == expected_video["width"] and video.get("height") == expected_video["height"] and video.get("r_frame_rate") == f'{expected_video["fps"]}/1', str(video))
        add(checks, "golden_video_pixels", video.get("pix_fmt") == expected_video["pixel_format"] and video.get("color_space") == expected_video["color_space"], str(video))
        add(checks, "golden_audio", audio.get("codec_name") == expected_audio["codec"] and audio.get("profile") == expected_audio["profile"] and int(audio.get("sample_rate", 0)) == expected_audio["sample_rate"] and audio.get("channels") == expected_audio["channels"], str(audio))
        duration = float(probe["format"]["duration"])
        add(checks, "golden_duration", abs(duration - manifest["final_mp4"]["duration_seconds"]) <= 0.001, str(duration))

    result = {
        "ok": all(item["ok"] for item in checks),
        "golden_final_mp4": manifest["final_mp4"]["path"],
        "golden_sha256": manifest["final_mp4"]["sha256"],
        "checks": checks,
        "error_count": sum(not item["ok"] for item in checks),
    }
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    sys.stdout.write(rendered)
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
