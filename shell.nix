{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
    nativeBuildInputs = with pkgs.buildPackages; [
        git
        gh
        pnpm
        nodejs_22
    ];

    shellHook = ''
        git fetch
        pnpm install
    '';
}