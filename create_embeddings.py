import cv2
import os
import pickle
import numpy as np
from insightface.app import FaceAnalysis

app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=-1)

dataset_folder = "dataset"
all_students = {}

for student_name in os.listdir(dataset_folder):

    student_folder = os.path.join(dataset_folder, student_name)

    if not os.path.isdir(student_folder):
        continue

    embeddings = []

    print("\nProcessing:", student_name)

    for filename in os.listdir(student_folder):

        image_path = os.path.join(student_folder, filename)

        image = cv2.imread(image_path)

        if image is None:
            continue

        faces = app.get(image)

        if len(faces) == 0:
            print("No face found:", filename)
            continue

        embedding = faces[0].embedding
        embedding = embedding / np.linalg.norm(embedding)

        embeddings.append(embedding)

        print("Processed:", filename)

    if len(embeddings) > 0:
        all_students[student_name] = embeddings
        print("Total photos processed:", len(embeddings))

os.makedirs("embeddings", exist_ok=True)

with open("embeddings/students.pkl", "wb") as file:
    pickle.dump(all_students, file)

print("\n================================")
print("ALL EMBEDDINGS CREATED")
print("Students:", len(all_students))
print("================================")