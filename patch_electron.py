#!/usr/bin/env python3
"""
Binary patch for Electron to fix 'aim freeze' bug (Chromium issue 1455739).

When --disable-frame-rate-limit is used, holding left mouse button causes
the Blink scheduler to starve IPC messages (websockets, workers) by
over-prioritizing input events during gestures.

This patch makes ShouldPrioritizeInputEvent() effectively return false
in both DidHandleInputEventOnCompositorThread and
DidHandleInputEventOnMainThread. The function is inlined by the compiler
into both callers, so both must be patched separately.

Usage: python3 patch_electron.py <electron_binary>
"""

import struct
import sys
import shutil
import os


def parse_elf_text_offset(data):
    """Get VA-to-file-offset difference for .text section."""
    if data[:4] != b'\x7fELF':
        die("Not an ELF binary")
    e_shoff = struct.unpack_from('<Q', data, 0x28)[0]
    e_shentsize = struct.unpack_from('<H', data, 0x3a)[0]
    e_shnum = struct.unpack_from('<H', data, 0x3c)[0]
    e_shstrndx = struct.unpack_from('<H', data, 0x3e)[0]
    str_sh_off = struct.unpack_from('<Q', data, e_shoff + e_shstrndx * e_shentsize + 0x18)[0]
    for i in range(e_shnum):
        sh = e_shoff + i * e_shentsize
        name_idx = struct.unpack_from('<I', data, sh)[0]
        name_end = data.find(b'\x00', str_sh_off + name_idx)
        name = data[str_sh_off + name_idx:name_end]
        if name == b'.text':
            sh_addr = struct.unpack_from('<Q', data, sh + 0x10)[0]
            sh_off = struct.unpack_from('<Q', data, sh + 0x18)[0]
            return sh_addr - sh_off
    die("Could not find .text section")


def find_string(data, string):
    """Find a string in the binary. Returns file offset (== VA for .rodata)."""
    offset = data.find(string)
    if offset == -1:
        return None
    return offset


def find_lea_refs(data, target_va, va_offset):
    """Find LEA reg,[rip+disp32] instructions referencing target_va."""
    prefixes = (
        [bytes([0x48, 0x8d, r]) for r in (0x05, 0x0d, 0x15, 0x1d, 0x25, 0x2d, 0x35, 0x3d)] +
        [bytes([0x4c, 0x8d, r]) for r in (0x05, 0x0d, 0x15, 0x1d, 0x25, 0x2d, 0x35, 0x3d)]
    )
    results = []
    for prefix in prefixes:
        pos = 0
        while True:
            idx = data.find(prefix, pos)
            if idx == -1:
                break
            va = idx + va_offset
            disp = struct.unpack_from('<i', data, idx + 3)[0]
            if va + 7 + disp == target_va:
                results.append((idx, va))
            pos = idx + 1
    return results


def find_func_start(data, from_offset):
    """Scan backwards for function prologue (push rbp; mov rbp, rsp) preceded by int3."""
    for i in range(from_offset, max(from_offset - 0x1000, 0), -1):
        if data[i:i + 4] == b'\x55\x48\x89\xe5' and i > 0 and data[i - 1] == 0xcc:
            return i
    return None


def va(file_offset, va_offset):
    return file_offset + va_offset


def die(msg):
    print(f"ERROR: {msg}")
    sys.exit(1)


def find_call_to(data, func_start, func_max_size, target_va, va_offset):
    """Find a CALL instruction within a function that calls target_va."""
    for i in range(func_start, func_start + func_max_size):
        if data[i] == 0xe8:
            disp = struct.unpack_from('<i', data, i + 1)[0]
            call_target = va(i, va_offset) + 5 + disp
            if call_target == target_va:
                return i
    return None


def find_pattern_in_range(data, pattern, start, end):
    """Find a byte pattern within a range."""
    idx = data.find(pattern, start, end)
    return idx if idx != -1 else None


def patch_compositor_handler(data, va_offset):
    """
    Patch DidHandleInputEventOnCompositorThread:
    NOP the call to UpdateForInputEventOnCompositorThread.
    """
    print("\n=== Patching DidHandleInputEventOnCompositorThread ===")

    # Find UpdateForInputEventOnCompositorThread via its trace string
    update_str = find_string(data, b"MainThreadSchedulerImpl::UpdateForInputEventOnCompositorThread\x00")
    if update_str is None:
        # Try without null terminator
        update_str = find_string(data, b"MainThreadSchedulerImpl::UpdateForInputEventOnCompositorThread")
    if update_str is None:
        die("Could not find UpdateForInputEventOnCompositorThread string")
    print(f"  UpdateForInput string at 0x{update_str:x}")

    # Find the function containing this string reference
    refs = find_lea_refs(data, update_str, va_offset)
    if not refs:
        die("Could not find code reference to UpdateForInput string")
    update_func = find_func_start(data, refs[0][0])
    if update_func is None:
        die("Could not find UpdateForInput function prologue")
    update_func_va = va(update_func, va_offset)
    print(f"  UpdateForInput function at VA 0x{update_func_va:x}")

    # Find DidHandleInputEventOnCompositorThread via its trace string
    did_str = find_string(data, b"MainThreadSchedulerImpl::DidHandleInputEventOnCompositorThread\x00")
    if did_str is None:
        did_str = find_string(data, b"MainThreadSchedulerImpl::DidHandleInputEventOnCompositorThread")
    if did_str is None:
        die("Could not find DidHandleInputEventOnCompositorThread string")

    refs = find_lea_refs(data, did_str, va_offset)
    if not refs:
        die("Could not find code reference to DidHandle string")
    did_func = find_func_start(data, refs[0][0])
    if did_func is None:
        die("Could not find DidHandle function prologue")
    did_func_va = va(did_func, va_offset)
    print(f"  DidHandle function at VA 0x{did_func_va:x}")

    # Find the CALL to UpdateForInputEvent within DidHandle
    call_offset = find_call_to(data, did_func, 0x200, update_func_va, va_offset)
    if call_offset is not None:
        call_va = va(call_offset, va_offset)
        print(f"  CALL at VA 0x{call_va:x}: {data[call_offset:call_offset+5].hex()}")
        data[call_offset:call_offset + 5] = b'\x90' * 5
        print(f"  PATCHED: NOP'd call (e8... → 9090909090)")
    else:
        # Some Electron versions already NOP this call in their build patches.
        # Check if it's already NOP'd (5x 0x90 after arg setup mov rdi/rsi/rdx).
        nop5 = b'\x90\x90\x90\x90\x90'
        if nop5 in data[did_func:did_func + 0x200]:
            print("  Already NOP'd (Electron build patches applied this fix)")

    return did_func_va, update_func_va


def patch_main_thread_handler(data, va_offset):
    """
    Patch DidHandleInputEventOnMainThread:
    Redirect all three branches to the prioritize block so they skip to
    the IsWebInteractionEvent check instead.
    """
    print("\n=== Patching DidHandleInputEventOnMainThread ===")

    # Find the function via its trace string
    main_str = find_string(data, b"MainThreadSchedulerImpl::DidHandleInputEventOnMainThread\x00")
    if main_str is None:
        main_str = find_string(data, b"MainThreadSchedulerImpl::DidHandleInputEventOnMainThread")
    if main_str is None:
        die("Could not find DidHandleInputEventOnMainThread string")

    refs = find_lea_refs(data, main_str, va_offset)
    if not refs:
        die("Could not find code reference to DidHandleInputEventOnMainThread string")
    func_start = find_func_start(data, refs[0][0])
    if func_start is None:
        die("Could not find DidHandleInputEventOnMainThread function prologue")
    func_va = va(func_start, va_offset)
    print(f"  Function at VA 0x{func_va:x}")

    # Find the 0x7ba bitmask within this function — fingerprint of ShouldPrioritizeInputEvent
    bitmask_patterns = [b'\xb9\xba\x07\x00\x00', b'\xb8\xba\x07\x00\x00', b'\xba\xba\x07\x00\x00']
    bitmask_offset = None
    for pat in bitmask_patterns:
        bitmask_offset = find_pattern_in_range(data, pat, func_start, func_start + 0x200)
        if bitmask_offset is not None:
            break
    if bitmask_offset is None:
        die("Could not find 0x7ba bitmask in DidHandleInputEventOnMainThread")

    bitmask_va = va(bitmask_offset, va_offset)
    print(f"  0x7ba bitmask at VA 0x{bitmask_va:x}")

    # Now trace the structure. Working backwards from the bitmask:
    # The pattern is:
    #   CMP eax, 0xa           (83 f8 0a)
    #   JA  prioritize_path    (77 xx)       ← PATCH: redirect to skip_path
    #   MOV ecx/eax, 0x7ba     (b9/b8 ba 07 00 00)
    #   BT  ecx, eax           (0f a3 c1)
    #   JAE more_checks        (73 xx)       ← leads to ShouldPrioritize checks
    #   ...
    #   skip_path: (flag processing + IsWebInteractionEvent)
    #
    # After the bitmask, we have:
    #   BT  ecx, eax
    #   JAE more_checks  (types NOT in bitmask → ShouldPrioritize path)
    #   (fall through → skip_path for types IN bitmask)

    # Find the JA (type > 10) before the bitmask
    # Search backwards from bitmask for: 83 f8 0a (cmp eax, 0xa) followed by 77 xx (ja)
    ja_offset = None
    for i in range(bitmask_offset - 10, bitmask_offset):
        if data[i:i + 3] == b'\x83\xf8\x0a' and data[i + 3] == 0x77:
            ja_offset = i + 3  # the JA instruction
            break
    if ja_offset is None:
        die("Could not find 'cmp eax, 0xa; ja' before bitmask")

    ja_va = va(ja_offset, va_offset)
    ja_target_va = ja_va + 2 + struct.unpack_from('b', data, ja_offset + 1)[0]
    print(f"  JA (type>10) at VA 0x{ja_va:x} → 0x{ja_target_va:x}")

    # The JA target is the PRIORITIZE_PATH.
    prioritize_va = ja_target_va

    # Find the SKIP_PATH: this is where types IN the bitmask fall through to.
    # After: bt ecx, eax; jb skip_path (or jae more_checks)
    # The skip_path is the fall-through destination for bitmask-matched types.
    # Look for the JB/JAE after the BT instruction following the bitmask.
    bt_offset = find_pattern_in_range(data, b'\x0f\xa3\xc1', bitmask_offset + 5, bitmask_offset + 10)
    if bt_offset is None:
        die("Could not find 'bt ecx, eax' after bitmask")

    # After BT, there should be a conditional jump (JB = 72, JAE = 73)
    jcc_after_bt = bt_offset + 3
    jcc_opcode = data[jcc_after_bt]

    if jcc_opcode == 0x72:  # JB skip_path
        skip_rel = struct.unpack_from('b', data, jcc_after_bt + 1)[0]
        skip_va = va(jcc_after_bt, va_offset) + 2 + skip_rel
    elif jcc_opcode == 0x73:  # JAE more_checks (skip_path is fall-through)
        # skip_path is the instruction after the JAE's 2 bytes
        skip_va = va(jcc_after_bt, va_offset) + 2
    else:
        die(f"Unexpected opcode after BT: 0x{jcc_opcode:02x}")

    print(f"  SKIP_PATH (IsWebInteractionEvent) at VA 0x{skip_va:x}")
    print(f"  PRIORITIZE_PATH at VA 0x{prioritize_va:x}")

    # Now find the three branches to patch:
    #
    # 1. JA (type > 10) → currently jumps to PRIORITIZE, redirect to SKIP
    # 2. JAE (catch-all for non-mouse/kbd) → redirect to SKIP
    # 3. JE/fall-through (mouse drag with left button) → make unconditional JMP to SKIP

    # Patch 1: JA at ja_offset → redirect to skip_va
    new_rel = skip_va - (ja_va + 2)
    if -128 <= new_rel <= 127:
        data[ja_offset + 1] = new_rel & 0xff
        print(f"  PATCH 1: JA at 0x{ja_va:x} → 0x{skip_va:x} (offset 0x{new_rel & 0xff:02x})")
    else:
        die(f"JA redirect offset {new_rel} out of range for short jump")

    # Find the ShouldPrioritize-specific checks (bt 5, eax; jae; test left_btn; je)
    # Search for: mov ecx, 5 (b9 05 00 00 00) or similar
    # followed by bt ecx, eax; jae; test byte [reg+xx], 0x40; je
    should_prioritize_start = None
    for pat in [b'\xb9\x05\x00\x00\x00', b'\xb8\x05\x00\x00\x00']:
        should_prioritize_start = find_pattern_in_range(data, pat, bitmask_offset, bitmask_offset + 0x80)
        if should_prioritize_start is not None:
            break
    if should_prioritize_start is None:
        die("Could not find 'mov ecx/eax, 5' for ShouldPrioritize type 0/2 check")

    sp_va = va(should_prioritize_start, va_offset)
    print(f"  ShouldPrioritize type 0/2 check at VA 0x{sp_va:x}")

    # After mov ecx, 5: bt ecx, eax (0f a3 c1); jae prioritize (73 xx)
    bt2_offset = find_pattern_in_range(data, b'\x0f\xa3\xc1', should_prioritize_start + 5, should_prioritize_start + 10)
    if bt2_offset is None:
        die("Could not find 'bt ecx, eax' after mov ecx, 5")

    jae2_offset = bt2_offset + 3
    if data[jae2_offset] != 0x73:
        die(f"Expected JAE (0x73) after bt, got 0x{data[jae2_offset]:02x}")

    jae2_va = va(jae2_offset, va_offset)

    # Patch 2: JAE (catch-all) → redirect to skip_va
    new_rel2 = skip_va - (jae2_va + 2)
    if -128 <= new_rel2 <= 127:
        data[jae2_offset + 1] = new_rel2 & 0xff
        print(f"  PATCH 2: JAE at 0x{jae2_va:x} → 0x{skip_va:x} (offset 0x{new_rel2 & 0xff:02x})")
    else:
        die(f"JAE redirect offset {new_rel2} out of range for short jump")

    # After JAE: test byte [reg+xx], 0x40; je xx
    # The JE (0x74) jumps backwards to the skip/flag-processing path.
    # Find it by looking for 0x40 (kLeftButtonDown) followed shortly by 0x74 with
    # a negative relative offset.
    search_start = jae2_offset + 2
    search_end = search_start + 20
    je_offset = None

    # Find the 0x40 byte (kLeftButtonDown immediate) in the test instruction
    for i in range(search_start, search_end):
        if data[i] == 0x40:
            # Look for JE (0x74) in the next few bytes after the 0x40
            for j in range(i + 1, min(i + 4, search_end)):
                if data[j] == 0x74:
                    rel = struct.unpack_from('b', data, j + 1)[0]
                    if rel < 0:  # backwards jump = to the skip path
                        je_offset = j
                        break
            if je_offset is not None:
                break

    if je_offset is None:
        die("Could not find JE instruction after left button check")

    je_va = va(je_offset, va_offset)
    je_rel = struct.unpack_from('b', data, je_offset + 1)[0]
    je_target = je_va + 2 + je_rel
    print(f"  JE (left button) at VA 0x{je_va:x} → 0x{je_target:x}")

    # Patch 3: JE → JMP (unconditional)
    data[je_offset] = 0xeb
    print(f"  PATCH 3: JE → JMP at 0x{je_va:x} (74 → eb)")


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <electron_binary>")
        print()
        print("Patches an Electron binary to fix the 'aim freeze' bug")
        print("(Chromium issue 1455739) where holding left mouse button")
        print("with --disable-frame-rate-limit causes IPC starvation.")
        sys.exit(1)

    binary_path = sys.argv[1]
    if not os.path.isfile(binary_path):
        die(f"File not found: {binary_path}")

    print(f"Reading {binary_path} ({os.path.getsize(binary_path) / 1024 / 1024:.1f} MB)")
    with open(binary_path, 'rb') as f:
        data = bytearray(f.read())

    va_offset = parse_elf_text_offset(data)
    print(f".text VA offset: 0x{va_offset:x}")

    # Verify it's an Electron/Chromium binary
    if data.find(b"MainThreadSchedulerImpl") == -1:
        die("This doesn't appear to be an Electron/Chromium binary")

    # Check Chrome version
    chrome_ver = b"Chrome/"
    ver_idx = data.find(chrome_ver)
    if ver_idx != -1:
        ver_end = data.find(b' ', ver_idx)
        if ver_end == -1:
            ver_end = ver_idx + 30
        print(f"Detected: {data[ver_idx:ver_end].decode('ascii', errors='replace')}")

    # Create backup, or restore from it to ensure we patch a clean binary
    backup_path = binary_path + ".bak"
    if os.path.exists(backup_path):
        print(f"Restoring clean binary from {backup_path}")
        with open(backup_path, 'rb') as f:
            data = bytearray(f.read())
    else:
        shutil.copy2(binary_path, backup_path)
        print(f"Backup saved to {backup_path}")

    # Apply patches
    patch_compositor_handler(data, va_offset)
    patch_main_thread_handler(data, va_offset)

    # Write patched binary
    with open(binary_path, 'wb') as f:
        f.write(data)

    print(f"\n{'='*60}")
    print("Patch applied successfully!")
    print("ShouldPrioritizeInputEvent effectively returns false")
    print("in both compositor and main thread handlers.")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
