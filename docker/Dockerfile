# Use nginx:alpine for a small, efficient image
FROM nginx:alpine

# Copy the application files to the default nginx html directory
COPY . /usr/share/nginx/html

# The standard nginx image provides a healthy default config,
# but we could customize it here if needed.

# Expose port 80 for web traffic
EXPOSE 80

# The base image already has a CMD to start nginx
