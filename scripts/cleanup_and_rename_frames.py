#!/usr/bin/env python3
import os
import shutil

PROJECT_ROOT = '/Users/andonisalcedo/Projects/nutralab/nutralab-vlc'
FRAMES_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/frames')
TYPING_DIR = os.path.join(FRAMES_DIR, 'typing')

def main():
    print("=== 1. REMOVING ROOT FRAME FILES FROM public/mascot/frames ===")
    for item in os.listdir(FRAMES_DIR):
        p = os.path.join(FRAMES_DIR, item)
        if os.path.isfile(p) and item.endswith('.png'):
            os.remove(p)
            print(f"Removed root file: {item}")
            
    print("\n=== 2. RENAMING AND UNIFYING TYPING FRAMES ===")
    # Current typing sequence of flipped frames:
    # 1. frame_1_flipped.png   -> frame_1.png
    # 2. frame_1_5_flipped.png -> frame_2.png
    # 3. frame_2_flipped.png   -> frame_3.png
    # 4. frame_2_5_flipped.png -> frame_4.png
    # 5. frame_3_flipped.png   -> frame_5.png
    # 6. frame_3_5_flipped.png -> frame_6.png
    # 7. frame_4_flipped.png   -> frame_7.png
    # 8. frame_4_5_flipped.png -> frame_8.png
    
    mapping = [
        ('frame_1_flipped.png', 'frame_1.png'),
        ('frame_1_5_flipped.png', 'frame_2.png'),
        ('frame_2_flipped.png', 'frame_3.png'),
        ('frame_2_5_flipped.png', 'frame_4.png'),
        ('frame_3_flipped.png', 'frame_5.png'),
        ('frame_3_5_flipped.png', 'frame_6.png'),
        ('frame_4_flipped.png', 'frame_7.png'),
        ('frame_4_5_flipped.png', 'frame_8.png'),
    ]
    
    # First, copy to temp names to avoid overwrite collisions
    temp_files = []
    for src_name, dst_name in mapping:
        src_path = os.path.join(TYPING_DIR, src_name)
        tmp_path = os.path.join(TYPING_DIR, f"tmp_{dst_name}")
        if os.path.exists(src_path):
            shutil.copy2(src_path, tmp_path)
            temp_files.append((tmp_path, dst_name))
        else:
            print(f"WARNING: {src_name} not found!")
            
    # Delete all previous files in TYPING_DIR
    for item in os.listdir(TYPING_DIR):
        if not item.startswith('tmp_'):
            os.remove(os.path.join(TYPING_DIR, item))
            
    # Rename temp files to final destination names
    for tmp_path, dst_name in temp_files:
        final_path = os.path.join(TYPING_DIR, dst_name)
        os.rename(tmp_path, final_path)
        print(f"Typing: created {dst_name}")

    print("\nResult in typing directory:")
    for f in sorted(os.listdir(TYPING_DIR)):
        print(f"  typing/{f}")

if __name__ == '__main__':
    main()
