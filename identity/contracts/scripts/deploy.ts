import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting EEG System deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy SemaphoreVerifier first
  console.log("\n📄 Deploying SemaphoreVerifier...");
  const SemaphoreVerifier = await ethers.getContractFactory("SemaphoreVerifier");
  const semaphoreVerifier = await SemaphoreVerifier.deploy();
  await semaphoreVerifier.waitForDeployment();
  const semaphoreVerifierAddress = await semaphoreVerifier.getAddress();
  console.log("✅ SemaphoreVerifier deployed to:", semaphoreVerifierAddress);

  // Deploy EEGRegistry
  console.log("\n📄 Deploying EEGRegistry...");
  const EEGRegistry = await ethers.getContractFactory("EEGRegistry");
  const eegRegistry = await EEGRegistry.deploy();
  await eegRegistry.waitForDeployment();
  const eegRegistryAddress = await eegRegistry.getAddress();
  console.log("✅ EEGRegistry deployed to:", eegRegistryAddress);

  // Deploy EEGVerifier
  console.log("\n📄 Deploying EEGVerifier...");
  const EEGVerifier = await ethers.getContractFactory("EEGVerifier");
  const eegVerifier = await EEGVerifier.deploy(semaphoreVerifierAddress, eegRegistryAddress);
  await eegVerifier.waitForDeployment();
  const eegVerifierAddress = await eegVerifier.getAddress();
  console.log("✅ EEGVerifier deployed to:", eegVerifierAddress);

  // Deploy EEGGroup
  console.log("\n📄 Deploying EEGGroup...");
  const EEGGroup = await ethers.getContractFactory("EEGGroup");
  const eegGroup = await EEGGroup.deploy(eegRegistryAddress);
  await eegGroup.waitForDeployment();
  const eegGroupAddress = await eegGroup.getAddress();
  console.log("✅ EEGGroup deployed to:", eegGroupAddress);

  // Save deployment addresses
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      SemaphoreVerifier: semaphoreVerifierAddress,
      EEGRegistry: eegRegistryAddress,
      EEGVerifier: eegVerifierAddress,
      EEGGroup: eegGroupAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const fileName = `deployment-${deploymentInfo.chainId}-${Date.now()}.json`;
  const filePath = path.join(deploymentsDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Deployment info saved to:", filePath);
  console.log("\n📍 Contract Addresses:");
  console.log("   SemaphoreVerifier:", semaphoreVerifierAddress);
  console.log("   EEGRegistry:      ", eegRegistryAddress);
  console.log("   EEGVerifier:      ", eegVerifierAddress);
  console.log("   EEGGroup:         ", eegGroupAddress);

  // Verify contracts on Etherscan if not on hardhat network
  const networkName = (await ethers.provider.getNetwork()).name;
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("\n🔍 To verify contracts on Etherscan, run:");
    console.log(`npx hardhat verify --network ${networkName} ${semaphoreVerifierAddress}`);
    console.log(`npx hardhat verify --network ${networkName} ${eegRegistryAddress}`);
    console.log(`npx hardhat verify --network ${networkName} ${eegVerifierAddress} ${semaphoreVerifierAddress} ${eegRegistryAddress}`);
    console.log(`npx hardhat verify --network ${networkName} ${eegGroupAddress} ${eegRegistryAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 