#!/usr/bin/env python3
"""
scripts/generate_gavel_assets.py

Generates modular STL assets for LEX VERA:
1. part_gavel_head.stl      - Turned striking head (longitudinal axis = X)
2. part_brass_band.stl       - Flush-mounted brass ring accents
3. part_gavel_handle.stl     - Hand-turned wooden handle (longitudinal axis = Y, perpendicular to head)
4. part_sound_block.stl      - Hardwood stepped sound block (horizontal, below gavel)

And 4 verified animation stage STLs in stl_assets/stages/:
- stage_1_suspended.stl      - Suspended in neutral dramatic pause
- stage_2_raised.stl         - Raised back in anticipation/preparation pose
- stage_3_strike.stl         - Accelerating downward through mid-swing
- stage_4_impact.stl         - Perfect physical contact on sound block
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
            # Compute outward normal via cross product
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
        # 80-byte header
        header = f"LEX VERA 3D - {name[:60]}".encode('utf-8')
        header = header.ljust(80, b'\0')
        f.write(header)
        # Number of triangles (uint32)
        f.write(struct.pack('<I', len(triangles)))
        # Write each triangle
        for tri in triangles:
            f.write(struct.pack('<3f', tri.nx, tri.ny, tri.nz))
            f.write(struct.pack('<3f', tri.v1[0], tri.v1[1], tri.v1[2]))
            f.write(struct.pack('<3f', tri.v2[0], tri.v2[1], tri.v2[2]))
            f.write(struct.pack('<3f', tri.v3[0], tri.v3[1], tri.v3[2]))
            f.write(struct.pack('<H', 0)) # Attribute byte count

def lathe_profile_x(profile_points, segments=96):
    """
    Revolves a 2D profile along the X-axis.
    profile_points: list of (x, r) where x is position along X, r is radial distance from X axis in YZ plane.
    """
    triangles = []
    num_pts = len(profile_points)

    grid = []
    for i, (x, r) in enumerate(profile_points):
        ring = []
        for j in range(segments):
            theta = 2.0 * math.pi * j / segments
            y = r * math.cos(theta)
            z = r * math.sin(theta)
            ring.append((x, y, z))
        grid.append(ring)

    # Triangulate quad mesh between rings
    for i in range(num_pts - 1):
        for j in range(segments):
            next_j = (j + 1) % segments
            v00 = grid[i][j]
            v01 = grid[i][next_j]
            v10 = grid[i+1][j]
            v11 = grid[i+1][next_j]

            # If radius is zero, handle degenerate triangles gracefully
            r0 = profile_points[i][1]
            r1 = profile_points[i+1][1]

            if r0 > 1e-6 and r1 > 1e-6:
                triangles.append(Triangle(v00, v10, v11))
                triangles.append(Triangle(v00, v11, v01))
            elif r0 <= 1e-6 and r1 > 1e-6:
                triangles.append(Triangle(v00, v10, v11))
            elif r0 > 1e-6 and r1 <= 1e-6:
                triangles.append(Triangle(v00, v11, v01))

    # Cap ends if r > 0
    if profile_points[0][1] > 1e-6:
        x0 = profile_points[0][0]
        center = (x0, 0.0, 0.0)
        for j in range(segments):
            next_j = (j + 1) % segments
            triangles.append(Triangle(center, grid[0][next_j], grid[0][j]))

    if profile_points[-1][1] > 1e-6:
        x1 = profile_points[-1][0]
        center = (x1, 0.0, 0.0)
        for j in range(segments):
            next_j = (j + 1) % segments
            triangles.append(Triangle(center, grid[-1][j], grid[-1][next_j]))

    return triangles

def lathe_profile_y(profile_points, segments=96):
    """
    Revolves a 2D profile along the Y-axis.
    profile_points: list of (y, r) where y is position along Y, r is radial distance from Y axis in XZ plane.
    """
    triangles = []
    num_pts = len(profile_points)

    grid = []
    for i, (y, r) in enumerate(profile_points):
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
                triangles.append(Triangle(v00, v11, v10))
                triangles.append(Triangle(v00, v01, v11))
            elif r0 <= 1e-6 and r1 > 1e-6:
                triangles.append(Triangle(v00, v11, v10))
            elif r0 > 1e-6 and r1 <= 1e-6:
                triangles.append(Triangle(v00, v01, v11))

    # Cap ends if r > 0
    if profile_points[0][1] > 1e-6:
        y0 = profile_points[0][0]
        center = (0.0, y0, 0.0)
        for j in range(segments):
            next_j = (j + 1) % segments
            triangles.append(Triangle(center, grid[0][j], grid[0][next_j]))

    if profile_points[-1][1] > 1e-6:
        y1 = profile_points[-1][0]
        center = (0.0, y1, 0.0)
        for j in range(segments):
            next_j = (j + 1) % segments
            triangles.append(Triangle(center, grid[-1][next_j], grid[-1][j]))

    return triangles

def transform_triangles(triangles, translation=(0, 0, 0), rotation_x=0.0, pivot=(0, 0, 0)):
    """Rotates triangles around an arbitrary pivot point on X-axis, then applies translation."""
    cos_a = math.cos(rotation_x)
    sin_a = math.sin(rotation_x)
    px, py, pz = pivot
    tx, ty, tz = translation

    out = []
    for tri in triangles:
        def rot(v):
            # Shift to pivot
            x = v[0] - px
            y = v[1] - py
            z = v[2] - pz
            # Rotate around X
            ry = y * cos_a - z * sin_a
            rz = y * sin_a + z * cos_a
            # Shift back + translate
            return (x + px + tx, ry + py + ty, rz + pz + tz)

        out.append(Triangle(rot(tri.v1), rot(tri.v2), rot(tri.v3)))
    return out

# ==========================================
# 1. GENERATE MODULAR GAVEL COMPONENTS
# ==========================================

def generate_gavel_head():
    """
    Gavel Head:
    Longitudinal axis = X
    Length = 2.8 units (from x = -1.4 to x = +1.4)
    Maximum strike face radius = 0.54 units
    Center at (0, 0, 0)
    Recessed bands at x = [-0.85, -0.65] and [+0.65, +0.85] for brass bands
    Center underside connects to handle at x = 0, y = 0
    """
    pts = [
        (-1.40, 0.0),    # Left strike face center
        (-1.40, 0.48),   # Left flat face
        (-1.36, 0.53),   # Chamfer
        (-1.30, 0.54),   # Outer bell rim
        (-1.18, 0.49),   # Concave bell waist
        (-0.95, 0.46),   # Taper before band
        (-0.85, 0.51),   # Raised bead before band
        (-0.84, 0.47),   # Step down into brass band recess
        (-0.66, 0.47),   # Brass band seat
        (-0.65, 0.51),   # Step up from band
        (-0.45, 0.49),   # Barrel taper
        (0.00,  0.52),   # Center barrel swell
        (0.45,  0.49),
        (0.65,  0.51),
        (0.66,  0.47),   # Right brass band recess
        (0.84,  0.47),
        (0.85,  0.51),
        (0.95,  0.46),
        (1.18,  0.49),
        (1.30,  0.54),
        (1.36,  0.53),
        (1.40,  0.48),
        (1.40,  0.0),    # Right strike face center
    ]
    return lathe_profile_x(pts, segments=96)

def generate_brass_bands():
    """
    Brass bands:
    Flush-fit in the recessed bands on the head at x = [-0.84, -0.66] and [+0.66, +0.84]
    """
    pts1 = [
        (-0.84, 0.47),
        (-0.84, 0.515),
        (-0.66, 0.515),
        (-0.66, 0.47)
    ]
    tris1 = lathe_profile_x(pts1, segments=96)

    pts2 = [
        (0.66, 0.47),
        (0.66, 0.515),
        (0.84, 0.515),
        (0.84, 0.47)
    ]
    tris2 = lathe_profile_x(pts2, segments=96)

    return tris1 + tris2

def generate_gavel_handle():
    """
    Gavel Handle:
    Longitudinal axis = Y
    Extends downward from center underside of gavel head (y = 0.10 inside head to y = -3.40)
    Top tenon enters the head at y = 0.10 (inside head radius 0.52)
    Neck at y = -0.70
    Ergonomic palm swell at y = -2.60
    Pommel sphere at y = -3.20
    Finial at y = -3.40
    Perpendicular to gavel head (head along X, handle along Y)
    """
    pts = [
        (0.10, 0.12),   # Tenon inside head
        (-0.15, 0.13),  # Through head center
        (-0.46, 0.14),  # Exiting head underside
        (-0.52, 0.17),  # Brass collar top
        (-0.64, 0.17),  # Brass collar bottom
        (-0.70, 0.14),  # Neck throat
        (-1.20, 0.135), # Narrowest waist
        (-1.80, 0.15),  # Shaft taper
        (-2.20, 0.175), # Ergonomic palm grip start
        (-2.60, 0.185), # Maximum palm swell
        (-2.95, 0.165), # Taper before pommel
        (-3.05, 0.22),  # Turned pommel sphere top
        (-3.20, 0.23),  # Pommel equator
        (-3.30, 0.16),  # Pommel bottom
        (-3.38, 0.10),  # Finial bead
        (-3.40, 0.0)    # Finial end point
    ]
    return lathe_profile_y(pts, segments=64)

def generate_sound_block():
    """
    Sound Block:
    Horizontal stepped circular hardwood plinth situated below the gavel
    Base at y = 0.0, outer radius = 1.85
    Top strike plate at y = 0.55, dished center depression at y = 0.52
    Normal pointing along +Y
    """
    pts = [
        (0.00, 0.0),    # Bottom center
        (0.00, 1.85),   # Base outer corner
        (0.12, 1.85),   # Base vertical rim
        (0.18, 1.72),   # Lower chamfer
        (0.32, 1.70),   # Middle tier step
        (0.38, 1.58),   # Middle tier chamfer
        (0.52, 1.55),   # Upper tier step
        (0.55, 1.48),   # Top rim bevel
        (0.55, 0.85),   # Flat strike rim
        (0.52, 0.0)     # Dished center depression
    ]
    return lathe_profile_y(pts, segments=96)

# ==========================================
# 2. MAIN GENERATION PIPELINE & STAGES
# ==========================================

def orient_gavel_assembly(head_tris, band_tris, handle_tris):
    """
    Transforms the local gavel components (head along X, handle along -Y)
    into the courtroom assembly orientation where:
    - Head longitudinal axis is X
    - Handle extends along +Z toward the judge's hand
    - Underside of head points downward toward -Y (the sound block)
    Rotation: -90 degrees around X: (x, y, z) -> (x, z, -y)
    """
    assembled = head_tris + band_tris + handle_tris
    oriented = []
    for tri in assembled:
        def rot(v):
            # Rot around X by -pi/2
            return (v[0], v[2], -v[1])
        oriented.append(Triangle(rot(tri.v1), rot(tri.v2), rot(tri.v3)))
    return oriented

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(root_dir, "stl_assets")
    stages_dir = os.path.join(output_dir, "stages")
    public_stl_dir = os.path.join(root_dir, "public", "stl")

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(stages_dir, exist_ok=True)
    os.makedirs(public_stl_dir, exist_ok=True)

    print("Generating modular gavel components...")

    head_tris = generate_gavel_head()
    band_tris = generate_brass_bands()
    handle_tris = generate_gavel_handle()
    block_tris = generate_sound_block()

    # Save modular parts (in local coordinate systems as specified)
    parts = {
        "part_gavel_head.stl": (head_tris, "Gavel Striking Head (X-Axis)"),
        "part_brass_band.stl": (band_tris, "Polished Brass Inlay Bands"),
        "part_gavel_handle.stl": (handle_tris, "Turned Hardwood Handle (Y-Axis)"),
        "part_sound_block.stl": (block_tris, "Hardwood Sound Block Plinth")
    }

    for fname, (tris, label) in parts.items():
        path = os.path.join(output_dir, fname)
        write_binary_stl(path, tris, label)
        size_kb = os.path.getsize(path) / 1024
        print(f"  ✓ {fname}: {len(tris):,} triangles ({size_kb:.1f} KB)")
        # Copy to public directory
        shutil.copy2(path, os.path.join(public_stl_dir, fname))

    # ========================================================
    # 3. KINEMATICALLY EXACT 4 ANIMATION STAGES
    # ========================================================
    # In courtroom space:
    # Sound block is at (0, 0, 0), top strike face is at y = 0.55
    # Gavel oriented with head along X, handle along +Z
    # Head radius at center is r = 0.52
    # At impact, head center is at (0, 0.55 + 0.52, 0) = (0, 1.07, 0)
    # The underside of the head exactly touches the sound block at y = 0.55!
    # Distance from head center to grip pivot along Z is L = 2.6
    # Grip Pivot is at PIVOT = (0.0, 1.07, 2.6)
    #
    # When rotated by angle theta around PIVOT (rotation around X):
    # theta = 0.00 rad -> Stage 4: Physical Impact (exact contact, y_contact = 0.55)
    # theta = -0.12 rad -> Stage 3: Downward Strike (accelerating toward block)
    # theta = -0.32 rad -> Stage 1: Suspended Gavel (poised in dramatic pause)
    # theta = -0.65 rad -> Stage 2: Raised Gavel (pulled back in preparation pose)
    # ========================================================

    oriented_gavel = orient_gavel_assembly(head_tris, band_tris, handle_tris)
    # In oriented_gavel: head center is at (0, 0, 0), handle goes along +Z to z = 3.4
    # Shift so head center is at (0, 1.07, 0):
    gavel_at_contact = transform_triangles(oriented_gavel, translation=(0.0, 1.07, 0.0))

    PIVOT = (0.0, 1.07, 2.6)

    print("\nGenerating 4 verified animation stages...")

    # Stage 1 — Suspended Gavel (poised above sound block, neutral dramatic pause)
    s1_tris = transform_triangles(gavel_at_contact, rotation_x=0.32, pivot=PIVOT)
    s1_all = s1_tris + block_tris
    write_binary_stl(os.path.join(stages_dir, "stage_1_suspended.stl"), s1_all, "Stage 1 - Suspended")
    print(f"  ✓ stage_1_suspended.stl: {len(s1_all):,} triangles")

    # Stage 2 — Raised Gavel (rotated backward into anticipation/preparation pose)
    s2_tris = transform_triangles(gavel_at_contact, rotation_x=0.65, pivot=PIVOT)
    s2_all = s2_tris + block_tris
    write_binary_stl(os.path.join(stages_dir, "stage_2_raised.stl"), s2_all, "Stage 2 - Raised Anticipation")
    print(f"  ✓ stage_2_raised.stl: {len(s2_all):,} triangles")

    # Stage 3 — Downward Strike (accelerating downward through mid-swing)
    s3_tris = transform_triangles(gavel_at_contact, rotation_x=0.12, pivot=PIVOT)
    s3_all = s3_tris + block_tris
    write_binary_stl(os.path.join(stages_dir, "stage_3_strike.stl"), s3_all, "Stage 3 - Downward Strike Acceleration")
    print(f"  ✓ stage_3_strike.stl: {len(s3_all):,} triangles")

    # Stage 4 — Physical Impact (striking face makes exact physical contact on sound block)
    s4_tris = transform_triangles(gavel_at_contact, rotation_x=0.0, pivot=PIVOT)
    s4_all = s4_tris + block_tris
    write_binary_stl(os.path.join(stages_dir, "stage_4_impact.stl"), s4_all, "Stage 4 - Physical Impact Contact")
    print(f"  ✓ stage_4_impact.stl: {len(s4_all):,} triangles")

    # Copy all stages to public/stl/stages/
    public_stages_dir = os.path.join(public_stl_dir, "stages")
    os.makedirs(public_stages_dir, exist_ok=True)
    for stage_f in ["stage_1_suspended.stl", "stage_2_raised.stl", "stage_3_strike.stl", "stage_4_impact.stl"]:
        shutil.copy2(os.path.join(stages_dir, stage_f), os.path.join(public_stages_dir, stage_f))

    print("\n✓ All modular STL assets and animation stages generated and copied to public/stl/ successfully.")

if __name__ == "__main__":
    main()

