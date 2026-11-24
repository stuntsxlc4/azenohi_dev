"""Rebuild AzenoHI's original orbital habitat GLB with Python 3 (standard library)."""

import json
import math
import random
import struct
import zlib
from array import array
from collections import defaultdict
from pathlib import Path

TAU = math.tau
rng = random.Random(835)
output = Path(__file__).resolve().parents[1] / "public/home/orbital-habitat.glb"


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def cross(a, b):
    x, y, z = a
    u, v, w = b
    return (y * w - z * v, z * u - x * w, x * v - y * u)


def unit(v):
    length = math.sqrt(sum(x * x for x in v))
    return tuple(x / length for x in v)


def polar(r, a, z):
    return (r * math.cos(a), r * math.sin(a), z)


class Batch:
    def __init__(self):
        self.positions = array("f")
        self.normals = array("f")
        self.colors = array("B")
        self.uvs = array("H")
        self.indices = array("I")

    def quad(self, points, color):
        normal = unit(cross(sub(points[1], points[0]), sub(points[3], points[0])))
        offset = len(self.positions) // 3
        self.indices.extend(offset + i for i in (0, 1, 2, 0, 2, 3))
        for point, uv in zip(points, [(0, 0), (255, 0), (255, 255), (0, 255)]):
            self.positions.extend(point)
            self.normals.extend(normal)
            self.colors.extend((*color, 255))
            self.uvs.extend(c * 257 for c in uv)


# A mesh primitive combines all faces with the same material in each moving part.
rotor = defaultdict(Batch)
spindle = defaultdict(Batch)
hull, machinery, glass, beacons, halos = range(5)
steel = (89, 103, 119)
graphite = (60, 74, 92)
silver = (123, 132, 138)
white = (255, 255, 255)


def lathe(part, mat, profile, color, segments=96, start=0, end=TAU, cap=False):
    batch = part[mat]
    for i in range(segments):
        a = start + (end - start) * i / segments
        b = start + (end - start) * (i + 1) / segments
        for (r, z), (s, w) in zip(profile, profile[1:] + profile[:1]):
            batch.quad(
                [polar(r, a, z), polar(r, b, z), polar(s, b, w), polar(s, a, w)], color
            )
    if cap:
        # End plates use triangle fans in the radial plane.
        for a, reverse in ((start, False), (end, True)):
            points = [polar(r, a, z) for r, z in profile]
            if reverse:
                points.reverse()
            for i in range(1, len(points) - 1):
                mid = tuple((x + y) / 2 for x, y in zip(points[i], points[i + 1]))
                batch.quad([points[0], points[i], mid, points[i + 1]], color)


def band(part, mat, inner, outer, bottom, top, color, **kwargs):
    bevel = min((outer - inner) * 0.16, (top - bottom) * 0.25, 0.009)
    profile = [
        (inner, bottom + bevel),
        (inner + bevel, bottom),
        (outer - bevel, bottom),
        (outer, bottom + bevel),
        (outer, top - bevel),
        (outer - bevel, top),
        (inner + bevel, top),
        (inner, top - bevel),
    ]
    lathe(part, mat, profile, color, **kwargs)


def tube(part, mat, a, b, radius, color, sides=5):
    axis = unit(sub(b, a))
    right = unit(cross(axis, (0, 1, 0) if abs(axis[2]) > 0.92 else (0, 0, 1)))
    up = cross(axis, right)

    def point(origin, i):
        t = TAU * i / sides
        return tuple(
            origin[k] + radius * (right[k] * math.cos(t) + up[k] * math.sin(t))
            for k in range(3)
        )

    for i in range(sides):
        part[mat].quad(
            [point(a, i), point(a, i + 1), point(b, i + 1), point(b, i)], color
        )


def strip(part, mat, r, a, b, z, height, color):
    part[mat].quad(
        [
            polar(r, a, z),
            polar(r, b, z),
            polar(r, b, z + height),
            polar(r, a, z + height),
        ],
        color,
    )


def marker(part, point, size, color):
    x, y, z = point
    for ax, ay in ((1, 0), (0, 1)):
        part[halos].quad(
            [
                (x - size * ax, y - size * ay, z - size),
                (x + size * ax, y + size * ay, z - size),
                (x + size * ax, y + size * ay, z + size),
                (x - size * ax, y - size * ay, z + size),
            ],
            color,
        )


# The outer drum has dark pressure joints between 48 individually clad habitats.
band(rotor, machinery, 0.836, 1.001, -0.062, 0.046, graphite, segments=144)
for i in range(48):
    a, b = TAU * (i + 0.03) / 48, TAU * (i + 0.97) / 48
    shade = rng.choice([(69, 82, 99), (90, 104, 121), (105, 116, 128), (73, 93, 108)])
    for lo, hi in [(-0.070, -0.013), (0.015, 0.058)]:
        band(
            rotor,
            hull,
            0.835,
            1.013,
            lo,
            hi,
            shade,
            segments=3,
            start=a,
            end=b,
            cap=True,
        )
    # Deck glazing on both sides of the habitat, with irregular occupied cabins.
    for j in range(6):
        l = a + (b - a) * (j + 0.12) / 6
        r = a + (b - a) * (j + 0.87) / 6
        tone = rng.choice([(169, 88, 24), (255, 167, 72), (62, 64, 71), (16, 21, 30)])
        strip(rotor, glass, 1.003, l, r, -0.006, 0.014, tone)
        strip(rotor, glass, 0.834, r, l, -0.005, 0.012, tone)

    # The planet-facing face is a service deck: inset hatches, thermal louvers,
    # pipeways and intermittent amber docking markers interrupt the annulus.
    def face(r1, r2, left, right, z, color, material=machinery):
        rotor[material].quad(
            [
                polar(r1, left, z),
                polar(r2, left, z),
                polar(r2, right, z),
                polar(r1, right, z),
            ],
            color,
        )

    face(0.861, 0.932, a + 0.008, b - 0.007, 0.060, (34, 43, 58))
    for j in range(5):
        t = a + 0.014 + j * 0.019
        face(0.871, 0.918, t, t + 0.007, 0.061, (83, 97, 106))
    face(0.942, 0.979, a + 0.007, b - 0.012, 0.061, shade, hull)
    face(0.951, 0.961, a + 0.014, a + 0.052, 0.062, (227, 103, 25), glass)
    for j in range(3):
        start = a + 0.013 + j * 0.032
        strip(rotor, machinery, 1.014, start, start + 0.020, -0.051, 0.015, graphite)
    for radius in (0.841, 0.986):
        tube(
            rotor,
            machinery,
            polar(radius, a, 0.063),
            polar(radius, b, 0.063),
            0.003,
            silver,
        )
    # Raised service spine carries external conduits, flanges and radiator louvers.
    for radius in (0.875, 0.972):
        tube(
            rotor,
            machinery,
            polar(radius, a, -0.079),
            polar(radius, b, -0.079),
            0.0049,
            silver,
        )
    if i % 4 == 1:
        for j in range(6):
            t = a + (b - a) * (j + 1) / 8
            tube(
                rotor,
                machinery,
                polar(0.875, t, -0.076),
                polar(0.946, t, -0.076),
                0.004,
                graphite,
            )
    if i % 6 == 0:
        band(
            rotor,
            machinery,
            0.961,
            1.020,
            -0.081,
            0.069,
            steel,
            segments=1,
            start=a,
            end=a + 0.016,
            cap=True,
        )
        tube(
            rotor,
            machinery,
            polar(0.948, a, -0.072),
            polar(0.948, a, -0.105),
            0.004,
            silver,
        )
        marker(rotor, polar(1.023, a + 0.008, 0.029), 0.024, (255, 26, 6))
        marker(rotor, polar(0.948, a, -0.108), 0.018, (255, 39, 8))
        strip(rotor, beacons, 1.021, a, a + 0.014, 0.02, 0.014, white)

# Inner raceway, clad lifts and triangulated service bridges.
band(rotor, machinery, 0.797, 0.816, 0.035, 0.053, steel)
for i in range(6):
    a = i * TAU / 6 + 0.17
    for shift in (-0.025, 0.025):
        tube(
            rotor,
            hull,
            polar(0.108, a + shift, 0.075),
            polar(0.84, a + shift, 0),
            0.012,
            steel,
        )
    for j in range(9):
        r1, r2 = 0.12 + j * 0.08, 0.12 + (j + 1) * 0.08
        z1, z2 = 0.08 * (1 - r1 / 0.84), 0.08 * (1 - r2 / 0.84)
        tube(
            rotor,
            machinery,
            polar(r1, a - 0.027, z1),
            polar(r2, a + 0.027, z2),
            0.004,
            silver,
        )
    for shift in (-0.009, 0.009):
        tube(
            rotor,
            machinery,
            polar(0.16, a + shift, 0.215),
            polar(0.83, a + shift, 0.025),
            0.0035,
            graphite,
        )

# Independent fixed spindle includes two dock decks, a stepped pressure hull,
# cable bundles, service fluting, slotted windows and communication masts.
lathe(
    spindle,
    hull,
    [
        (0.011, -0.51),
        (0.044, -0.43),
        (0.05, -0.29),
        (0.073, -0.27),
        (0.074, -0.105),
        (0.106, -0.078),
        (0.112, 0.09),
        (0.095, 0.12),
        (0.095, 0.28),
        (0.075, 0.39),
        (0.057, 0.49),
        (0.032, 0.51),
        (0.03, 0.62),
        (0.012, 0.65),
    ],
    steel,
    segments=36,
)
for z, ro, thickness in [
    (-0.27, 0.107, 0.043),
    (-0.085, 0.155, 0.075),
    (0.235, 0.285, 0.061),
    (0.298, 0.247, 0.033),
    (0.377, 0.115, 0.020),
    (0.51, 0.058, 0.031),
]:
    band(
        spindle,
        hull,
        ro * 0.30,
        ro,
        z - thickness / 2,
        z + thickness / 2,
        silver,
        segments=64,
    )
    band(
        spindle,
        machinery,
        ro * 0.94,
        ro * 1.005,
        z - 0.006,
        z + 0.004,
        graphite,
        segments=64,
    )
    if ro > 0.2:
        for i in range(36):
            a = TAU * i / 36
            face_z = z + thickness / 2 + 0.001
            spindle[machinery].quad(
                [
                    polar(ro * 0.61, a, face_z),
                    polar(ro * 0.92, a, face_z),
                    polar(ro * 0.92, a + 0.13, face_z),
                    polar(ro * 0.61, a + 0.13, face_z),
                ],
                graphite,
            )
            if i % 2 == 0:
                spindle[glass].quad(
                    [
                        polar(ro * 0.82, a, face_z + 0.001),
                        polar(ro * 0.85, a, face_z + 0.001),
                        polar(ro * 0.85, a + 0.08, face_z + 0.001),
                        polar(ro * 0.82, a + 0.08, face_z + 0.001),
                    ],
                    (247, 71, 13),
                )
    for j in range(48 if ro > 0.12 else 24):
        total = 48 if ro > 0.12 else 24
        start = j * TAU / total
        if j % 5 != 2:
            strip(
                spindle,
                glass,
                ro * 1.008,
                start,
                start + 0.66 * TAU / total,
                z - 0.004,
                0.006,
                (224, 162, 99),
            )
# Raised equipment racks and vent facets around both visible sides of the axle.
for i in range(12):
    a = TAU * i / 12
    for r, lo, hi in (
        (0.077, -0.23, -0.111),
        (0.115, -0.032, 0.095),
        (0.103, 0.123, 0.202),
        (0.082, 0.384, 0.463),
    ):
        strip(spindle, machinery, r, a, a + 0.34, lo, hi - lo, graphite)
        for j in range(4):
            t = a + 0.045 + j * 0.071
            tube(
                spindle,
                hull,
                polar(r + 0.002, t, lo),
                polar(r + 0.002, t, hi),
                0.0028,
                steel,
            )
        strip(
            spindle,
            glass,
            r + 0.001,
            a + 0.035,
            a + 0.11,
            hi - 0.012,
            0.007,
            (242, 116, 36),
        )
for i in range(18):
    a = TAU * i / 18
    tube(
        spindle,
        machinery,
        polar(0.077, a, -0.24),
        polar(0.079, a, -0.101),
        0.005,
        graphite,
    )
    tube(
        spindle,
        machinery,
        polar(0.099, a, 0.115),
        polar(0.100, a, 0.207),
        0.004,
        silver,
    )
    tube(spindle, machinery, polar(0.056, a, 0.39), polar(0.048, a, 0.52), 0.005, steel)
for i in range(7):
    angle = i * TAU / 7
    marker(spindle, polar(0.241, angle, 0.313), 0.017, (255, 72, 15))
marker(spindle, (0, 0, -0.583), 0.016, (255, 28, 8))
for i in range(7):
    a = TAU * i / 7
    tube(
        spindle,
        machinery,
        polar(0.04, a, -0.36),
        polar(0.04, a, -0.48 - (i % 3) * 0.036),
        0.003,
        silver,
    )
tube(spindle, machinery, (0, 0, -0.48), (0, 0, -0.58), 0.0028, silver)
tube(spindle, machinery, (0, 0, 0.60), (0, 0, 0.69), 0.0042, silver)


# The square seamless plate tile supplies brushed metal grain, panel seams,
# fasteners and interpolated tangent-space relief without a large texture atlas.
def png(channels, components=3):
    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    side = 128
    rows = b"".join(
        b"\0" + bytes(channels[(i * side * components) : ((i + 1) * side * components)])
        for i in range(side)
    )
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(
            b"IHDR",
            struct.pack(">2I5B", side, side, 8, 6 if components == 4 else 2, 0, 0, 0),
        )
        + chunk(b"IDAT", zlib.compress(rows, 9))
        + chunk(b"IEND", b"")
    )


albedo, normal, orm, glow = [], [], [], []


def height(x, y):
    x, y = x % 128, y % 128
    if x in (1, 2, 71) or y in (3, 4, 82) or (x > 72 and y in (36, 37)):
        return -0.60
    if x % 62 in (8, 9) and y % 40 in (7, 8):
        return 0.5
    return 0


for y in range(128):
    brush = rng.uniform(-6, 6)
    for x in range(128):
        d = math.hypot((x - 63.5) / 63.5, (y - 63.5) / 63.5)
        strength = min(1, math.exp(-d * d * 125) + 0.38 * math.exp(-d * d * 8))
        glow.extend((255, 255, 255, round(255 * strength)))
        h = height(x, y)
        c = min(
            255,
            round(211 + (x // 72 - y // 82) * 4 + brush + rng.uniform(-6, 6) + h * 92),
        )
        albedo.extend([c, c, min(255, c + 3)])
        v = unit(
            (
                height(x - 1, y) - height(x + 1, y),
                height(x, y - 1) - height(x, y + 1),
                1.5,
            )
        )
        normal.extend(round(127.5 * (n + 1)) for n in v)
        orm.extend((255, int(125 + brush - h * 35), 195))

blob = bytearray()
views = []
accessors = []


def view(data):
    start = len(blob)
    blob.extend(data)
    blob.extend(b"\0" * ((-len(blob)) % 4))
    views.append({"buffer": 0, "byteOffset": start, "byteLength": len(data)})
    return len(views) - 1


def acc(data, ctype, kind, dim, **kw):
    accessors.append(
        dict(
            bufferView=view(data.tobytes()),
            componentType=ctype,
            type=kind,
            count=len(data) // dim,
            **kw,
        )
    )
    return len(accessors) - 1


images = [
    {"bufferView": view(png(img)), "mimeType": "image/png"}
    for img in (albedo, normal, orm)
]
images.append({"bufferView": view(png(glow, 4)), "mimeType": "image/png"})
materials = [
    {
        "name": "Weathered titanium cladding",
        "pbrMetallicRoughness": {
            "baseColorTexture": {"index": 0},
            "metallicRoughnessTexture": {"index": 2},
            "metallicFactor": 0.72,
            "roughnessFactor": 1,
        },
        "normalTexture": {"index": 1, "scale": 0.65},
    },
    {
        "name": "Gunmetal service hardware",
        "pbrMetallicRoughness": {"metallicFactor": 0.46, "roughnessFactor": 0.42},
    },
    {"name": "Illuminated cabin glazing", "extensions": {"KHR_materials_unlit": {}}},
    {
        "name": "Red navigation beacon",
        "pbrMetallicRoughness": {"baseColorFactor": [0.8, 0.035, 0.012, 1]},
        "emissiveFactor": [1, 0.028, 0.006],
    },
]
materials.append(
    {
        "name": "Optical bloom at lamp emitters",
        "alphaMode": "BLEND",
        "doubleSided": True,
        "pbrMetallicRoughness": {"baseColorTexture": {"index": 3}},
        "extensions": {"KHR_materials_unlit": {}},
    }
)
meshes = []
for name, part in (("Rotor", rotor), ("Spindle", spindle)):
    primitives = []
    for mat, batch in part.items():
        pos = batch.positions
        attributes = {
            "POSITION": acc(
                pos,
                5126,
                "VEC3",
                3,
                min=[min(pos[i::3]) for i in range(3)],
                max=[max(pos[i::3]) for i in range(3)],
            ),
            "NORMAL": acc(batch.normals, 5126, "VEC3", 3),
            "COLOR_0": acc(batch.colors, 5121, "VEC4", 4, normalized=True),
        }
        if mat in (hull, halos):
            attributes["TEXCOORD_0"] = acc(batch.uvs, 5123, "VEC2", 2, normalized=True)
        indices = batch.indices
        if max(indices) < 65536:
            indices = array("H", indices)
        primitives.append(
            {
                "material": mat,
                "attributes": attributes,
                "indices": acc(
                    indices, 5123 if indices.typecode == "H" else 5125, "SCALAR", 1
                ),
            }
        )
    meshes.append({"name": name, "primitives": primitives})

gltf = {
    "asset": {"version": "2.0", "generator": "AzenoHI orbital habitat generator"},
    "extensionsUsed": ["KHR_materials_unlit"],
    "scene": 0,
    "scenes": [{"nodes": [0, 1]}],
    "nodes": [{"name": m["name"], "mesh": i} for i, m in enumerate(meshes)],
    "meshes": meshes,
    "materials": materials,
    "textures": [{"source": i} for i in range(4)],
    "images": images,
    "accessors": accessors,
    "buffers": [{"byteLength": len(blob)}],
    "bufferViews": views,
}
data = json.dumps(gltf, separators=(",", ":")).encode()
data += b" " * ((-len(data)) % 4)
output.write_bytes(
    struct.pack("<4sII", b"glTF", 2, 28 + len(data) + len(blob))
    + struct.pack("<I4s", len(data), b"JSON")
    + data
    + struct.pack("<I4s", len(blob), b"BIN\0")
    + blob
)
print(
    output.name,
    len(blob),
    "bytes,",
    sum(len(p.indices) // 3 for part in (rotor, spindle) for p in part.values()),
    "triangles",
)
