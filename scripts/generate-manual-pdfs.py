"""Offline artifact generator; no Python dependency in deployed request paths.

Usage: npx tsx scripts/manual-payload.ts | python3 scripts/generate-manual-pdfs.py
Requires reportlab==4.4.9 and fonttools==4.60.1 (or the bundled authoring runtime).
Font source is pinned to Google Fonts and reused from a task-local cache.
"""
import hashlib
import io
import json
import pathlib
import sys
import urllib.request
from xml.sax.saxutils import escape

from fontTools.ttLib import TTFont as FontToolsFont
from fontTools.varLib.instancer import instantiateVariableFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "output" / "pdf"
CACHE = ROOT / "tmp" / "pdfs"
FONT_REF = "3be1884c48c3e45b52ecc725676a08f87776373e"
FONT_SHA256 = "864727d210d54f2537bbe23b3a839436c3992af72de9322af5270897246bd44f"
FONT_URL = f"https://raw.githubusercontent.com/google/fonts/{FONT_REF}/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf"
LICENSE_URL = f"https://raw.githubusercontent.com/google/fonts/{FONT_REF}/ofl/notosanstc/OFL.txt"

payload_bytes = sys.stdin.buffer.read()
payload = json.loads(payload_bytes)
OUT.mkdir(parents=True, exist_ok=True)
CACHE.mkdir(parents=True, exist_ok=True)
font_path = CACHE / f"NotoSansTC-{FONT_REF}.ttf"
if not font_path.exists():
    with urllib.request.urlopen(FONT_URL, timeout=30) as response:
        font_path.write_bytes(response.read())
with urllib.request.urlopen(LICENSE_URL, timeout=30) as response:
    license_text = response.read().decode("utf-8")
    (OUT / "FONT-OFL.txt").write_text("\n".join(line.rstrip() for line in license_text.splitlines()) + "\n", encoding="utf-8")
font_bytes = font_path.read_bytes()
if hashlib.sha256(font_bytes).hexdigest() != FONT_SHA256:
    raise ValueError("Pinned manual font integrity mismatch.")
font = FontToolsFont(io.BytesIO(font_bytes))
font.recalcTimestamp = False
static_font = instantiateVariableFont(font, {"wght": 400}, inplace=False)
static_font.recalcTimestamp = False
static_path = CACHE / "NotoSansTC-Regular.ttf"
static_font.save(static_path)
pdfmetrics.registerFont(TTFont("SWPManual", str(static_path)))

def clean(value):
    return value.replace("\u2014", " - ").replace("\u2013", "-").replace("\u2011", "-")

body = ParagraphStyle("Body", fontName="SWPManual", fontSize=10, leading=17, textColor=colors.HexColor("#33413a"), spaceAfter=10, wordWrap="CJK", alignment=TA_LEFT)
heading = ParagraphStyle("Heading", parent=body, fontSize=17, leading=24, textColor=colors.HexColor("#14251d"), spaceBefore=16, spaceAfter=10)
title = ParagraphStyle("Title", parent=heading, fontSize=24, leading=32)
small = ParagraphStyle("Small", parent=body, fontSize=8, leading=13)

class StableCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        kwargs["invariant"] = 1
        super().__init__(*args, **kwargs)

manifest = {"version": payload["version"], "softwareVersion": payload["softwareVersion"], "sourceSha256": hashlib.sha256(payload_bytes).hexdigest(), "fontSource": FONT_URL, "fontSha256": hashlib.sha256(font_bytes).hexdigest(), "artifacts": {}}
for locale in ["en", "zh-TW"]:
    name = f"swp-operation-manual-{locale}.pdf"
    path = OUT / name
    title_text = "Operation manual" if locale == "en" else "操作手冊"
    version_label = "Version" if locale == "en" else "版本"
    release_label = "Software package release" if locale == "en" else "軟體套件版本"
    body.wordWrap = "CJK" if locale == "zh-TW" else None
    heading.wordWrap = body.wordWrap
    small.wordWrap = body.wordWrap
    notice = "Guidance for shipped workflows. This document grants no permission or equipment control authority. Check the current warehouse and deployment; all destination routes independently authorize. Links are deployment-relative paths, not external customer URLs." if locale == "en" else "已交付流程的操作指引。本文件不授予權限或設備控制權。請確認目前倉庫與部署；所有目的路由獨立授權。連結以部署內相對路徑表示，不是外部客戶網址。"
    story = [Paragraph("Smart Warehouse Platform", title), Paragraph(title_text, heading), Paragraph(f"{version_label}: {escape(payload['version'])} | {release_label}: {escape(payload['softwareVersion'])} | {locale}", small), Paragraph(notice, body), Spacer(1, 12)]
    for article in payload["articles"]:
        section = [Paragraph(escape(clean(article["title"][locale])), heading)]
        for paragraph in article["paragraphs"]:
            section.append(Paragraph(escape(clean(paragraph[locale])), body))
        for link in article["links"]:
            # No external origin or credential is embedded; permission caveat is explicit.
            section.append(Paragraph(escape(f"{clean(link['label'][locale])}: {link['href']} ({link['permission']})"), small))
        story.append(KeepTogether(section))
    def footer(c, doc):
        c.saveState()
        c.setFont("SWPManual", 8)
        c.setFillColor(colors.HexColor("#53665b"))
        c.drawString(44, 28, f"SWP | {payload['version']} | {locale}")
        c.drawRightString(A4[0] - 44, 28, str(doc.page))
        c.restoreState()
    doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=44, rightMargin=44, topMargin=42, bottomMargin=70, title=f"Smart Warehouse Platform - {title_text}", author="Smart Warehouse Platform")
    doc.build(story, onFirstPage=footer, onLaterPages=footer, canvasmaker=StableCanvas)
    manifest["artifacts"][locale] = {"file": name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print("Generated both versioned operational manuals.")
