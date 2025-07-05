const hre = require("hardhat");

async function main() {
    const Verifier = await hre.ethers.deployContract("SemaphoreVerifier");
    await Verifier.waitForDeployment();

    console.log("Verifier deployed to:", await Verifier.getAddress());

    // örnek kök ekleyin (setRoot varsa):
    // await Verifier.setRoot("0x1234...");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
