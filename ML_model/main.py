import os
import copy
from typing import List, Tuple

import torch
import torch.nn as nn
import torch.optim as optim
from PIL import Image
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
from torchvision.models import ResNet18_Weights


TRAIN_DIR = r"D:\mushroom-prediction\data\train"
TEST_DIR = r"D:\mushroom-prediction\data\test"
MODEL_DIR = r"D:\mushroom-prediction\models"
MODEL_PATH = r"D:\mushroom-prediction\models\model.pkl"

IMAGE_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 10
LEARNING_RATE = 1e-3

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

_loaded_model = None
_loaded_class_names = None
_loaded_device = None


def _get_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def _get_transforms() -> Tuple[transforms.Compose, transforms.Compose]:
    train_transform = transforms.Compose(
        [
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(degrees=15),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.02),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )
    eval_transform = transforms.Compose(
        [
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )
    return train_transform, eval_transform


def _create_model(num_classes: int) -> nn.Module:
    try:
        weights = ResNet18_Weights.DEFAULT
        model = models.resnet18(weights=weights)
    except Exception:
        model = models.resnet18(weights=None)

    for param in model.parameters():
        param.requires_grad = False

    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    return model


def _evaluate(model: nn.Module, loader: DataLoader, device: torch.device) -> float:
    model.eval()
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)
            outputs = model(images)
            preds = torch.argmax(outputs, dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

    return (correct / total) * 100.0 if total > 0 else 0.0


def train_model() -> None:
    device = _get_device()
    train_transform, eval_transform = _get_transforms()

    train_dataset = datasets.ImageFolder(root=TRAIN_DIR, transform=train_transform)
    val_dataset = datasets.ImageFolder(root=TEST_DIR, transform=eval_transform)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    class_names: List[str] = train_dataset.classes
    model = _create_model(num_classes=len(class_names)).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.fc.parameters(), lr=LEARNING_RATE)

    best_state = copy.deepcopy(model.state_dict())
    best_val_acc = 0.0

    for epoch in range(EPOCHS):
        model.train()
        running_correct = 0
        running_total = 0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            preds = torch.argmax(outputs, dim=1)
            running_correct += (preds == labels).sum().item()
            running_total += labels.size(0)

        train_acc = (running_correct / running_total) * 100.0 if running_total > 0 else 0.0
        val_acc = _evaluate(model, val_loader, device)

        print(f"Epoch [{epoch + 1}/{EPOCHS}] - Train Accuracy: {train_acc:.2f}% | Validation Accuracy: {val_acc:.2f}%")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state = copy.deepcopy(model.state_dict())

    model.load_state_dict(best_state)

    os.makedirs(MODEL_DIR, exist_ok=True)
    checkpoint = {
        "model_name": "resnet18",
        "state_dict": model.state_dict(),
        "class_names": class_names,
        "image_size": IMAGE_SIZE,
        "mean": IMAGENET_MEAN,
        "std": IMAGENET_STD,
    }
    torch.save(checkpoint, MODEL_PATH)
    print(f"Model saved to: {MODEL_PATH}")


def _load_saved_model() -> Tuple[nn.Module, List[str], torch.device]:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Saved model not found at: {MODEL_PATH}")

    device = _get_device()
    checkpoint = torch.load(MODEL_PATH, map_location=device)
    class_names = checkpoint["class_names"]

    model = _create_model(num_classes=len(class_names))
    model.load_state_dict(checkpoint["state_dict"])
    model.to(device)
    model.eval()

    return model, class_names, device


def predict_image(image_path: str) -> str:
    global _loaded_model, _loaded_class_names, _loaded_device

    if _loaded_model is None or _loaded_class_names is None or _loaded_device is None:
        _loaded_model, _loaded_class_names, _loaded_device = _load_saved_model()

    _, eval_transform = _get_transforms()

    image = Image.open(image_path).convert("RGB")
    image_tensor = eval_transform(image).unsqueeze(0).to(_loaded_device)

    with torch.no_grad():
        outputs = _loaded_model(image_tensor)
        pred_idx = torch.argmax(outputs, dim=1).item()

    return _loaded_class_names[pred_idx]


if __name__ == "__main__":
    train_model()