#!/usr/bin/env python3
import os
from PIL import Image

PROJECT_ROOT = '/Users/andonisalcedo/Projects/nutralab/nutralab-vlc'
SHEETS_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/sheets')
OUTPUT_DIR = '/Users/andonisalcedo/.gemini/antigravity-ide/brain/cc790cba-d2e6-4d86-92ee-7f54161a37e4'

def main():
    sheets = [
        ('04_password_sheet.jpg', '04_orig'),
        ('image_4.png', 'im4'),
        ('image_6.png', 'im6'),
    ]
    
    crops = []
    for sheet_name, prefix in sheets:
        im = Image.open(os.path.join(SHEETS_DIR, sheet_name)).convert('RGB')
        col_w = im.width // 4
        for i in range(4):
            crop = im.crop((i * col_w, 0, (i + 1) * col_w, im.height))
            crops.append((f"{prefix}_col{i+1}", crop))
            
    cw = crops[0][1].width
    ch = crops[0][1].height
    montage = Image.new('RGB', (cw * 4, ch * 3), (255, 255, 255))
    
    for idx, (label, crop) in enumerate(crops):
        row = idx // 4
        col = idx % 4
        montage.paste(crop, (col * cw, row * ch))
        
    montage_path = os.path.join(OUTPUT_DIR, 'password_12_raw_montage.jpg')
    montage.save(montage_path, 'JPEG', quality=85)
    print(f"Saved montage to {montage_path}")

if __name__ == '__main__':
    main()
