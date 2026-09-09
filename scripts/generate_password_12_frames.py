#!/usr/bin/env python3
import os
import sys
from PIL import Image

PROJECT_ROOT = '/Users/andonisalcedo/Projects/nutralab/nutralab-vlc'
sys.path.insert(0, PROJECT_ROOT)

from scripts.test_typing_12 import extract_col

SHEETS_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/sheets')
PASSWORD_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/frames/password')

def main():
    print("=== EXTRACTING AND ALIGNING 12 PASSWORD FRAMES ===")
    im04 = Image.open(os.path.join(SHEETS_DIR, '04_password_sheet.jpg')).convert('RGB')
    im4 = Image.open(os.path.join(SHEETS_DIR, 'image_4.png')).convert('RGB')
    im6 = Image.open(os.path.join(SHEETS_DIR, 'image_6.png')).convert('RGB')

    f04 = [extract_col(im04, i) for i in range(4)]
    f4 = [extract_col(im4, i) for i in range(4)]
    f6 = [extract_col(im6, i) for i in range(4)]

    # Interleaved sequence: Pose i (04) -> Pose i (image_4) -> Pose i (image_6)
    sequence = []
    for i in range(4):
        sequence.append(f04[i])
        sequence.append(f4[i])
        sequence.append(f6[i])

    # Clean previous files in PASSWORD_DIR
    for item in os.listdir(PASSWORD_DIR):
        p = os.path.join(PASSWORD_DIR, item)
        if os.path.isfile(p):
            os.remove(p)

    # Save frame_1.png .. frame_12.png and their flipped versions
    for idx, frame in enumerate(sequence):
        num = idx + 1
        fn_normal = f"frame_{num}.png"
        fn_flipped = f"frame_{num}_flipped.png"
        
        frame.save(os.path.join(PASSWORD_DIR, fn_normal), 'PNG')
        flipped = frame.transpose(Image.FLIP_LEFT_RIGHT)
        flipped.save(os.path.join(PASSWORD_DIR, fn_flipped), 'PNG')
        print(f"Saved {fn_normal} and {fn_flipped}")

    print("\nFiles currently in public/mascot/frames/password/:")
    for f in sorted(os.listdir(PASSWORD_DIR), key=lambda x: int(x.split('_')[1].split('.')[0])):
        print(f"  password/{f}")

if __name__ == '__main__':
    main()
