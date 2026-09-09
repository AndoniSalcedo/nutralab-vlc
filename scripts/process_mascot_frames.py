#!/usr/bin/env python3
import os
from collections import deque
import numpy as np
from PIL import Image

PROJECT_ROOT = '/Users/andonisalcedo/Projects/nutralab/nutralab-vlc'
SHEETS_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/sheets')
FRAMES_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/frames')

TARGET_SIZE = 512
TARGET_HEIGHT = 356
TARGET_GROUND_Y = 447
TARGET_CENTER_X = 256

def extract_character_column(im, col_idx, total_cols=4):
    """
    Extracts a column cleanly, performs connected-component foreground extraction,
    normalizes dimensions to standard height 356px, centered horizontally at 256,
    and ground aligned at Y=447.
    """
    col_w = im.width // total_cols
    col_slice = im.crop((col_idx * col_w, 0, (col_idx + 1) * col_w, im.height))
    arr = np.array(col_slice, dtype=float)
    
    # Sample background color from borders
    border_pixels = np.concatenate([
        arr[:20, :].reshape(-1, 3),
        arr[-20:, :].reshape(-1, 3),
        arr[:, :10].reshape(-1, 3),
        arr[:, -10:].reshape(-1, 3)
    ], axis=0)
    bg = np.median(border_pixels, axis=0)
    
    # Euclidean color distance
    dist = np.sqrt(np.sum((arr - bg)**2, axis=2))
    
    # Character mask: diff > 22
    H, W = arr.shape[:2]
    raw_mask = dist > 22
    
    # Seed BFS from center of character
    cy_seed, cx_seed = int(H * 0.45), int(W * 0.5)
    if not raw_mask[cy_seed, cx_seed]:
        sub = dist[int(H * 0.3):int(H * 0.7), int(W * 0.2):int(W * 0.8)]
        max_pos = np.unravel_index(np.argmax(sub), sub.shape)
        cy_seed = max_pos[0] + int(H * 0.3)
        cx_seed = max_pos[1] + int(W * 0.2)
        
    visited = np.zeros((H, W), dtype=bool)
    q = deque([(cy_seed, cx_seed)])
    visited[cy_seed, cx_seed] = True
    
    while q:
        cy, cx = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < H and 0 <= nx < W and not visited[ny, nx] and raw_mask[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
                
    # Smooth antialiased alpha on visited component
    alpha = np.zeros((H, W), dtype=np.uint8)
    alpha_ramp = np.clip((dist - 10.0) / 16.0, 0.0, 1.0) * 255.0
    alpha[visited] = alpha_ramp[visited].astype(np.uint8)
    
    # Bounding box of character
    ys, xs = np.where(alpha > 20)
    if len(xs) == 0:
        raise ValueError(f"No character found in column {col_idx}")
        
    min_y, max_y = ys.min(), ys.max()
    min_x, max_x = xs.min(), xs.max()
    w = max_x - min_x + 1
    h = max_y - min_y + 1
    
    rgba = np.dstack([arr.astype(np.uint8), alpha])
    char_crop = Image.fromarray(rgba).crop((min_x, min_y, max_x + 1, max_y + 1))
    
    # Scale to standard height 356px
    scale = TARGET_HEIGHT / float(h)
    new_w = int(round(w * scale))
    new_h = TARGET_HEIGHT
    resized = char_crop.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Center in 512x512 canvas with baseline at Y=447
    canvas = Image.new('RGBA', (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
    paste_x = TARGET_CENTER_X - new_w // 2
    paste_y = TARGET_GROUND_Y - new_h
    canvas.paste(resized, (paste_x, paste_y), resized)
    
    return canvas

def main():
    os.makedirs(FRAMES_DIR, exist_ok=True)
    
    print("=== 1. PROCESSING IDLE INTERMEDIATE FRAMES (image_1.png) ===")
    img1_path = os.path.join(SHEETS_DIR, 'image_1.png')
    im1 = Image.open(img1_path).convert('RGB')
    
    idle_inbetweens = ['idle_frame_1_5', 'idle_frame_2_5', 'idle_frame_3_5', 'idle_frame_4_5']
    for i, name in enumerate(idle_inbetweens):
        frame = extract_character_column(im1, i, 4)
        frame_path = os.path.join(FRAMES_DIR, f'{name}.png')
        flipped_path = os.path.join(FRAMES_DIR, f'{name}_flipped.png')
        
        frame.save(frame_path, 'PNG')
        flipped = frame.transpose(Image.FLIP_LEFT_RIGHT)
        flipped.save(flipped_path, 'PNG')
        
        arr = np.array(frame)
        ys, xs = np.where(arr[:, :, 3] > 20)
        print(f"Saved {name}.png and _flipped.png (W={xs.max()-xs.min()+1}, H={ys.max()-ys.min()+1}, X=[{xs.min()},{xs.max()}], Y=[{ys.min()},{ys.max()}])")

    print("\n=== 2. PROCESSING TYPING INTERMEDIATE FRAMES ===")
    # Check image_3.5.png and image_3.6.png
    im35_path = os.path.join(SHEETS_DIR, 'image_3.5.png')
    im36_path = os.path.join(SHEETS_DIR, 'image_3.6.png')
    
    if os.path.exists(im35_path):
        im35 = Image.open(im35_path).convert('RGB')
        # Extract 4 columns from image_3.5 as typing_frame_1_5, 2_5, 3_5, 4_5
        typing_inbetweens_35 = ['typing_frame_1_5', 'typing_frame_2_5', 'typing_frame_3_5', 'typing_frame_4_5']
        for i, name in enumerate(typing_inbetweens_35):
            frame = extract_character_column(im35, i, 4)
            frame_path = os.path.join(FRAMES_DIR, f'{name}.png')
            flipped_path = os.path.join(FRAMES_DIR, f'{name}_flipped.png')
            frame.save(frame_path, 'PNG')
            flipped = frame.transpose(Image.FLIP_LEFT_RIGHT)
            flipped.save(flipped_path, 'PNG')
            arr = np.array(frame)
            ys, xs = np.where(arr[:, :, 3] > 20)
            print(f"Saved {name}.png and _flipped.png (W={xs.max()-xs.min()+1}, H={ys.max()-ys.min()+1}, X=[{xs.min()},{xs.max()}], Y=[{ys.min()},{ys.max()}])")
            
    if os.path.exists(im36_path):
        im36 = Image.open(im36_path).convert('RGB')
        # Also extract 3.6 variants
        typing_inbetweens_36 = ['typing_frame_1_6', 'typing_frame_2_6', 'typing_frame_3_6', 'typing_frame_4_6']
        for i, name in enumerate(typing_inbetweens_36):
            frame = extract_character_column(im36, i, 4)
            frame_path = os.path.join(FRAMES_DIR, f'{name}.png')
            flipped_path = os.path.join(FRAMES_DIR, f'{name}_flipped.png')
            frame.save(frame_path, 'PNG')
            flipped = frame.transpose(Image.FLIP_LEFT_RIGHT)
            flipped.save(flipped_path, 'PNG')
            arr = np.array(frame)
            ys, xs = np.where(arr[:, :, 3] > 20)
            print(f"Saved {name}.png and _flipped.png (W={xs.max()-xs.min()+1}, H={ys.max()-ys.min()+1}, X=[{xs.min()},{xs.max()}], Y=[{ys.min()},{ys.max()}])")

    print("\nDone! All frames extracted, normalized and saved.")

if __name__ == '__main__':
    main()
