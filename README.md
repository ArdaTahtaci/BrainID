# Neural Identity Verification System

## 📌 Overview
The **Neural Identity Verification System** introduces a groundbreaking method of digital identity verification using **EEG brainwave patterns** instead of traditional biometric identifiers. By combining **neuroscience** and **blockchain technology**, it delivers a **non-invasive**, **privacy-preserving**, and **zero-knowledge proof (ZKP)** based verification method.

Inspired by concepts like *World Chain’s Proof of Humanity* (iris scanning), this system replaces invasive scans with **secure neural signatures**, offering **complete anonymity** without sacrificing authenticity.

---

## 🚀 Core Components

### 1. Smart Contract Layer (Base Sepolia)
- **EEGRegistry.sol** – Stores hashed neural identity commitments, manages registration & verification.
- **EEGGroup.sol** – Handles group membership via Semaphore protocol, enabling anonymous interactions.
- **EEGVerifier.sol** – Verifies ZK proofs without revealing biometric data.

**Highlights:**
- Poseidon hash for zk-SNARK compatibility  
- Merkle tree for secure identity commitment storage  
- Access control for authorized verifiers  

---

### 2. Backend API (Node.js / Express)
**Port:** `8000` – 8 REST endpoints

- **Merkle Tree Ops:** `POST /api/merkle/add`, `GET /api/merkle/root`
- **Proof Generation:** `POST /api/proof/identity/create`, `POST /api/proof/group/add-member`
- **Verification:** `POST /api/proof/humanity`
- **Health Checks:** `GET /api/health`

**Tech Stack:**
- **Semaphore Protocol** for ZK proofs  
- **Poseidon Hash** for efficiency  
- **LevelDB** for persistent storage  
- CORS-enabled for frontend integration  

---

### 3. EEG Processing Server (Python / Flask)
**Port:** `5000` – Neural data handling & transformation

- **Signal Processing:** Converts raw EEG → 280 neural features → 2KB biometric key
- **Live Streaming:** Real-time 8-channel EEG visualization via Socket.IO
- **Feature Extraction:** Frequency bands (Delta, Theta, Alpha, Beta, Gamma) with noise filtering

---

### 4. Frontend (Next.js / React)
**Port:** `3001` – Modern, real-time interface

- **EEG Dashboard:** Live waveforms, frequency analysis, ESP32 status  
- **Blockchain UI:** Wallet connection (RainbowKit), transaction monitoring  
- **Design:** Glass-morphism, animated loading states, real-time updates

---

## 🔒 Zero-Knowledge Privacy Architecture
- **Identity Commitment Flow:**
- - **Anonymous Verification:** Users prove humanity without revealing personal data  
- Resistant to correlation & pattern-matching attacks  

---

## 🔄 System Flow
1. **Neural Capture** – ESP32 records 8-channel EEG
2. **Signal Processing** – Python server extracts neural features
3. **Key Generation** – Biometric key produced
4. **Blockchain Registration** – Commitment added to Merkle tree
5. **ZK Proof Creation** – Semaphore generates verification proof
6. **Verification** – Proof validated on-chain
7. **Anonymous Group Interaction** – Verified users join ZK-protected groups

---

## 📊 Technical Specs
- **EEG Sampling Rate:** 100Hz (8 channels)  
- **Feature Extraction:** 280 parameters  
- **Key Size:** 2KB biometric key  
- **ZK Proof Gen:** ~2–3 sec  
- **Blockchain Confirmation:** ~3.5 sec (demo-optimized)

---

## ⚙️ Scalability & Production Readiness
- Modular architecture for independent scaling  
- Blockchain-agnostic (EVM-compatible)  
- Compatible with multiple EEG hardware devices  
- Efficient storage with LevelDB  

---

## 🛠 How We Built It

### Smart Contract Layer
- Solidity on **Base Sepolia** for low-cost testing
- Integrated **Semaphore** for ZK-based verification

### Backend API
- Node.js & TypeScript for reliability  
- LevelDB for Merkle tree persistence  
- Stateless endpoints for horizontal scaling

### EEG Processing Server
- Python (NumPy, SciPy) for advanced signal processing  
- Biometric key algorithm ensures reproducibility despite EEG noise  
- Socket.IO for live data streaming

### Frontend
- Next.js 14 + TypeScript + TailwindCSS  
- Real-time EEG visualization with Socket.IO  
- Wallet integration via RainbowKit & Wagmi  

---

## 🧠 Challenges & Solutions
- **Semaphore Integration** – Deep understanding of ZK proofs required  
- **Real-Time Streaming** – Implemented robust Socket.IO reconnection logic  
- **CORS Issues** – Resolved with proper proxy & `flask-cors` config  
- **Biometric Consistency** – Custom algorithm to stabilize EEG-based keys  

---

## 🤝 Key Partner Technologies
- **Semaphore Protocol** – ZK identity verification  
- **RainbowKit** – Wallet integration  
- **LevelDB** – High-performance Merkle tree storage  
- **Socket.IO** – Real-time cross-service communication  

---

## 📚 Lessons Learned
- Deepened expertise in **zk-SNARKs** and privacy-preserving cryptography  
- Gained advanced EEG signal processing knowledge  
- Improved real-time data coordination across multi-service architectures  

---

## 🏆 Conclusion
The **Neural Identity Verification System** is a fully-functional, privacy-preserving alternative to traditional biometric authentication, blending **neuroscience**, **cryptography**, and **blockchain** into a seamless, scalable solution.


