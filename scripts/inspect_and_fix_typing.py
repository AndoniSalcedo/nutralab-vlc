#!/usr/bin/env python3
import os
import numpy as np
from PIL import Image

PROJECT_ROOT = '/Users/andonisalcedo/Projects/nutralab/nutralab-vlc'
TYPING_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/frames/typing')

def main():
    print("=== INSPECTING ALL TYPING FRAMES ===")
    files = [
        'frame_1.png', 'frame_1_5.png', 'frame_2.png', 'frame_2_5.png',
        'frame_3.png', 'frame_3_5.png', 'frame_4.png', 'frame_4_5.png',
        'frame_1_flipped.png', 'frame_1_5_flipped.png', 'frame_2_flipped.png', 'frame_2_5_flipped.png',
        'frame_3_flipped.png', 'frame_3_5_flipped.png', 'frame_4_flipped.png', 'frame_4_5_flipped.png'
    ]
    
    for f in files:
        p = os.path.join(TYPING_DIR, f)
        if not os.path.exists(p):
            print(f"MISSING: {f}")
            continue
            
        im = Image.open(p)
        arr = np.array(im)
        alpha = arr[:, :, 3]
        ys, xs = np.where(alpha > 30)
        
        min_y, max_y = ys.min(), ys.max()
        min_x, max_x = xs.min(), xs.max()
        w = max_x - min_x + 1
        h = max_y - min_y + 1
        
        # Body center (excluding hands/arms reaching out)
        # Head/body center of mass (top 70% of character)
        upper_mask = (alpha > 30) & (np.arange(512)[:, None] < min_y + h * 0.65)
        u_ys, u_xs = np.where(upper_mask)
        body_center_x = u_xs.mean()
        overall_center_x = (min_x + max_x) / 2.0
        
        print(f"{f:22s}: W={w:3d}, H={h:3d}, X=[{min_x:3d},{max_x:3d}], BBoxCenter={overall_center_x:5.1f}, BodyCenter={body_center_x:5.1f}, Ground_Y={max_y:3d}")

if __name__ == '__main__':
    main()
