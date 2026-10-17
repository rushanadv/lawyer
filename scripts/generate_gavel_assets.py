#!/usr/bin/env python3
"""
scripts/generate_gavel_assets.py
LEX VERA — Precision STL Generator for Judge's Gavel & Sound Block
"""

import sys
import os

# Delegate directly to root generate_gavel_stl.py
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, root_dir)
import generate_gavel_stl

if __name__ == '__main__':
    generate_gavel_stl.main()
