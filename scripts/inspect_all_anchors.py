#!/usr/bin/env python3
import os
import numpy as np
from PIL import Image

PROJECT_ROOT = '/Users/andonisalcedo/Projects/nutralab/nutralab-vlc'
FRAMES_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/frames')

def analyze_feet_and_ground(im):
    arr = np.array(im)
    alpha = arr[:, :, 3]
    
    # Bottom-most y with alpha > 40
    all_ys, all_xs = np.where(alpha > 40)
    if len(all_ys) == 0:
        return 256.0, 448
    ground_y = all_ys.max()
    
    # Feet pixels (bottom 25px of the character)
    feet_mask = (alpha > 40) & (np.arange(512)[:, None] >= ground_y - 25) & (np.arange(512)[:, None] <= ground_y)
    f_ys, f_xs = np.where(feet_mask)
    feet_center_x = f_xs.mean() if len(f_xs) > 0 else 256.0
    
    return feet_center_x, ground_y

def main():
    print("=== INSPECTING IDLE ANCHORS ===")
    idle_dir = os.path.join(FRAMES_DIR, 'idle')
    for f in sorted(os.listdir(idle_dir)):
        if f.endswith('.png'):
            im = Image.open(os.path.join(idle_dir, f))
            fc, gy = analyze_feet_and_ground(im)
            print(f"idle/{f:25s}: FeetCenter={fc:5.1f}, GroundY={gy}")

    print("\n=== INSPECTING TYPING ANCHORS ===")
    typing_dir = os.path.join(FRAMES_DIR, 'typing')
    for f in sorted(os.listdir(typing_dir)):
        if f.endswith('.png'):
            im = Image.open(os.path.join(typing_dir, f))
            fc, gy = analyze_feet_and_ground(im)
            print(f"typing/{f:25s}: FeetCenter={fc:5.1f}, GroundY={gy}")

if __name__ == '__main__':
    main()
