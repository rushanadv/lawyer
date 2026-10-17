#!/usr/bin/env python3
"""
generate_gavel_stl.py
LEX VERA — Precision STL Generator for Judge's Gavel & Sound Block

Coordinate System:
- Gavel head: vertical along Y axis (lathe axis = Y, center at origin)
- Gavel handle: horizontal along negative X axis (lathe axis = X, extends from X=0 to X=-5.2)
- Handle-to-head connection: 90-degree T-joint at (0, 0, 0)
- Sound block: horizontal striking surface at Y = -1.34 (base offset Y = -1.5)
- Final strike: bottom face of head (Y = -1.34) contacts top of sound block (Y = -1.34)
- All orientation transforms are BAKED into the STL vertices.

Outputs:
1. stl_assets/
   - part_gavel_head.stl
   - part_brass_band.stl
   - part_gavel_handle.stl
   - part_sound_block.stl
   - stages/
     - stage_1_suspended.stl
     - stage_2_raised.stl
     - stage_3_strike.stl
     - stage_4_impact.stl
2. public/stl_assets/ (and public/stl/) mirrored for web runtime
"""

import math
import os
import struct
import shutil

class Triangle:
    __slots__ = ('nx', 'ny', 'nz', 'v1', 'v2', 'v3')
    def __init__(self, v1, v2, v3, normal=None):
        self.v1 = v1
        self.v2 = v2
        self.v3 = v3
        if normal is None:
            # Outward normal via counter-clockwise cross product (v2 - v1) x (v3 - v1)
            ax, ay, az = v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]
            bx, by, bz = v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]
            nx = ay * bz - az * by
            ny = az * bx - ax * bz
            nz = ax * by - ay * bx
            length = math.sqrt(nx * nx + ny * ny + nz * nz)
            if length > 1e-9:
                self.nx = nx / length
                self.ny = ny / length
                self.nz = nz / length
            else:
                self.nx, self.ny, self.nz = 0.0, 1.0, 0.0
        else:
            self.nx, self.ny, self.nz = normal

def write_binary_stl(filename, triangles, name="gavel_mesh"):
    """Writes a list of Triangle objects to a standard binary STL file."""
    os.makedirs(os.path.dirname(os.path.abspath(filename)), exist_ok=True)
    with open(filename, 'wb') as f:
        header = f"LEX VERA 3D - {name[:60]}".encode('utf-8').ljust(80, b'\0')
        f.write(header)
        f.write(struct.pack('<I', len(triangles)))
        for tri in triangles:
            f.write(struct.pack('<3f', tri.nx, tri.ny, tri.nz))
            f.write(struct.pack('<3f', tri.v1[0], tri.v1[1], tri.v1[2]))
            f.write(struct.pack('<3f', tri.v2[0], tri.v2[1], tri.v2[2]))
            f.write(struct.pack('<3f', tri.v3[0], tri.v3[1], tri.v3[2]))
            f.write(struct.pack('<H', 0))

def lathe_profile_y(profile_points, segments=128):
    """
    Revolves a 2D profile along the Y-axis.
    profile_points: list of (y, r) where y is coordinate along Y, r is radial distance in XZ plane.
    Ordered from bottom to top (increasing y).
    """
    triangles = []
    num_pts = len(profile_points)

    grid = []
    for (y, r) in profile_points:
        ring = []
        for j in range(segments):
            theta = 2.0 * math.pi * j / segments
            x = r * math.cos(theta)
            z = r * math.sin(theta)
            ring.append((x, y, z))
        grid.append(ring)

    for i in range(num_pts - 1):
        for j in range(segments):
            next_j = (j + 1) % segments
            v00 = grid[i][j]
            v01 = grid[i][next_j]
            v10 = grid[i+1][j]
            v11 = grid[i+1][next_j]

            r0 = profile_points[i][1]
            r1 = profile_points[i+1][1]

            if r0 > 1e-6 and r1 > 1e-6:
                triangles.append(Triangle(v00, v10, v11))
                triangles.append(Triangle(v00, v11, v01))
            elif r0 <= 1e-6 and r1 > 1e-6:
                triangles.append(Triangle(v00, v10, v11))
            elif r0 > 1e-6 and r1 <= 1e-6:
                triangles.append(Triangle(v00, v11, v01))

    return triangles

def lathe_profile_x(profile_points, segments=128):
    """
    Revolves a 2D profile along the X-axis.
    profile_points: list of (x, r) where x is coordinate along X, r is radial distance in YZ plane.
    Ordered along X.
    """
    triangles = []
    num_pts = len(profile_points)

    grid = []
    for (x, r) in profile_points:
        ring = []
        for j in range(segments):
            theta = 2.0 * math.pi * j / segments
            y = r * math.cos(theta)
            z = r * math.sin(theta)
            ring.append((x, y, z))
        grid.append(ring)

    for i in range(num_pts - 1):
        for j in range(segments):
            next_j = (j + 1) % segments
            v00 = grid[i][j]
            v01 = grid[i][next_j]
            v10 = grid[i+1][j]
            v11 = grid[i+1][next_j]

            r0 = profile_points[i][1]
            r1 = profile_points[i+1][1]

            if r0 > 1e-6 and r1 > 1e-6:
                # Winding order for outward normals along X
                triangles.append(Triangle(v00, v01, v11))
                triangles.append(Triangle(v00, v11, v10))
            elif r0 <= 1e-6 and r1 > 1e-6:
                triangles.append(Triangle(v00, v01, v11))
            elif r0 > 1e-6 and r1 <= 1e-6:
                triangles.append(Triangle(v00, v11, v10))

    return triangles

def build_gavel_head():
    """
    Vertical Gavel Head (lathe axis = Y, centered at Y = 0).
    Bottom striking face at Y = -1.34 (radius 0.68).
    Top striking face at Y = +1.34 (radius 0.68).
    Recesses for brass bands at Y = -0.55..-0.35 and Y = 0.35..0.55.
    """
    profile = [
        # Bottom striking face cap (flat disk at Y = -1.34)
        (-1.34, 0.0),
        (-1.34, 0.68),
        # Bottom bell flare & stepped mold
        (-1.32, 0.70),
        (-1.26, 0.75),
        (-1.18, 0.78),
        (-1.08, 0.76),
        (-0.95, 0.72),
        (-0.80, 0.68),
        (-0.65, 0.66),
        # Recess for lower brass band
        (-0.58, 0.66),
        (-0.58, 0.62),
        (-0.35, 0.62),
        (-0.35, 0.66),
        # Central barrel waist
        (-0.25, 0.64),
        (-0.12, 0.63),
        ( 0.00, 0.62),
        ( 0.12, 0.63),
        ( 0.25, 0.64),
        # Recess for upper brass band
        ( 0.35, 0.66),
        ( 0.35, 0.62),
        ( 0.58, 0.62),
        ( 0.58, 0.66),
        # Top bell flare & stepped mold
        ( 0.65, 0.66),
        ( 0.80, 0.68),
        ( 0.95, 0.72),
        ( 1.08, 0.76),
        ( 1.18, 0.78),
        ( 1.26, 0.75),
        ( 1.32, 0.70),
        # Top striking face cap (flat disk at Y = +1.34)
        ( 1.34, 0.68),
        ( 1.34, 0.0)
    ]
    return lathe_profile_y(profile, segments=128)

def build_brass_bands():
    """
    Dual flush-mounted turned brass rings seated into the head lathe recesses.
    Lower band: Y = -0.57..-0.36, outer radius = 0.66, inner radius = 0.615.
    Upper band: Y =  0.36.. 0.57, outer radius = 0.66, inner radius = 0.615.
    """
    triangles = []
    # Lower band
    p_lower = [
        (-0.57, 0.615),
        (-0.57, 0.658),
        (-0.56, 0.660),
        (-0.37, 0.660),
        (-0.36, 0.658),
        (-0.36, 0.615)
    ]
    triangles.extend(lathe_profile_y(p_lower, segments=128))

    # Upper band
    p_upper = [
        (0.36, 0.615),
        (0.36, 0.658),
        (0.37, 0.660),
        (0.56, 0.660),
        (0.57, 0.658),
        (0.57, 0.615)
    ]
    triangles.extend(lathe_profile_y(p_upper, segments=128))
    return triangles

def build_gavel_handle():
    """
    Horizontal Gavel Handle (lathe axis = X, extending along -X).
    Connects to head at X = 0 (perpendicular T-joint).
    Extends from X = 0 to X = -5.08.
    Includes turned tenon, transition collar, tapered shaft, ribbed grip, and bulbous pommel.
    """
    profile = [
        # Socket tenon inserting into head at (0, 0, 0)
        ( 0.00, 0.0),
        ( 0.00, 0.26),
        (-0.35, 0.26),
        # Mounting flange / bolster collar
        (-0.40, 0.32),
        (-0.55, 0.34),
        (-0.70, 0.30),
        (-0.85, 0.26),
        # Long tapered turned shaft
        (-1.20, 0.24),
        (-1.60, 0.22),
        (-2.00, 0.20),
        (-2.40, 0.19),
        (-2.80, 0.19),
        (-3.20, 0.20),
        (-3.50, 0.22),
        # Ergonomic turned grip with subtle ribs
        (-3.65, 0.26),
        (-3.80, 0.28),
        (-4.00, 0.29),
        (-4.20, 0.28),
        (-4.40, 0.27),
        (-4.55, 0.28),
        # Grip-to-pommel waist
        (-4.68, 0.25),
        (-4.72, 0.28),
        # Bulbous turned end pommel
        (-4.85, 0.36),
        (-4.95, 0.35),
        (-5.02, 0.28),
        (-5.06, 0.18),
        (-5.08, 0.0)
    ]
    return lathe_profile_x(profile, segments=128)

def build_sound_block():
    """
    Hardwood Circular Sound Block (lathe axis = Y).
    Offset: base at Y = -1.82, top striking surface at Y = -1.34.
    Diameter of top striking surface: radius 1.45 (comfortably larger than gavel face 0.68).
    Includes stepped base, bevels, and recessed brass trim line.
    """
    profile = [
        # Flat bottom base on courtroom desk (Y = -1.82)
        (-1.82, 0.0),
        (-1.82, 2.10),
        # Bottom decorative lip
        (-1.80, 2.12),
        (-1.74, 2.12),
        (-1.72, 2.05),
        (-1.66, 1.95),
        # Stepped plinth cove
        (-1.62, 1.82),
        (-1.58, 1.75),
        (-1.50, 1.68),
        (-1.42, 1.60),
        # Top chamfered rim leading to horizontal striking face at Y = -1.34
        (-1.37, 1.52),
        (-1.34, 1.45),
        (-1.34, 0.0)
    ]
    return lathe_profile_y(profile, segments=128)

def transform_triangles(triangles, rotation_z=0.0, pivot_x=-4.6, pivot_y=0.0):
    """
    Rotates triangles around Z-axis at given pivot (pivot_x, pivot_y, 0).
    theta > 0 rotates counter-clockwise in XY plane (head swings UP/backwards).
    theta = 0 is horizontal resting / impact pose.
    """
    cos_t = math.cos(rotation_z)
    sin_t = math.sin(rotation_z)
    transformed = []

    for tri in triangles:
        def rot_pt(pt):
            x, y, z = pt
            # Translate to pivot
            dx = x - pivot_x
            dy = y - pivot_y
            # Rotate around Z
            rx = dx * cos_t - dy * sin_t
            ry = dx * sin_t + dy * cos_t
            # Translate back
            return (rx + pivot_x, ry + pivot_y, z)

        v1 = rot_pt(tri.v1)
        v2 = rot_pt(tri.v2)
        v3 = rot_pt(tri.v3)
        transformed.append(Triangle(v1, v2, v3))

    return transformed

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    stl_dir = os.path.join(root_dir, 'stl_assets')
    stages_dir = os.path.join(stl_dir, 'stages')
    public_stl_assets_dir = os.path.join(root_dir, 'public', 'stl_assets')
    public_stl_dir = os.path.join(root_dir, 'public', 'stl')

    for d in [stl_dir, stages_dir, public_stl_assets_dir, public_stl_dir,
              os.path.join(public_stl_assets_dir, 'stages'),
              os.path.join(public_stl_dir, 'stages')]:
        os.makedirs(d, exist_ok=True)

    print("=========================================================")
    print("LEX VERA — Precision STL Generation")
    print("=========================================================")

    # 1. Generate Modular Components (At exact zero/impact reference pose)
    print("Generating modular component STLs...")
    head_tris = build_gavel_head()
    brass_tris = build_brass_bands()
    handle_tris = build_gavel_handle()
    block_tris = build_sound_block()

    write_binary_stl(os.path.join(stl_dir, 'part_gavel_head.stl'), head_tris, "gavel_head_vertical_y")
    write_binary_stl(os.path.join(stl_dir, 'part_brass_band.stl'), brass_tris, "brass_bands_flush")
    write_binary_stl(os.path.join(stl_dir, 'part_gavel_handle.stl'), handle_tris, "gavel_handle_horizontal_x")
    write_binary_stl(os.path.join(stl_dir, 'part_sound_block.stl'), block_tris, "sound_block_horizontal")

    # Combine gavel parts into complete assembly for stages
    gavel_assembly = head_tris + brass_tris + handle_tris

    # 2. Generate 4 Animation Stages (Verification Snapshots)
    # Pivot near grip: X = -4.6, Y = 0.0
    pivot_x = -4.6
    pivot_y = 0.0

    # Stage 1: Suspended (Neutral pause above block, angle = +14 deg / 0.244 rad)
    print("Generating Stage 1: Suspended Gavel...")
    stg1_gavel = transform_triangles(gavel_assembly, rotation_z=math.radians(14.0), pivot_x=pivot_x, pivot_y=pivot_y)
    write_binary_stl(os.path.join(stages_dir, 'stage_1_suspended.stl'), stg1_gavel + block_tris, "stage_1_suspended")

    # Stage 2: Raised (Preparation wind-up, angle = +28 deg / 0.488 rad)
    print("Generating Stage 2: Raised Gavel...")
    stg2_gavel = transform_triangles(gavel_assembly, rotation_z=math.radians(28.0), pivot_x=pivot_x, pivot_y=pivot_y)
    write_binary_stl(os.path.join(stages_dir, 'stage_2_raised.stl'), stg2_gavel + block_tris, "stage_2_raised")

    # Stage 3: Mid-Swing Strike (Accelerating down, angle = +7 deg / 0.122 rad)
    print("Generating Stage 3: Mid-Swing Strike...")
    stg3_gavel = transform_triangles(gavel_assembly, rotation_z=math.radians(7.0), pivot_x=pivot_x, pivot_y=pivot_y)
    write_binary_stl(os.path.join(stages_dir, 'stage_3_strike.stl'), stg3_gavel + block_tris, "stage_3_strike")

    # Stage 4: Physical Impact (Exact contact at 0.0 deg, Y = -1.34)
    print("Generating Stage 4: Physical Impact...")
    stg4_gavel = transform_triangles(gavel_assembly, rotation_z=0.0, pivot_x=pivot_x, pivot_y=pivot_y)
    write_binary_stl(os.path.join(stages_dir, 'stage_4_impact.stl'), stg4_gavel + block_tris, "stage_4_impact")

    # 3. Mirror to public/stl_assets and public/stl
    print("Mirroring generated assets to public directories...")
    for root, dirs, files in os.walk(stl_dir):
        rel_path = os.path.relpath(root, stl_dir)
        dest1 = os.path.join(public_stl_assets_dir, rel_path)
        dest2 = os.path.join(public_stl_dir, rel_path)
        os.makedirs(dest1, exist_ok=True)
        os.makedirs(dest2, exist_ok=True)
        for f in files:
            if f.endswith('.stl'):
                src_file = os.path.join(root, f)
                shutil.copy2(src_file, os.path.join(dest1, f))
                shutil.copy2(src_file, os.path.join(dest2, f))

    print("\n✓ Generation complete. Asset verification:")
    for fn in ['part_gavel_head.stl', 'part_brass_band.stl', 'part_gavel_handle.stl', 'part_sound_block.stl']:
        p = os.path.join(stl_dir, fn)
        sz = os.path.getsize(p) / 1024
        print(f"  - {fn}: {sz:.1f} KB")

    for fn in ['stage_1_suspended.stl', 'stage_2_raised.stl', 'stage_3_strike.stl', 'stage_4_impact.stl']:
        p = os.path.join(stages_dir, fn)
        sz = os.path.getsize(p) / 1024
        print(f"  - stages/{fn}: {sz:.1f} KB")

if __name__ == '__main__':
    main()
