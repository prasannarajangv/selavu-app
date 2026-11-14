"""Render icons/icon.svg to the PNG sizes the app needs, using headless Chrome (or Edge).

Run:  python icons/render.py      then  python build.py
No Python packages needed. Output PNGs are fully opaque (iOS fills transparent corners with black).
"""
import os
import pathlib
import subprocess
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
# The wordmark font; needs internet while rendering.
FONTS = ("<link rel='stylesheet' href='https://fonts.googleapis.com/css2?family=Montserrat:wght@300&display=block'>")
SIZES = {"icon-512.png": 512, "icon-192.png": 192, "apple-touch-icon.png": 180, "icon-1024.png": 1024}
BROWSERS = [r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"]


def main():
    browser = next((b for b in BROWSERS if os.path.exists(b)), None)
    if not browser:
        raise SystemExit("Install Google Chrome or Microsoft Edge to render icons.")
    svg = (HERE / "icon.svg").read_text(encoding="utf-8")
    with tempfile.TemporaryDirectory() as tmp:
        for name, size in SIZES.items():
            page = pathlib.Path(tmp) / f"{size}.html"
            page.write_text(
                "<!doctype html><meta charset='utf-8'>" + FONTS + "<style>html,body{margin:0;overflow:hidden;background:#000}"
                f"svg{{display:block;width:{size}px;height:{size}px}}</style>" + svg, encoding="utf-8")
            out = HERE / name
            subprocess.run([browser, "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", "--force-device-scale-factor=1",
                            f"--user-data-dir={tmp}/profile", f"--window-size={size},{size}",
                            "--virtual-time-budget=8000",  # wait for the web font before the screenshot
                            "--disable-lcd-text",  # grayscale anti-aliasing, no colour fringes
                            f"--screenshot={out}", page.as_uri()], check=True, capture_output=True, timeout=120)
            print("rendered", name, out.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
