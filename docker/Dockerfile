FROM openjdk:17-jdk-slim
WORKDIR /app
RUN mkdir -p /app/files
COPY backend/target/backend-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
