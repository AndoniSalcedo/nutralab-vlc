#!/usr/bin/env python3
import os
from PIL import Image

PROJECT_ROOT = '/Users/andonisalcedo/Projects/nutralab/nutralab-vlc'
SHEETS_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/sheets')
OUTPUT_DIR = '/Users/andonisalcedo/.gemini/antigravity-ide/brain/cc790cba-d2e6-4d86-92ee-7f54161a37e4'

def main():
    im04 = Image.open(os.path.join(SHEETS_DIR, '04_password_sheet.jpg')).convert('RGB')
    im4 = Image.open(os.path.join(SHEETS_DIR, 'image_4.png')).convert('RGB')
    im6 = Image.open(os.path.join(SHEETS_DIR, 'image_6.png')).convert('RGB')
    
    col_w = im04.width // 4
    H = im04.height
    
    comp = Image.new('RGB', (col_w * 3, H * 4), (255, 255, 255))
    
    for i in range(4):
        c04 = im04.crop((i * col_w, 0, (i + 1) * col_w, H))
        c4 = im4.crop((i * col_w, 0, (i + 1) * col_w, H))
        c6 = im6.crop((i * col_w, 0, (i + 1) * col_w, H))
        
        comp.paste(c04, (0, i * H))
        comp.paste(c4, (col_w, i * H))
        comp.paste(c6, (col_w * 2, i * H))
        
    out_path = os.path.join(OUTPUT_DIR, 'password_poses_comparison.jpg')
    comp.save(out_path, 'JPEG', quality=85)
    print(f"Saved to {out_path}")

if __name__ == '__main__':
    main()
