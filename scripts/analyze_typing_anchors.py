#!/usr/bin/env python3
import os
import numpy as np
from PIL import Image

PROJECT_ROOT = '/Users/andonisalcedo/Projects/nutralab/nutralab-vlc'
TYPING_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/frames/typing')

def analyze_seed_and_feet(img_path):
    im = Image.open(img_path).convert('RGBA')
    arr = np.array(im)
    alpha = arr[:, :, 3]
    
    # Feet are near the bottom (y between 410 and 448)
    feet_mask = (alpha > 40) & (np.arange(512)[:, None] >= 425) & (np.arange(512)[:, None] <= 448)
    f_ys, f_xs = np.where(feet_mask)
    feet_center_x = f_xs.mean() if len(f_xs) > 0 else 256.0
    
    # Seed is dark brown: R in [60..150], G in [40..110], B in [20..70], in central area
    seed_mask = (
        (alpha > 100) &
        (arr[:, :, 0] > 60) & (arr[:, :, 0] < 150) &
        (arr[:, :, 1] > 40) & (arr[:, :, 1] < 110) &
        (arr[:, :, 2] < 70) &
        (np.arange(512)[:, None] >= 240) & (np.arange(512)[:, None] <= 370) &
        (np.arange(512)[None, :] >= 180) & (np.arange(512)[None, :] <= 330)
    )
    s_ys, s_xs = np.where(seed_mask)
    seed_center_x = s_xs.mean() if len(s_xs) > 0 else 256.0
    seed_center_y = s_ys.mean() if len(s_ys) > 0 else 300.0
    
    # Bottom-most y with alpha > 40
    all_ys, all_xs = np.where(alpha > 40)
    ground_y = all_ys.max() if len(all_ys) > 0 else 448
    
    return feet_center_x, seed_center_x, seed_center_y, ground_y

def main():
    print("Analyzing typing frames anchors...")
    frames = [
        'frame_1.png', 'frame_1_5.png', 'frame_2.png', 'frame_2_5.png',
        'frame_3.png', 'frame_3_5.png', 'frame_4.png', 'frame_4_5.png',
        'frame_1_flipped.png', 'frame_1_5_flipped.png', 'frame_2_flipped.png', 'frame_2_5_flipped.png',
        'frame_3_flipped.png', 'frame_3_5_flipped.png', 'frame_4_flipped.png', 'frame_4_5_flipped.png'
    ]
    for f in frames:
        p = os.path.join(TYPING_DIR, f)
        if os.path.exists(p):
            fc_x, sc_x, sc_y, gy = analyze_seed_and_feet(p)
            print(f"{f:22s}: FeetCenter={fc_x:5.1f}, SeedCenter=({sc_x:5.1f}, {sc_y:5.1f}), GroundY={gy:3d}")

if __name__ == '__main__':
    main()
