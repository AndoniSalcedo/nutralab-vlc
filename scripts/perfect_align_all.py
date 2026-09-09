#!/usr/bin/env python3
import os
import numpy as np
from PIL import Image

PROJECT_ROOT = '/Users/andonisalcedo/Projects/nutralab/nutralab-vlc'
FRAMES_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/frames')

TARGET_GROUND_Y = 447
TARGET_FEET_X = 255.0

def analyze_feet_and_ground(arr):
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 30)
    if len(ys) == 0:
        return 255.0, 447
    
    ground_y = ys.max()
    # Feet are the bottom 25px
    feet_mask = (alpha > 30) & (np.arange(512)[:, None] >= ground_y - 25) & (np.arange(512)[:, None] <= ground_y)
    f_ys, f_xs = np.where(feet_mask)
    feet_center_x = f_xs.mean() if len(f_xs) > 0 else 255.0
    
    return feet_center_x, ground_y

def shift_image(im, dx, dy):
    """Shifts an RGBA image by integer pixel offsets (dx, dy)."""
    dx = int(round(dx))
    dy = int(round(dy))
    if dx == 0 and dy == 0:
        return im
        
    arr = np.array(im)
    shifted = np.zeros_like(arr)
    
    H, W = arr.shape[:2]
    
    src_y1 = max(0, -dy)
    src_y2 = min(H, H - dy)
    dst_y1 = max(0, dy)
    dst_y2 = min(H, H + dy)
    
    src_x1 = max(0, -dx)
    src_x2 = min(W, W - dx)
    dst_x1 = max(0, dx)
    dst_x2 = min(W, W + dx)
    
    if dst_y2 > dst_y1 and dst_x2 > dst_x1:
        shifted[dst_y1:dst_y2, dst_x1:dst_x2] = arr[src_y1:src_y2, src_x1:src_x2]
        
    return Image.fromarray(shifted, 'RGBA')

def align_state_frames(state_name, align_feet=True):
    print(f"\n=== ALIGNING {state_name.upper()} FRAMES ===")
    state_dir = os.path.join(FRAMES_DIR, state_name)
    
    # Process only base frames first (not _flipped)
    base_files = [
        f for f in sorted(os.listdir(state_dir))
        if f.endswith('.png') and not f.endswith('_flipped.png')
    ]
    
    for fname in base_files:
        fpath = os.path.join(state_dir, fname)
        im = Image.open(fpath).convert('RGBA')
        arr = np.array(im)
        
        fc_x, gy = analyze_feet_and_ground(arr)
        
        dy = TARGET_GROUND_Y - gy
        if align_feet:
            dx = TARGET_FEET_X - fc_x
        else:
            dx = 0
            
        aligned_im = shift_image(im, dx, dy)
        aligned_im.save(fpath, 'PNG')
        
        # Regenerate flipped version
        flipped_im = aligned_im.transpose(Image.FLIP_LEFT_RIGHT)
        flipped_fname = fname.replace('.png', '_flipped.png')
        flipped_path = os.path.join(state_dir, flipped_fname)
        flipped_im.save(flipped_path, 'PNG')
        
        # Check resulting coordinates
        arr_aligned = np.array(aligned_im)
        new_fc, new_gy = analyze_feet_and_ground(arr_aligned)
        arr_flip = np.array(flipped_im)
        flip_fc, flip_gy = analyze_feet_and_ground(arr_flip)
        
        print(f"  {fname:18s} -> shifted ({dx:+3.0f}, {dy:+2d}) | Base Feet: {new_fc:5.1f}, Gy: {new_gy} | Flipped Feet: {flip_fc:5.1f}, Gy: {flip_gy}")

def main():
    # Typing needs precise feet centering because hands extend to one side
    align_state_frames('typing', align_feet=True)
    
    # Idle only needs ground level alignment to 447 (preserves gentle natural breathing sway)
    align_state_frames('idle', align_feet=False)

    print("\nAll frames perfectly aligned!")

if __name__ == '__main__':
    main()
