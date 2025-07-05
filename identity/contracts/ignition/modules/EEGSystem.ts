import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const EEGSystemModule = buildModule("EEGSystemModule", (m) => {
  // Deploy SemaphoreVerifier first (dependency)
  const semaphoreVerifier = m.contract("SemaphoreVerifier");

  // Deploy EEGRegistry
  const eegRegistry = m.contract("EEGRegistry");

  // Deploy EEGVerifier with SemaphoreVerifier and EEGRegistry addresses
  const eegVerifier = m.contract("EEGVerifier", [
    semaphoreVerifier,
    eegRegistry
  ]);

  // Deploy EEGGroup with EEGRegistry address
  const eegGroup = m.contract("EEGGroup", [eegRegistry]);

  return {
    semaphoreVerifier,
    eegRegistry,
    eegVerifier,
    eegGroup,
  };
});

export default EEGSystemModule; 