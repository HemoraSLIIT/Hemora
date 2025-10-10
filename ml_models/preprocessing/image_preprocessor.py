"""
Image preprocessing utilities for blood smear analysis
"""

import cv2
import numpy as np
from skimage import filters, morphology
from PIL import Image
import torch
from torchvision import transforms


class BloodSmearPreprocessor:
    """
    Preprocessing pipeline for blood smear images
    """
    
    def __init__(self, target_size=(224, 224)):
        self.target_size = target_size
        self.transform = transforms.Compose([
            transforms.Resize(target_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                               std=[0.229, 0.224, 0.225])
        ])
    
    def preprocess_image(self, image_path):
        """
        Preprocess a single blood smear image
        
        Args:
            image_path (str): Path to the image file
            
        Returns:
            torch.Tensor: Preprocessed image tensor
        """
        # Load image
        image = Image.open(image_path).convert('RGB')
        
        # Apply transformations
        tensor = self.transform(image)
        
        return tensor.unsqueeze(0)  # Add batch dimension
    
    def enhance_contrast(self, image):
        """
        Enhance contrast of blood smear image
        """
        # Convert to LAB color space
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        
        # Apply CLAHE to L channel
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        lab[:,:,0] = clahe.apply(lab[:,:,0])
        
        # Convert back to RGB
        enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        
        return enhanced
    
    def remove_noise(self, image):
        """
        Remove noise from blood smear image
        """
        # Apply bilateral filter
        filtered = cv2.bilateralFilter(image, 9, 75, 75)
        
        return filtered


if __name__ == "__main__":
    # Test preprocessing
    preprocessor = BloodSmearPreprocessor()
    print("Blood smear preprocessor initialized successfully")