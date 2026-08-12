#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
from pathlib import Path
from typing import Any


def add(checks: list[dict[str, Any]], name: str, ok: bool, detail: str) -> None:
    checks.append({"name": name, "ok": bool(ok), "detail": detail})


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def chinese_character_count(value: str) -> int:
    return len(re.findall(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]", value))


def file_sha256(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def resolve_manifest_path(manifest_path: Path, value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else (manifest_path.parent / path).resolve()


def golden_checks(checks: list[dict[str, Any]]) -> None:
    skill_dir = Path(__file__).resolve().parent.parent
    manifest_path = skill_dir / "assets" / "golden-master-v2" / "manifest.json"
    add(checks, "golden_manifest_present", manifest_path.is_file(), str(manifest_path))
    if not manifest_path.is_file():
        return
    manifest = json.loads(read_text(manifest_path))
    final_path = resolve_manifest_path(manifest_path, manifest["final_mp4"]["path"])
    add(checks, "golden_final_present", final_path.is_file(), str(final_path))
    if final_path.is_file():
        actual = file_sha256(final_path)
        add(checks, "golden_final_sha256", actual == manifest["final_mp4"]["sha256"], actual)
    bundle_dir = manifest_path.parent
    for relative, expected in manifest["bundled_sources"].items():
        path = bundle_dir / relative
        ok = path.is_file() and file_sha256(path) == expected
        add(checks, f"golden_bundle_{relative}", ok, str(path))


def opening_checks(
    run_dir: Path, intro_path: Path, checks: list[dict[str, Any]]
) -> tuple[str, str]:
    hook_path = run_dir / "opening-hook-approved.txt"
    keyword_path = run_dir / "opening-keyword-approved.txt"
    intro_script_path = run_dir / "intro-script-approved.txt"
    state_path = run_dir / "state.json"
    add(checks, "opening_hook_locked", hook_path.is_file(), str(hook_path))
    add(checks, "opening_keyword_locked", keyword_path.is_file(), str(keyword_path))
    add(checks, "intro_script_locked", intro_script_path.is_file(), str(intro_script_path))
    add(checks, "opening_state_present", state_path.is_file(), str(state_path))
    if not hook_path.is_file() or not keyword_path.is_file() or not intro_script_path.is_file() or not state_path.is_file():
        return "", ""

    hook = read_text(hook_path).strip()
    keyword = read_text(keyword_path).strip()
    intro_script = read_text(intro_script_path).strip()
    hook_count = chinese_character_count(hook)
    keyword_count = chinese_character_count(keyword)
    add(checks, "opening_hook_20_han_max", 1 <= hook_count <= 20, f"found {hook_count}: {hook}")
    add(
        checks,
        "opening_keyword_exactly_two_han",
        keyword_count == 2 and len(keyword) == 2,
        f"found {keyword_count}: {keyword}",
    )

    state = json.loads(read_text(state_path))
    confirmations = state.get("confirmations", {})
    add(
        checks,
        "opening_hook_state_approved",
        confirmations.get("opening_hook", {}).get("status") == "approved",
        str(confirmations.get("opening_hook")),
    )
    add(
        checks,
        "opening_keyword_state_approved",
        confirmations.get("opening_keyword", {}).get("status") == "approved",
        str(confirmations.get("opening_keyword")),
    )

    config_path = intro_path.parent.parent / "intro-config.json"
    add(checks, "intro_config_present", config_path.is_file(), str(config_path))
    if config_path.is_file():
        config = json.loads(read_text(config_path))
        add(checks, "intro_config_hook_locked", config.get("opening_hook") == hook, str(config.get("opening_hook")))
        add(checks, "intro_config_keyword_locked", config.get("keyword") == keyword, str(config.get("keyword")))
        add(checks, "intro_config_script_locked", config.get("intro_narration_text") == intro_script, str(config.get("intro_narration_text")))
        add(
            checks,
            "intro_narration_starts_with_hook",
            str(config.get("intro_narration_text", "")).startswith(hook),
            str(config.get("intro_narration_text")),
        )
    return hook, keyword


def body_checks(path: Path, checks: list[dict[str, Any]]) -> None:
    text = read_text(path)
    compact = re.sub(r"\s+", "", text).lower()
    add(checks, "body_golden_builder", 'data-template-version="golden-final-v9-body"' in text, "golden V9 body marker")
    add(checks, "body_exactly_four_scenes", len(set(re.findall(r'id="scene-0([1-4])"', text))) == 4, "four locked body scenes")
    add(checks, "body_focus_transition_locked", "/0.68" in compact and "scene.start+0.76" in compact, "0.68 second focus transition")
    add(checks, "body_caption_motion_locked", "/0.22" in compact and "/0.13" in compact, "caption in/out timings")
    add(checks, "body_end_fade_locked", "duration-0.414" in compact and "/0.414" in compact, "0.414 second end fade")
    add(checks, "body_title_present", "identity-title" in text, str(path))
    add(checks, "title_single_line", "white-space:nowrap" in compact, "white-space: nowrap required")
    add(checks, "title_auto_fit", "fitTextFontSize" in text, "HyperFrames fitTextFontSize required")
    add(checks, "title_plain_white", "color:#fff" in compact or "color:#ffffff" in compact, "white title fill")
    add(checks, "title_black_stroke", "-webkit-text-stroke:6px#000" in compact or "-webkit-text-stroke:6px#000000" in compact, "6px black title stroke")
    add(checks, "identity_decoration_removed", "#book-identity::before{display:none" in compact, "identity pseudo background disabled")
    add(checks, "title_shadow_removed", ".identity-title" in text and "text-shadow:none" in compact, "title shadow disabled")
    add(checks, "caption_panel_background_removed", ".caption-panel" in text and "background:none" in compact, "caption panel background disabled")
    add(checks, "caption_panel_border_removed", "border:0" in compact, "caption panel border disabled")
    add(checks, "caption_panel_shadow_removed", "box-shadow:none" in compact and "backdrop-filter:none" in compact, "caption panel effects disabled")
    add(checks, "caption_black_stroke", "-webkit-text-stroke:4px#000" in compact or "-webkit-text-stroke:4px#000000" in compact, "4px black caption stroke")


def intro_checks(path: Path, hook: str, keyword: str, checks: list[dict[str, Any]]) -> None:
    text = read_text(path)
    add(checks, "intro_approved_v7_builder", 'data-template-version="approved-v7"' in text, "approved V7 template marker")
    add(checks, "intro_keyword_cutout", "glyph-reveal" in text and "reveal-up" in text and "reveal-down" in text, "glyph and center reveal masks")
    add(checks, "intro_no_fiber_edge", "reveal-edge" not in text, "colored/fiber reveal edge forbidden")
    ring_count = len(set(re.findall(r"ripple-ring-([1-6])", text)))
    add(checks, "intro_six_ripple_rings", ring_count == 6, f"found {ring_count} ring layers")
    cover_indices = set(re.findall(r'data-cover-index=["\'](\d+)["\']', text))
    add(checks, "intro_recent_eight_covers", len(cover_indices) == 8, f"found {len(cover_indices)} cover slots")
    add(checks, "intro_duration_4_8", 'data-duration="4.800000"' in text or 'data-duration="4.8"' in text, "4.800 second intro")
    add(checks, "intro_uses_approved_hook", f'data-opening-hook="{html.escape(hook, quote=True)}"' in text, hook)
    glyph_match = re.search(r'id="glyph-reveal"[^>]*>([^<]+)</text>', text)
    glyph_text = html.unescape(glyph_match.group(1)).strip() if glyph_match else ""
    add(checks, "intro_uses_approved_keyword", glyph_text == keyword, glyph_text)
    add(checks, "intro_exact_cover_start", '}, 3.45);' in text, "cover sequence starts at 3.45s")
    add(checks, "intro_exact_ripple_start", '}, 4.36);' in text, "six-ring ripple starts at 4.36s")


def select_qa(payload: dict[str, Any]) -> dict[str, Any]:
    if "media" in payload:
        return payload
    for key in ("single_line_title_revision_v9", "plain_caption_body_revision_v8", "sequence_remap_ripple_revision_v7"):
        value = payload.get(key)
        if isinstance(value, dict):
            return value
    return payload


def qa_checks(path: Path, checks: list[dict[str, Any]]) -> None:
    payload = json.loads(read_text(path))
    qa = select_qa(payload)
    media = qa.get("media", qa)
    video = media.get("video", qa.get("video", {}))
    audio = media.get("audio", qa.get("audio", {}))
    voice = qa.get("audio_voice_presence", {}).get("final_mp4_audio", {}).get("si_sdr_db", qa.get("voice_si_sdr_db"))
    coverage = qa.get("transcription", {}).get("coverage", qa.get("asr_coverage"))
    decode_ok = qa.get("decode", {}).get("ok", qa.get("decode_ok"))
    black_count = qa.get("blackdetect", {}).get("black_start_count", qa.get("black_start_count"))
    body_start = media.get("body_start_seconds", qa.get("body_start_seconds"))
    segments = qa.get("segments", payload.get("segments", []))
    transition = next((item for item in segments if item.get("id") == "soft_transition"), {})

    add(checks, "qa_ok", bool(qa.get("ok", payload.get("ok", True))), "overall QA status")
    add(checks, "video_codec", video.get("codec_name") == "h264" and video.get("profile") == "High", str(video))
    add(checks, "video_format", video.get("pix_fmt") == "yuv420p" and video.get("width") == 1080 and video.get("height") == 1920 and video.get("r_frame_rate") == "30/1", str(video))
    add(checks, "audio_format", audio.get("codec_name") == "aac" and audio.get("profile") == "LC" and str(audio.get("sample_rate")) == "48000", str(audio))
    add(checks, "decode_ok", decode_ok is True, str(decode_ok))
    add(checks, "black_frames", black_count == 0, str(black_count))
    add(checks, "voice_si_sdr", isinstance(voice, (int, float)) and voice > 10.0, str(voice))
    add(checks, "asr_coverage", isinstance(coverage, (int, float)) and coverage >= 0.80, str(coverage))
    add(checks, "body_start_4_833", isinstance(body_start, (int, float)) and abs(body_start - 4.833) <= 0.001, str(body_start))
    add(checks, "transition_one_frame", isinstance(transition.get("duration_seconds"), (int, float)) and abs(transition["duration_seconds"] - 0.033) <= 0.001, str(transition))


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the book-video-daily-v9 visual and QA contract.")
    parser.add_argument("--run-dir", type=Path, required=True)
    parser.add_argument("--body-html", type=Path, required=True)
    parser.add_argument("--intro-html", type=Path, required=True)
    parser.add_argument("--qa", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    checks: list[dict[str, Any]] = []
    golden_checks(checks)
    hook, keyword = opening_checks(args.run_dir, args.intro_html, checks)
    body_checks(args.body_html, checks)
    intro_checks(args.intro_html, hook, keyword, checks)
    qa_checks(args.qa, checks)

    result = {
        "ok": all(item["ok"] for item in checks),
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
