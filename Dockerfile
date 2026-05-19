FROM rust:alpine AS builder
ARG RUST_TARGET=x86_64-unknown-linux-musl
RUN rustup target add $RUST_TARGET
WORKDIR /app
COPY . .
RUN cargo build --release --target $RUST_TARGET -p tfcc-server \
 && strip /app/target/$RUST_TARGET/release/tfcc-server

FROM scratch
COPY --from=builder /app/target/*/release/tfcc-server /tfcc-server
ENTRYPOINT ["/tfcc-server"]
