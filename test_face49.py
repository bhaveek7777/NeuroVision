import cv2
import pickle
import numpy as np
from insightface.app import FaceAnalysis

app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=-1, det_size=(1280, 1280))

with open("embeddings/students.pkl", "rb") as file:
    data = pickle.load(file)

student_name = data["name"]
reference_embeddings = data["embeddings"]

image = cv2.imread("test_images/group.jpg")

if image is None:
    print("ERROR: group.jpg not found")
    exit()

scale = 2

large_image = cv2.resize(
    image,
    None,
    fx=scale,
    fy=scale,
    interpolation=cv2.INTER_CUBIC
)

faces = app.get(large_image)

print("Total faces:", len(faces))

face = faces[48]

x1, y1, x2, y2 = face.bbox.astype(int)

x1 = int(x1 / scale)
y1 = int(y1 / scale)
x2 = int(x2 / scale)
y2 = int(y2 / scale)

crop = image[y1:y2, x1:x2]

if crop.size == 0:
    print("ERROR: Could not crop Face 49")
    exit()

large_crop = cv2.resize(
    crop,
    None,
    fx=5,
    fy=5,
    interpolation=cv2.INTER_CUBIC
)

cv2.imwrite(
    "test_images/face49_enlarged.jpg",
    large_crop
)

print("Face 49 crop saved.")

crop_faces = app.get(large_crop)

print("Faces detected in enlarged crop:", len(crop_faces))

if len(crop_faces) == 0:
    print("Could not detect face again.")
    exit()

test_embedding = crop_faces[0].embedding
test_embedding = test_embedding / np.linalg.norm(test_embedding)

best_similarity = -1

for reference in reference_embeddings:

    similarity = np.dot(reference, test_embedding)

    if similarity > best_similarity:
        best_similarity = similarity

print("Student:", student_name)
print("Face 49 similarity:", round(float(best_similarity), 3))