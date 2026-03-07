# How the ML Model Integration Works
### Plain English Explanation

---

## The Big Picture

Think of it like a restaurant.

- The **frontend** (your React app) is the customer placing an order.
- The **Django API** (your backend) is the waiter taking the order.
- The **ML model** is the kitchen that actually prepares the food.
- The **model weight file (.pt file)** is the recipe the kitchen uses.

When someone uploads a blood smear image through the app, the waiter (API) takes it
to the kitchen (ML model), the kitchen cooks the result, and the waiter brings the
answer back to the customer.

---

## What the ML Model Actually Is

Your YOLO model is just a file. A `.pt` file (PyTorch file).

This file was created when you trained the model in Jupyter Notebook. It contains
everything the model learned — millions of numbers that represent its "knowledge"
about what leukemia cells and thalassemia cells look like under a microscope.

Without this file, the model cannot run. It's like a recipe book without the recipe.

---

## Where the Model File Needs to Go

On your local computer, you need to place your trained `.pt` files in this folder:

```
Hemora/
└── data/
    └── models/
        ├── all_yolo_model.pt           ← your ALL (Leukemia) model
        └── thalassemia_yolo_model.pt   ← your Thalassemia model
```

That's the folder the API looks inside every time it needs to run a diagnosis.
You don't need to change any code — just put the files there with those exact names.

---

## Step by Step: What Happens When You Send a Request

Let's say a doctor uploads a blood smear image and clicks "Diagnose".

**Step 1 — The image travels to the API**
The blood smear image and CBC values (like WBC count, hemoglobin level, etc.)
are sent from the browser to your Django API running on localhost:8000.

**Step 2 — The API checks if you're logged in**
The API checks your JWT token. If you're not logged in, it rejects the request.

**Step 3 — The API creates a record in the database**
Before doing anything else, it saves a row in the database that says
"a diagnosis request was received, status: PENDING". This is like a ticket number.

**Step 4 — The API sends the image to the ML model**
The API passes the image to the inference code (the code we wrote in
ml_models/inference/). This code loads your .pt file and feeds the image into it.

**Step 5 — The YOLO model reads the image**
The model looks at the blood smear image pixel by pixel. It has seen thousands of
similar images during training, so it recognizes patterns — shapes of cells, how
they are colored, how they are clustered together.

**Step 6 — The model gives a confidence score**
The model does not give a simple yes/no answer. It gives a probability.
For example: "I am 94% sure this is NOT leukemia, and 6% sure it IS leukemia."
This runs once for ALL (Leukemia) and once for Thalassemia.

**Step 7 — The API saves the results**
The results are saved to the database row that was created in Step 3.
The status changes from PENDING to COMPLETED.
The image itself is NOT saved — only the numbers (predictions and CBC data).

**Step 8 — The API sends the answer back**
The doctor sees the predictions in the browser — which disease was detected
and with what level of confidence.

---

## The Two Model Files Explained

### all_yolo_model.pt
This model was trained to detect Acute Lymphoblastic Leukemia (ALL).
It looks at a blood smear image and says one of two things:
- **ALLNeg** — No leukemia detected (negative)
- **ALLPos** — Leukemia detected (positive)

### thalassemia_yolo_model.pt
This model was trained to detect Beta Thalassemia.
It looks at the same image and says:
- **Normal** — No thalassemia detected
- **Thalassemia** — Thalassemia detected

Both models run on every single image that is submitted. So you always get
results for both diseases in one request.

---

## Why the Model is Loaded Only Once

Loading a model from a .pt file takes a few seconds.

If the API loaded the model fresh every time someone made a request, it would be
very slow. Instead, the first time a request comes in, the model is loaded into
memory (RAM) and kept there. Every request after that uses the already-loaded
model. This is called "caching" and it makes the API much faster.

---

## What "YOLO" Means in This Context

YOLO stands for "You Only Look Once". It is a type of AI model that was originally
built to detect objects in images very quickly.

Your notebooks adapted it to classify blood cell images. Instead of detecting
"there is a cat in this photo", it detects "these blood cells show signs of leukemia".

The version used here is YOLOv8 or YOLOv11 (Ultralytics library), which is
state-of-the-art and runs fast even on a regular laptop CPU.

---

## Do You Need a GPU?

No, not for running predictions (inference). A regular laptop CPU is fine.

You only need a GPU for training the model (teaching it from scratch using
thousands of images). The training is done in your Jupyter notebooks.

Once the model is trained and saved as a .pt file, running predictions on
new images is fast even without a GPU.

---

## What Happens If a Model File is Missing

If you haven't placed the .pt file in the data/models/ folder yet, the API
does not crash. It still responds, but the result for that disease will
show an error message like "Model file not found" instead of a prediction.

This means you can test the whole registration, login, and API flow without
having a trained model. Once you're ready, you just drop the .pt files in
and it starts working automatically.

---

## The CBC Data — What Is It Used For?

CBC stands for Complete Blood Count. It includes values like:
- WBC (White Blood Cell count)
- RBC (Red Blood Cell count)
- Hemoglobin level
- Platelet count
- And others

Right now, the CBC values are stored alongside the results in the database
so doctors can see what the patient's numbers were at the time of the test.

The YOLO models themselves only look at the image — they do not use the
CBC numbers to make their prediction. The CBC data is purely for record-keeping
and context. In a future version, a separate model could combine both the image
and CBC numbers for a more accurate diagnosis.

---

## Summary in One Paragraph

You train your YOLO model in Jupyter Notebook. That saves a .pt file.
You put that .pt file into the data/models/ folder on your computer.
When your Django API server is running and someone sends a blood smear image
through the app, the API picks up that image, passes it through the .pt file,
gets a confidence score back, saves everything to the database, and returns
the prediction to the user. The image is never stored. Only the numbers are.

---

## Checklist Before Testing

- [ ] Your Django server is running (`python manage.py runserver`)
- [ ] Your database is running (PostgreSQL via Docker or local install)
- [ ] You have run `python manage.py migrate` at least once
- [ ] You have placed `all_yolo_model.pt` in `data/models/`
- [ ] You have placed `thalassemia_yolo_model.pt` in `data/models/`
- [ ] You have installed `ultralytics` (`pip install ultralytics`)
- [ ] You have a user account and a valid JWT token from the login endpoint
