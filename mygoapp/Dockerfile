FROM golang:1.14-alpine AS builder

WORKDIR /go/src/app
COPY main.go .

RUN go build -o webserver .

FROM alpine
WORKDIR /app
COPY --from=builder /go/src/app /app/

CMD ["./webserver"]
EXPOSE 8080
