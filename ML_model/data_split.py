import os
import shutil
import random

base = r"D:\Annotated Oyster Mushroom Images"

src_immature = r"D:\Annotated Oyster Mushroom Images\Maturity Labelled Images and Annotation Files\Immature"
src_mature = r"D:\Annotated Oyster Mushroom Images\Maturity Labelled Images and Annotation Files\Mature"

out_base = os.path.join(base, "data")

# create folders
for path in [
    "train/Immature",
    "train/Mature",
    "test/Immature",
    "test/Mature"
]:
    os.makedirs(os.path.join(out_base, path), exist_ok=True)

def split(src, train_dest, test_dest):
    files = [f for f in os.listdir(src) if f.lower().endswith((".jpg",".png",".jpeg"))]
    random.shuffle(files)

    split_index = int(0.8 * len(files))
    train_files = files[:split_index]
    test_files = files[split_index:]

    for f in train_files:
        shutil.copy(os.path.join(src, f), os.path.join(train_dest, f))

    for f in test_files:
        shutil.copy(os.path.join(src, f), os.path.join(test_dest, f))

split(src_immature,
      os.path.join(out_base,"train/Immature"),
      os.path.join(out_base,"test/Immature"))

split(src_mature,
      os.path.join(out_base,"train/Mature"),
      os.path.join(out_base,"test/Mature"))

print("DONE. Check inside:", out_base)