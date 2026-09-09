#!/usr/bin/env python3
import os
from PIL import Image

PROJECT_ROOT = '/Users/andonisalcedo/Projects/nutralab/nutralab-vlc'
SHEETS_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/sheets')
OUTPUT_DIR = '/Users/andonisalcedo/.gemini/antigravity-ide/brain/cc790cba-d2e6-4d86-92ee-7f54161a37e4'

def main():
    im03 = Image.open(os.path.join(SHEETS_DIR, '03_typing_sheet.jpg')).convert('RGB')
    im35 = Image.open(os.path.join(SHEETS_DIR, 'image_3.5.png')).convert('RGB')
    im36 = Image.open(os.path.join(SHEETS_DIR, 'image_3.6.png')).convert('RGB')
    
    col_w = im03.width // 4
    H = im03.height
    
    # Let's create comparisons per pose:
    # Pose i: [03_col_i, 35_col_i, 36_col_i]
    # or [03_col_i, 36_col_i, 35_col_i]?
    comp = Image.new('RGB', (col_w * 3, H * 4), (255, 255, 255))
    
    for i in range(4):
        c03 = im03.crop((i * col_w, 0, (i + 1) * col_w, H))
        c35 = im35.crop((i * col_w, 0, (i + 1) * col_w, H))
        c36 = im36.crop((i * col_w, 0, (i + 1) * col_w, H))
        
        comp.paste(c03, (0, i * H))
        comp.paste(c35, (col_w, i * H))
        comp.paste(c36, (col_w * 2, i * H))
        
    out_path = os.path.join(OUTPUT_DIR, 'typing_poses_comparison.jpg')
    comp.save(out_path, 'JPEG', quality=85)
    print(f"Saved to {out_path}")

if __name__ == '__main__':
    main()
