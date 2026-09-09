#!/usr/bin/env python3
import os
import shutil
import numpy as np
from PIL import Image

PROJECT_ROOT = '/Users/andonisalcedo/Projects/nutralab/nutralab-vlc'
SHEETS_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/sheets')
TYPING_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/frames/typing')

import sys
sys.path.insert(0, PROJECT_ROOT)
from scripts.test_typing_12 import extract_col

def main():
    print("=== EXTRACTING AND ALIGNING 12 TYPING FRAMES ===")
    im03 = Image.open(os.path.join(SHEETS_DIR, '03_typing_sheet.jpg')).convert('RGB')
    im35 = Image.open(os.path.join(SHEETS_DIR, 'image_3.5.png')).convert('RGB')
    im36 = Image.open(os.path.join(SHEETS_DIR, 'image_3.6.png')).convert('RGB')

    f03 = [extract_col(im03, i).transpose(Image.FLIP_LEFT_RIGHT) for i in range(4)]
    f35 = [extract_col(im35, i).transpose(Image.FLIP_LEFT_RIGHT) for i in range(4)]
    f36 = [extract_col(im36, i).transpose(Image.FLIP_LEFT_RIGHT) for i in range(4)]

    # Interleaved sequence of 12 frames
    sequence = []
    for i in range(4):
        sequence.append(f03[i])
        sequence.append(f35[i])
        sequence.append(f36[i])

    # Clean TYPING_DIR
    for item in os.listdir(TYPING_DIR):
        p = os.path.join(TYPING_DIR, item)
        if os.path.isfile(p):
            os.remove(p)

    # Save frame_1.png through frame_12.png
    for idx, frame in enumerate(sequence):
        filename = f"frame_{idx + 1}.png"
        filepath = os.path.join(TYPING_DIR, filename)
        frame.save(filepath, 'PNG')
        print(f"Saved {filepath}")

    print("\nFiles currently in public/mascot/frames/typing/:")
    for f in sorted(os.listdir(TYPING_DIR), key=lambda x: int(x.split('_')[1].split('.')[0]) if '_' in x and x.split('_')[1].split('.')[0].isdigit() else 999):
        print(f"  typing/{f}")

if __name__ == '__main__':
    main()
