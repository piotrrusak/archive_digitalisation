FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /build

COPY backend/pom.xml .
RUN mvn -B dependency:go-offline

COPY backend/src ./src

RUN mvn -B package -DskipTests


FROM eclipse-temurin:17-jdk
WORKDIR /app

COPY --from=build /build/target/*jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
