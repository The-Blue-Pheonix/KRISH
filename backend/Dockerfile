# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /code

# Copy the requirements file into the container
COPY app/requirements.txt .

# Install the required dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code into the container
COPY ./app /code/app

# Expose the port the app runs on (Render assigns the PORT env variable dynamically, but 8000 is a good default)
EXPOSE 8000

# Start the FastAPI application
# Using $PORT allows Render to dynamically allocate the port, defaulting to 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
