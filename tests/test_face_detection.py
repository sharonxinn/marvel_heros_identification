import unittest
from PIL import Image

from backend.app import crop_largest_face


class FaceDetectionFallbackTests(unittest.TestCase):
    def test_falls_back_to_center_crop_when_no_face_is_detected(self):
        image = Image.new("RGB", (220, 220), color=(120, 120, 120))
        face = crop_largest_face(image)
        self.assertEqual(face.shape[0] > 0, True)
        self.assertEqual(face.shape[1] > 0, True)
        self.assertEqual(face.shape[2], 3)


if __name__ == "__main__":
    unittest.main()
