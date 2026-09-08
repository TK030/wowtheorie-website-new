from PIL import Image
from pathlib import Path
import itertools


def phash(path, size=16):
    img = Image.open(path).convert('L').resize((size, size), Image.Resampling.LANCZOS)
    pixels = list(img.getdata())
    avg = sum(pixels) / len(pixels)
    return tuple(1 if p > avg else 0 for p in pixels)


def hamming(a, b):
    return sum(x != y for x, y in zip(a, b))


target = Path('img/geslaagde-leerlingen')
files = sorted([f for f in target.iterdir() if f.is_file()])
hashes = [(f.name, phash(f)) for f in files]
print('=== EXACT VISUAL DUPLICATES ===')
for (n1, h1), (n2, h2) in itertools.combinations(hashes, 2):
    if h1 == h2:
        print(f'{n1} == {n2}')
print('=== NEAR DUPLICATES <=10 ===')
for (n1, h1), (n2, h2) in itertools.combinations(hashes, 2):
    d = hamming(h1, h2)
    if 0 < d <= 10:
        print(f'{d}: {n1} == {n2}')
print('=== BEST SOURCE CANDIDATES ===')
source = Path('img/nieuwe geslaagde leerlingen')
source_files = sorted([f for f in source.iterdir() if f.is_file()])
sources = [(f.name, phash(f)) for f in source_files]
for sname, sh in sources:
    dists = [hamming(sh, th) for _, th in hashes]
    print(min(dists), sum(dists) / len(dists), sname)
