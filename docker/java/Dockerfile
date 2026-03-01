# Java Backend Dockerfile
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY ChatServer.java ChatClient.java ./
RUN javac ChatServer.java ChatClient.java

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/*.class ./
EXPOSE 12345
CMD ["java", "ChatServer"]
