# DeepTruth

A platform for creating verifiable, tamper-proof videos using blockchain technology and steganography.

## Overview

DeepTruth combats the rise of deepfakes by creating videos with embedded verification markers that prove authenticity. By leveraging World ID for human verification, ENS for digital identity, and Self Protocol for real-world identity verification, DeepTruth establishes an unbreakable chain of trust from creator to content.

## Key Features

- **Tamper-Proof Videos**: Embeds both visible and invisible steganographic markers in videos
- **Human Verification**: Requires World ID proof for all video creators
- **Real Identity Integration**: Uses Self Protocol to verify creator's legal name and nationality
- **Non-Transferable Identity**: Creates ENS subnames tied to verified identities
- **Cross-Platform Verification**: Videos can be verified anywhere, even after sharing

## How It Works

1. Users verify their humanity with World ID
2. Self Protocol verifies their government ID, extracting name and nationality
3. A non-transferable ENS subname is minted based on their verified identity
4. Videos created are embedded with verification markers linked to their ENS identity
5. Anyone can verify video authenticity by checking these embedded markers

## Contract Addresses

- **ENS Registry**: [0x2565b1f8bfd174d3acb67fd1a377b8014350dc26](Ethereum Mainnet)
- **ENS Registrar**: [0x3Df0C30a02221FAb4fbdE6Ae7dd288F00F563bBF] (World ID Mainnet)
- **World Video Registry**: [0xCd0838dBb89975aDc8eD8d8bd262bC72EC10EC00] (World ID Mainnet)

## Technologies

- **Frontend**: Next.js, React, TailwindCSS
- **Video Processing**: Python, OpenCV, Steganography algorithms
- **Identity**: World ID, Self Protocol
- **Blockchain**: ENS, Ethereum

## Why It Matters

In an era where AI-generated media is increasingly indistinguishable from reality, DeepTruth provides a mechanism to maintain trust in digital content. By creating an immutable link between verified humans and the content they create, we establish a foundation for authentic digital media.
