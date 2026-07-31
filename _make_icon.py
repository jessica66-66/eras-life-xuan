#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import zlib, struct, math, os

OUT = os.path.dirname(os.path.abspath(__file__))

# Lover palette (RGB)
C_PINK   = (255, 183, 213)   # #FFB7D5
C_LILAC  = (195, 166, 245)   # #C3A6F5
C_SKY    = (166, 216, 255)   # #A6D8FF
C_WHITE  = (255, 255, 255)
C_GOLD   = (255, 224, 163)   # #FFE0A3

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def bg_gradient(x, y, s):
    # diagonal blend pink -> lilac -> sky
    t = (x + y) / (2 * s)
    if t < 0.5:
        return lerp(C_PINK, C_LILAC, t / 0.5)
    else:
        return lerp(C_LILAC, C_SKY, (t - 0.5) / 0.5)

def rounded_mask(x, y, s, r):
    # returns alpha 255 inside rounded rect, 0 outside
    if x >= r and x <= s - r: return 255 if y >= 0 and y <= s else 0
    if y >= r and y <= s - r: return 255 if x >= 0 and x <= s else 0
    cx = r if x < r else s - r
    cy = r if y < r else s - r
    d = math.hypot(x - cx, y - cy)
    return 255 if d <= r else 0

def heart_fill(px, py, s):
    # map to heart space: center, scale
    nx = (px / s - 0.5) * 2.4
    ny = (0.5 - py / s) * 2.4   # y up
    # implicit heart: (x^2 + y^2 - 1)^3 - x^2*y^3 <= 0
    v = (nx*nx + ny*ny - 1.0)**3 - nx*nx * (ny**3)
    return v <= 0

def sparkle(px, py, s, cx, cy, rad, rot=0.0):
    # 4-point star distance test in local coords
    dx = (px - cx) / rad
    dy = (py - cy) / rad
    # rotate
    rdx = dx * math.cos(rot) - dy * math.sin(rot)
    rdy = dx * math.sin(rot) + dy * math.cos(rot)
    ax = abs(rdx); ay = abs(rdy)
    # thin 4-point star: max(ax,ay) within thin width OR near diagonal
    d = max(ax, ay)
    thin = 0.16
    if d <= 1.0 and min(ax, ay) <= thin * (1.0 - d*0.5):
        return True
    return False

def build(size):
    s = size
    r = int(size * 0.22)
    buf = bytearray()
    for y in range(s):
        buf.append(0)  # filter byte
        for x in range(s):
            a = rounded_mask(x, y, s, r)
            if a == 0:
                buf += bytes((0,0,0,0))
                continue
            col = bg_gradient(x, y, s)
            # vignette-ish top highlight
            if y < s*0.32:
                col = lerp(col, C_WHITE, (1 - y/(s*0.32)) * 0.12)
            R, G, B = col
            # heart
            if heart_fill(x, y, s):
                R, G, B = lerp(col, C_WHITE, 0.92)
            # sparkles
            sp = [
                (s*0.80, s*0.22, s*0.07, 0.5),
                (s*0.22, s*0.74, s*0.05, -0.4),
                (s*0.86, s*0.78, s*0.045, 0.9),
            ]
            for (scx, scy, srad, rot) in sp:
                if sparkle(x, y, s, scx, scy, srad, rot):
                    R, G, B = lerp((R,G,B), C_GOLD, 0.95)
            buf += bytes((R, G, B, 255))
    return bytes(buf)

def chunk(tag, data):
    c = tag + data
    return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)

def write_png(path, size, raw):
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(raw, 9)
    with open(path, "wb") as f:
        f.write(sig)
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", idat))
        f.write(chunk(b"IEND", b""))

for nm, sz in [("icon-512.png", 512), ("icon-192.png", 192), ("icon-apple.png", 180)]:
    raw = build(sz)
    write_png(os.path.join(OUT, nm), sz, raw)
    print("wrote", nm, sz, "bytes_raw=", len(raw))

# also a favicon SVG (referenced by index)
svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB7D5"/><stop offset=".5" stop-color="#C3A6F5"/><stop offset="1" stop-color="#A6D8FF"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><path d="M32 50S12 39 9 27C7 19 13 13 20 13c5 0 9 3 12 8 3-5 7-8 12-8 7 0 13 6 11 14-3 12-23 23-23 23z" fill="#fff"/><path d="M48 18l1.4 4.2L53.6 23l-4.2 1.4L48 28.6l-1.4-4.2L42.4 23l4.2-1.4z" fill="#FFE0A3"/></svg>'''
with open(os.path.join(OUT, "favicon.svg"), "w") as f:
    f.write(svg)
print("wrote favicon.svg")
