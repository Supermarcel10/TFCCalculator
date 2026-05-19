FROM rust:alpine AS builder
WORKDIR /app
COPY . .
RUN cargo build --release -p tfcc-server \
 && strip /app/target/release/tfcc-server

FROM scratch
COPY --from=builder /app/target/release/tfcc-server /tfcc-server
ENTRYPOINT ["/tfcc-server"]
