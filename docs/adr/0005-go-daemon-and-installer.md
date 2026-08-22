# ADR 0005: Native Daemon in Go & Installer via Inno Setup

## Context
The Native Messaging Host (the daemon) was originally written in Node.js (daemon.js) to parse incoming JSON from the Firefox extension and spawn xray.exe. This required users to have Node.js installed or required bundling a heavy (~50MB) executable via pkg. 
Furthermore, the installation process relied on manual execution of a PowerShell script to set Windows Registry keys, which is error-prone and non-standard for general users.

## Decision
1. **Go Wrapper:** Rewrite the Native Messaging Host in Go. Go compiles to small, standalone, dependency-free executables (2-3 MB) and provides robust, low-level I/O operations (crucial for exactly parsing the 4-byte length headers required by Mozilla's Native Messaging Protocol).
2. **Inno Setup:** Use Inno Setup to package the compiled Go wrapper, xray.exe, and the extension manifest into a standard Windows Installer (.exe). The installer will handle file extraction and Windows Registry modifications reliably.

## Consequences
- **Pros:** Zero dependencies for end users. A professional, one-click installation experience. Minimal footprint. Safe and strict memory handling of the I/O protocol preventing chunk-tearing bugs.
- **Cons:** Requires the Go compiler and Inno Setup compiler (ISCC) in the developer's CI/CD pipeline or local environment to build the release.