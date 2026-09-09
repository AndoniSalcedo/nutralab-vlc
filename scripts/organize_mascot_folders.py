#!/usr/bin/env python3
import os
import shutil

PROJECT_ROOT = '/Users/andonisalcedo/Projects/nutralab/nutralab-vlc'
FRAMES_DIR = os.path.join(PROJECT_ROOT, 'public/mascot/frames')

STATES = [
    'idle',
    'focus_email',
    'typing',
    'password',
    'loading',
    'success',
    'confused',
    'embarrassed',
]

def main():
    print("=== ORGANIZING MASCOT FRAMES INTO STATE FOLDERS ===")
    
    # 1. Create subfolder for each state
    for state in STATES:
        state_dir = os.path.join(FRAMES_DIR, state)
        os.makedirs(state_dir, exist_ok=True)
    
    # 2. Find and move/copy files into their respective state folder
    for fname in os.listdir(FRAMES_DIR):
        src_path = os.path.join(FRAMES_DIR, fname)
        if os.path.isdir(src_path):
            continue
            
        if not fname.endswith('.png'):
            continue
            
        # Match state
        matched_state = None
        for state in STATES:
            if fname.startswith(f'{state}_'):
                matched_state = state
                break
                
        if matched_state:
            # We can simplify name inside state folder or keep descriptive
            # e.g., 'frame_1.png', 'frame_1_flipped.png', 'frame_1_5.png'
            clean_name = fname.replace(f'{matched_state}_', '')
            dst_path = os.path.join(FRAMES_DIR, matched_state, clean_name)
            shutil.copy2(src_path, dst_path)
            print(f"[{matched_state}] {fname} -> {matched_state}/{clean_name}")
            
    print("\nSummary of files per state folder:")
    for state in STATES:
        state_dir = os.path.join(FRAMES_DIR, state)
        files = sorted(os.listdir(state_dir))
        print(f"  {state}/: {len(files)} files ({', '.join(files[:6])}...)")

if __name__ == '__main__':
    main()
