{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
    nativeBuildInputs = with pkgs.buildPackages; [
        # START General
        git
        gh
        # END General

        # START Node.js
        pnpm
        nodejs_22
        # END Node.js

        # START Rust
        cargo
        rustc
        rustfmt
        clippy
        # END Rust
    ];

    shellHook = ''
        git fetch
        pnpm install
    '';
}
