import cv2
from insightface.app import FaceAnalysis

app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=-1)

image = cv2.imread("test_images/classroom.jpg")

faces = app.get(image)

print("Number of faces detected:", len(faces))

for face in faces:
    x1, y1, x2, y2 = face.bbox.astype(int)

    cv2.rectangle(
        image,
        (x1, y1),
        (x2, y2),
        (0, 255, 0),
        2
    )

cv2.imwrite("test_images/result.jpg", image)

print("Result saved successfully.")