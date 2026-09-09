#!/usr/bin/env python3
import os
import numpy as np
from PIL import Image

PROJECT_ROOT = '/Users/andonisalcedo/Projects/nutralab/nutralab-vlc'
SHEETS_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/sheets')
OUTPUT_DIR = '/Users/andonisalcedo/.gemini/antigravity-ide/brain/cc790cba-d2e6-4d86-92ee-7f54161a37e4'

TARGET_SIZE = 512
TARGET_GROUND_Y = 447
TARGET_FEET_X = 256.0

def extract_col(im, col_idx, total_cols=4):
    col_w = im.width // total_cols
    crop = im.crop((col_idx * col_w, 0, (col_idx + 1) * col_w, im.height))
    arr = np.array(crop, dtype=float)
    
    # Background from corners
    border_pixels = np.concatenate([
        arr[:20, :].reshape(-1, 3),
        arr[-20:, :].reshape(-1, 3),
        arr[:, :10].reshape(-1, 3),
        arr[:, -10:].reshape(-1, 3)
    ], axis=0)
    bg = np.median(border_pixels, axis=0)
    dist = np.sqrt(np.sum((arr - bg)**2, axis=2))
    
    # Threshold for avocado
    fg_mask = dist > 22
    
    # Connected component around center
    H, W = fg_mask.shape
    visited = np.zeros((H, W), dtype=bool)
    from collections import deque
    
    # Seed near center
    cy, cx = H // 2, W // 2
    char_mask = np.zeros((H, W), dtype=bool)
    
    # Find active pixel near center
    ys, xs = np.where(fg_mask)
    if len(ys) == 0:
        return Image.new('RGBA', (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
        
    dists_to_c = (ys - cy)**2 + (xs - cx)**2
    best_idx = np.argmin(dists_to_c)
    sy, sx = ys[best_idx], xs[best_idx]
    
    queue = deque([(sy, sx)])
    char_mask[sy, sx] = True
    visited[sy, sx] = True
    
    while queue:
        y, x = queue.popleft()
        for dy, dx in [(-1,0), (1,0), (0,-1), (0,1), (-1,-1), (-1,1), (1,-1), (1,1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W:
                if not visited[ny, nx] and fg_mask[ny, nx]:
                    visited[ny, nx] = True
                    char_mask[ny, nx] = True
                    queue.append((ny, nx))
                    
    # Smooth alpha near edges
    alpha = np.zeros((H, W), dtype=np.uint8)
    alpha[char_mask] = 255
    edge = (dist > 14) & (dist <= 22) & char_mask
    alpha[edge] = np.clip((dist[edge] - 14) / 8.0 * 255, 0, 255).astype(np.uint8)
    
    rgba = np.zeros((H, W, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.clip(arr, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = alpha
    
    # Crop to bounding box
    m_ys, m_xs = np.where(alpha > 30)
    if len(m_ys) == 0:
        return Image.new('RGBA', (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
        
    char_crop = rgba[m_ys.min():m_ys.max()+1, m_xs.min():m_xs.max()+1]
    char_im = Image.fromarray(char_crop, 'RGBA')
    
    # Scale to standard height ~356
    scale = 356.0 / char_im.height
    new_w = max(1, int(round(char_im.width * scale)))
    new_h = 356
    char_scaled = char_im.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Place on 512x512 canvas
    canvas = Image.new('RGBA', (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
    paste_x = (TARGET_SIZE - new_w) // 2
    paste_y = TARGET_GROUND_Y - new_h
    canvas.paste(char_scaled, (paste_x, paste_y), char_scaled)
    
    # Perfect alignment on feet
    c_arr = np.array(canvas)
    c_alpha = c_arr[:, :, 3]
    c_ys, c_xs = np.where(c_alpha > 30)
    ground_y = c_ys.max()
    
    # bottom 25px for feet center
    f_mask = (c_alpha > 30) & (np.arange(TARGET_SIZE)[:, None] >= ground_y - 25) & (np.arange(TARGET_SIZE)[:, None] <= ground_y)
    f_ys, f_xs = np.where(f_mask)
    feet_center_x = f_xs.mean() if len(f_xs) > 0 else 256.0
    
    dx = int(round(TARGET_FEET_X - feet_center_x))
    dy = int(round(TARGET_GROUND_Y - ground_y))
    
    # Shift
    if dx != 0 or dy != 0:
        shifted = np.zeros_like(c_arr)
        src_y1 = max(0, -dy)
        src_y2 = min(TARGET_SIZE, TARGET_SIZE - dy)
        dst_y1 = max(0, dy)
        dst_y2 = min(TARGET_SIZE, TARGET_SIZE + dy)
        src_x1 = max(0, -dx)
        src_x2 = min(TARGET_SIZE, TARGET_SIZE - dx)
        dst_x1 = max(0, dx)
        dst_x2 = min(TARGET_SIZE, TARGET_SIZE + dx)
        if dst_y2 > dst_y1 and dst_x2 > dst_x1:
            shifted[dst_y1:dst_y2, dst_x1:dst_x2] = c_arr[src_y1:src_y2, src_x1:src_x2]
        canvas = Image.fromarray(shifted, 'RGBA')
        
    return canvas

def main():
    im03 = Image.open(os.path.join(SHEETS_DIR, '03_typing_sheet.jpg')).convert('RGB')
    im35 = Image.open(os.path.join(SHEETS_DIR, 'image_3.5.png')).convert('RGB')
    im36 = Image.open(os.path.join(SHEETS_DIR, 'image_3.6.png')).convert('RGB')
    
    # Extract 4 from each
    f_03 = [extract_col(im03, i) for i in range(4)]
    f_35 = [extract_col(im35, i) for i in range(4)]
    f_36 = [extract_col(im36, i) for i in range(4)]
    
    # Flipped versions (for typing)
    ff_03 = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in f_03]
    ff_35 = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in f_35]
    ff_36 = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in f_36]
    
    print("Extracted all 12 frames cleanly!")
    
    # Order A: 03_i -> 35_i -> 36_i (for i in 0..3)
    order_a = []
    for i in range(4):
        order_a.append(ff_03[i])
        order_a.append(ff_35[i])
        order_a.append(ff_36[i])
        
    # Order B: 03_i -> 36_i -> 35_i (for i in 0..3)
    order_b = []
    for i in range(4):
        order_b.append(ff_03[i])
        order_b.append(ff_36[i])
        order_b.append(ff_35[i])
        
    # Save GIFs with solid background to inspect animation smoothness
    def save_gif(frames, path, duration=150):
        bg_frames = []
        for f in frames:
            bg = Image.new('RGBA', (TARGET_SIZE, TARGET_SIZE), (250, 248, 245, 255))
            bg.paste(f, (0, 0), f)
            bg_frames.append(bg.convert('RGB'))
        bg_frames[0].save(path, save_all=True, append_images=bg_frames[1:], duration=duration, loop=0)
        print(f"Saved GIF: {path}")
        
    save_gif(order_a, os.path.join(OUTPUT_DIR, 'test_typing_order_35_then_36.gif'))
    save_gif(order_b, os.path.join(OUTPUT_DIR, 'test_typing_order_36_then_35.gif'))

if __name__ == '__main__':
    main()
