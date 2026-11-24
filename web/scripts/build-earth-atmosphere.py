"""Bake single scattering for the Home orthographic sunrise using only Python 3.

The atmosphere is spherically symmetric. For our fixed solar elevation the
view integral depends just on projected distance to Earth's center and solar
azimuth. Both midpoint integrals use kilometers. This is original code,
integrating the extinction and phase functions in Bruneton and Neyret (2008):
https://ebruneton.github.io/precomputed_atmospheric_scattering/. The low-air
diffuse irradiance is an approximation calibrated for this shot.
"""

import math
import struct
import zlib
from pathlib import Path

EARTH = 6371.0
TOP = EARTH * 1.012
SUN_HORIZONTAL = 0.129  # The solar elevation used by Planet.tsx
SUN_Z = -math.sqrt(1.0 - SUN_HORIZONTAL**2)
RAYLEIGH = (0.005802, 0.013558, 0.033100)
AEROSOL = 0.00045
# Chappuis absorption for an RGB approximation, concentrated at 25 km altitude.
OZONE = (0.0014, 0.0006, 8.5e-05)
SUN_ANGLE = 0.00465
WIDTH, AZIMUTHS = 256, 96
GROUND_SAMPLES = 176
VIEW_STEPS, SUN_STEPS = 48, 28


def densities(height):
    height = max(0.0, height)
    return (
        math.exp(-height / 8.0),
        math.exp(-height / 1.2),
        max(0.0, 1.0 - abs(height - 25.0) / 15.0),
    )


def coefficients(molecules, aerosols, ozone):
    return tuple(
        ray * molecules + AEROSOL * aerosols + oz * ozone
        for ray, oz in zip(RAYLEIGH, OZONE)
    )


def sun_extinction(radius, mu):
    """Integrate toward the Sun up to the outer boundary through spherical shells."""
    projected = radius * mu
    length = math.sqrt(projected**2 + TOP**2 - radius**2) - projected
    step = length / SUN_STEPS
    air, haze, ozone = 0.0, 0.0, 0.0
    for i in range(SUN_STEPS):
        distance = (i + 0.5) * step
        a, b, c = densities(
            math.sqrt(radius**2 + distance * (distance + 2.0 * projected)) - EARTH
        )
        air += a * step
        haze += b * step
        ozone += c * step
    return coefficients(air, haze, ozone)


def ray_samples(impact, ground):
    near = math.sqrt(max(0.0, TOP**2 - impact**2))
    far = math.sqrt(max(0.0, EARTH**2 - impact**2)) if ground else -near
    step = (near - far) / VIEW_STEPS
    depth = [0.0, 0.0, 0.0]
    samples = []
    for i in range(VIEW_STEPS):
        z = near - (i + 0.5) * step
        radius = math.hypot(impact, z)
        air, haze, ozone = densities(radius - EARTH)
        extinction = coefficients(air, haze, ozone)
        half_depth = [d + 0.5 * e * step for d, e in zip(depth, extinction)]
        samples.append((z, radius, air * step, haze * step, half_depth))
        depth = [d + e * step for d, e in zip(depth, extinction)]
    return samples, [math.exp(-d) for d in depth]


def single_scattering(impact, samples, azimuth):
    phase_rayleigh = 3.0 * (1.0 + SUN_Z**2) / (16.0 * math.pi)
    # Finite-field forward aureole. Orthographic rays have a constant angle
    # to the light; the projected azimuth localizes the solar aerosol halo.
    cosine = -SUN_Z * azimuth
    g = 0.82
    phase_aerosol = (1.0 - g**2) / (
        4.0 * math.pi * (1.0 + g**2 - 2.0 * g * cosine) ** 1.5
    )
    # A hemisphere of diffuse skylight contributes even in the shallow shadow
    # where direct sunlight is reddened by the long path to the terminator.
    # Approximate its spectrum by the vertically scattered fraction of sunlight.
    # Normalize to the green band; adjacent wavelengths have experienced
    # approximately two scattering events in the lower, indirectly lit air.
    green = 1.0 - math.exp(-8.0 * RAYLEIGH[1])
    sky = [((1.0 - math.exp(-8.0 * b)) / green) ** 1.9 for b in RAYLEIGH]
    radiance = [0.0, 0.0, 0.0]
    for z, radius, air, haze, view_depth in samples:
        mu = (impact * azimuth * SUN_HORIZONTAL + z * SUN_Z) / radius
        horizon = -math.sqrt(max(0.0, 1.0 - (EARTH / radius) ** 2))
        f = max(0.0, min(1.0, (mu - horizon + SUN_ANGLE) / (2.0 * SUN_ANGLE)))
        # The sunlit lower atmosphere supplies the diffuse field. A grazing
        # camera ray sees this illuminated air only near the terminator.
        twilight = min(1.0, max(0.0, (mu - 0.012) / 0.101))
        diffuse = (
            twilight
            * twilight
            * (3.0 - 2.0 * twilight)
            * math.exp(-(radius - EARTH) / 5.0)
        )
        if diffuse == 0.0 and f == 0.0:
            continue
        visible_disc = f * f * (3.0 - 2.0 * f)
        solar_depth = sun_extinction(radius, mu) if f else (0.0, 0.0, 0.0)
        for c in range(3):
            transmission = math.exp(-view_depth[c] - solar_depth[c])
            source = (
                RAYLEIGH[c] * air * phase_rayleigh
                + 0.9 * AEROSOL * haze * phase_aerosol
            )
            direct = 0.57 * visible_disc * transmission * source
            indirect = (
                1.764203595
                * diffuse
                * sky[c]
                * RAYLEIGH[c]
                * air
                * math.exp(-view_depth[c])
            )
            radiance[c] += direct + indirect
    return radiance


def byte(value):
    return min(255, round(255.0 * max(0.0, value)))


def chunk(tag, data):
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data))
    )


def main():
    rows = [bytearray() for _ in range(AZIMUTHS + 1)]
    for x in range(WIDTH):
        ground = x < GROUND_SAMPLES
        # Split the inner half-chord and the outer full chord into separate
        # intervals so linear filtering cannot cross the occulting ground.
        if ground:
            impact = EARTH * (1.0 - (1.0 - x / (GROUND_SAMPLES - 1)) ** 2)
        else:
            u = (x - GROUND_SAMPLES) / (WIDTH - GROUND_SAMPLES - 1)
            impact = EARTH + (TOP - EARTH) * u**2
        samples, transmission = ray_samples(impact, ground)
        rows[0].extend(byte(t) for t in transmission)
        for y, row in enumerate(rows[1:]):
            half_sine = y / (AZIMUTHS - 1)
            light = single_scattering(impact, samples, 1.0 - 2.0 * half_sine**2)
            # Square-root encoding resolves faint high-altitude radiance.
            row.extend(byte(math.sqrt(c / 4.0)) for c in light)
    image = b"".join(b"\0" + row for row in rows)
    header = struct.pack(">IIBBBBB", WIDTH, len(rows), 8, 2, 0, 0, 0)
    path = Path(__file__).resolve().parents[1] / "public/home/planet/atmosphere.png"
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(image, 9))
        + chunk(b"IEND", b"")
    )


if __name__ == "__main__":
    main()
